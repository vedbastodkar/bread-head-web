#!/usr/bin/env python3
"""
Transcode the SwiftUI curriculum (Lessons/Data/Unit*/Unit*Lesson*Data.swift)
into a single JSON file the web LessonPlayer consumes.

Parses each `AnyView(TypeSlide( ...args ))` into the neutral slide schema,
using the LessonDefinition `slides: [...]` array for ordering.

Usage:
    python3 scripts/transcode_lessons.py <path-to-Lessons/Data> <out.json>
"""
import json
import re
import sys
import glob
import os

# ---------- tiny tokenizer/parser for Swift literal args ----------
class P:
    def __init__(self, s):
        self.s = s
        self.i = 0
        self.n = len(s)

    def ws(self):
        while self.i < self.n:
            c = self.s[self.i]
            if c in ' \t\r\n,':
                self.i += 1
            elif c == '/' and self.i + 1 < self.n and self.s[self.i+1] == '/':
                while self.i < self.n and self.s[self.i] != '\n':
                    self.i += 1
            else:
                break

    def value(self):
        self.ws()
        if self.i >= self.n:
            return None
        c = self.s[self.i]
        if c == '"':
            return self.string()
        if c == '[':
            return self.collection()
        if c == '(':
            return self.tuple_()
        if c == '.':
            # bare Swift enum case, e.g. `.text` -> "text"
            m2 = re.match(r'\.[A-Za-z_]\w*', self.s[self.i:])
            if m2:
                self.i += len(m2.group(0))
                return m2.group(0)[1:]
        # bareword: nil / true / false / number / identifier
        m = re.match(r'[A-Za-z_][A-Za-z0-9_.]*|-?\d+(\.\d+)?', self.s[self.i:])
        tok = m.group(0)
        self.i += len(tok)
        if tok == 'nil':
            return None
        if tok == 'true':
            return True
        if tok == 'false':
            return False
        if re.fullmatch(r'-?\d+', tok):
            return int(tok)
        if re.fullmatch(r'-?\d+\.\d+', tok):
            return float(tok)
        return tok  # identifier reference (rare)

    def string(self):
        assert self.s[self.i] == '"'
        self.i += 1
        out = []
        while self.i < self.n:
            c = self.s[self.i]
            if c == '\\':
                nxt = self.s[self.i+1]
                out.append({'n': '\n', 't': '\t', '"': '"', '\\': '\\'}.get(nxt, nxt))
                self.i += 2
            elif c == '"':
                self.i += 1
                break
            else:
                out.append(c)
                self.i += 1
        return ''.join(out)

    def collection(self):
        # '[' ... ']' -> list, OR dict when "key": value pairs at top level
        assert self.s[self.i] == '['
        self.i += 1
        items = []
        is_dict = False
        dict_out = {}
        while True:
            self.ws()
            if self.s[self.i] == ']':
                self.i += 1
                break
            v = self.value()
            self.ws()
            if self.s[self.i] == ':':
                # dict entry: v is key
                self.i += 1
                val = self.value()
                dict_out[v] = val
                is_dict = True
            else:
                items.append(v)
        return dict_out if is_dict else items

    def tuple_(self):
        # '(' label: value, ... ')' -> dict
        assert self.s[self.i] == '('
        self.i += 1
        out = {}
        while True:
            self.ws()
            if self.s[self.i] == ')':
                self.i += 1
                break
            m = re.match(r'\s*([A-Za-z_]\w*)\s*:', self.s[self.i:])
            if m:
                label = m.group(1)
                self.i += m.end()
                out[label] = self.value()
            else:
                # positional tuple element — collect under index
                out[str(len(out))] = self.value()
        return out

    def args(self):
        # parse labeled args of a constructor: label: value, ...
        out = {}
        while True:
            self.ws()
            if self.i >= self.n or self.s[self.i] == ')':
                break
            m = re.match(r'\s*([A-Za-z_]\w*)\s*:', self.s[self.i:])
            if not m:
                break
            label = m.group(1)
            self.i += m.end()
            out[label] = self.value()
        return out


def parse_args(argstr):
    return P(argstr).args()


def parse_value(valstr):
    return P(valstr).value()


# ---------- balanced-paren extraction ----------
def extract_balanced(s, start):
    """s[start] == '(' ; return (inner, end_index_after_close)."""
    depth = 0
    i = start
    in_str = False
    while i < len(s):
        c = s[i]
        if in_str:
            if c == '\\':
                i += 2
                continue
            if c == '"':
                in_str = False
        else:
            if c == '"':
                in_str = True
            elif c == '(':
                depth += 1
            elif c == ')':
                depth -= 1
                if depth == 0:
                    return s[start+1:i], i+1
        i += 1
    return s[start+1:], len(s)


# ---------- slide mapping ----------
def first(*vals):
    for v in vals:
        if v not in (None, ''):
            return v
    return None


def img(name):
    """Map a Swift asset ref like 'LessonContent/Unit2/Lesson1/slide1' -> web path."""
    if isinstance(name, str) and name.startswith('LessonContent/'):
        return '/lessonContent/' + name[len('LessonContent/'):] + '.png'
    return None


def resolve_consts(v, consts):
    """Replace identifier strings that reference file-level `let X = "..."` constants."""
    if isinstance(v, str):
        return consts.get(v, v)
    if isinstance(v, list):
        return [resolve_consts(x, consts) for x in v]
    if isinstance(v, dict):
        return {k: resolve_consts(x, consts) for k, x in v.items()}
    return v


def map_slide(typ, a):
    t = typ
    if t == 'TitleSlide':
        image = None if a.get('isIcon') else img(a.get('imageName'))
        return {'type': 'title', 'title': a.get('title', ''), 'subtitle': a.get('subtitle'), 'detailText': a.get('detailText'), 'image': image}
    if t == 'ObjectivesSlide':
        return {'type': 'objectives', 'headerTitle': a.get('headerTitle', 'Objectives'), 'subheader': a.get('subheader'), 'objectives': a.get('objectives', []), 'image': img(a.get('headerImage'))}
    if t == 'PollSlide':
        opts = [a.get(k) for k in ('optionA', 'optionB', 'optionC', 'optionD', 'optionE', 'optionF')]
        opts = [o for o in opts if o]
        return {'type': 'poll', 'title': a.get('title', ''), 'options': opts, 'afterVoting': a.get('afterVoting', '')}
    if t == 'BadHabitWarningSlide':
        return {'type': 'badHabitWarning', 'habits': a.get('habits', []), 'whyBadExplanations': a.get('whyBadExplanations', [])}
    if t == 'ReflectPromptSlide':
        return {'type': 'reflectPrompt', 'prompt': a.get('prompt', ''), 'mainTitle': a.get('mainTitle'), 'eyebrow': a.get('eyebrow')}
    if t == 'RecapSlide':
        return {'type': 'recap', 'title': a.get('title'), 'eyebrow': a.get('eyebrow'), 'subline': a.get('subline'), 'takeaways': a.get('takeaways', []), 'image': img(a.get('recapImage'))}
    if t == 'TermDefinitionSlide':
        return {'type': 'termDefinition', 'term': a.get('term', ''), 'definition': a.get('definition', '')}
    if t == 'TrueOrFalseSlide':
        return {'type': 'trueFalse', 'question': a.get('question', ''), 'correctAnswer': bool(a.get('correctAnswer')), 'explanation': a.get('explanation', '')}
    if t == 'MultipleChoiceSlide':
        idx = a.get('correctAnswerIndices')
        if idx is None:
            ci = a.get('correctAnswerIndex')
            idx = [ci] if ci is not None else []
        return {'type': 'multipleChoice', 'title': a.get('title'), 'question': a.get('question', ''), 'options': a.get('options', []), 'correctAnswerIndices': idx, 'explanations': a.get('explanations', [])}
    if t == 'IconBreakdownSlide':
        items = [{'icon': it.get('icon', ''), 'title': it.get('title', ''), 'description': it.get('description', '')} for it in a.get('items', [])]
        return {'type': 'iconBreakdown', 'title': a.get('title', ''), 'items': items}
    if t == 'StepByStepSlide':
        return {'type': 'stepByStep', 'title': a.get('title', ''), 'steps': a.get('steps', []), 'subtitle': a.get('subtitle'), 'eyebrow': a.get('eyebrow')}
    if t == 'RealLifeScenarioSlide':
        return {'type': 'realLifeScenario', 'scenario': a.get('scenario', ''), 'question': a.get('question', ''), 'options': a.get('options', []), 'correctAnswerIndex': a.get('correctAnswerIndex', 0), 'explanations': a.get('explanations', [])}
    if t == 'ThisOrThatSlide':
        return {'type': 'thisOrThat', 'title': a.get('title', ''), 'optionA': a.get('optionA', ''), 'optionB': a.get('optionB', ''), 'consequenceA': a.get('consequenceA', ''), 'consequenceB': a.get('consequenceB', '')}
    if t == 'MythBustingSlide':
        return {'type': 'mythBusting', 'myth': a.get('myth', ''), 'truth': a.get('truth', '')}
    if t == 'ProsAndConsSlide':
        pros = [{'title': p.get('title', ''), 'description': p.get('description', '')} for p in a.get('pros', [])]
        cons = [{'title': c.get('title', ''), 'description': c.get('description', '')} for c in a.get('cons', [])]
        return {'type': 'prosAndCons', 'title': a.get('title', ''), 'pros': pros, 'cons': cons}
    if t == 'ContextualComparisonSlide':
        return {'type': 'contextualComparison', 'title': a.get('title', ''), 'leftTitle': a.get('leftTitle', ''), 'leftBody': a.get('leftBody', ''), 'rightTitle': a.get('rightTitle', ''), 'rightBody': a.get('rightBody', ''), 'eyebrow': a.get('eyebrow'), 'footer': a.get('footer')}
    if t == 'TapToRevealSlide':
        return {'type': 'tapToReveal', 'title': a.get('title'), 'prompt': a.get('prompt', ''), 'revealedContent': a.get('revealedContent', '')}
    if t == 'VisualAnalogySlide':
        ctx = []
        for k in ('A', 'B', 'C'):
            text = a.get(f'context{k}Text'); label = a.get(f'context{k}Label'); emoji = a.get(f'context{k}Emoji')
            if text or label or emoji:
                ctx.append({'text': text or '', 'label': label or '', 'emoji': emoji or ''})
        return {'type': 'visualAnalogy', 'title': a.get('title'), 'subtitle': a.get('subtitle'), 'contexts': ctx}
    if t == 'ImageSlide':
        return {'type': 'image', 'title': a.get('title', ''), 'caption': a.get('caption'), 'image': img(a.get('imageName'))}
    if t == 'InteractiveGrowthVisualSlide':
        tf = a.get('timeFrame') or ''
        mtf = re.search(r'\d+', str(tf))
        time_years = int(mtf.group()) if mtf else 20
        def num(v, d=0.0):
            try:
                return float(v)
            except (TypeError, ValueError):
                return d
        return {
            'type': 'interactiveGrowthVisual',
            'title': a.get('title') or '',
            'subtitle': a.get('subtitle'),
            'footer': a.get('footer'),
            'initialValue': num(a.get('initialValue'), 1000.0),
            'secondaryValue': num(a.get('finalValue'), 0.0),
            'secondarySliderLabel': a.get('secondarySliderLabel') or 'Percent Increase',
            'secondaryMin': num(a.get('secondarySliderMin'), 0.0),
            'secondaryMax': num(a.get('secondarySliderMax'), 500.0),
            'secondaryStep': num(a.get('secondarySliderStep'), 1.0),
            'timeYears': time_years,
            'delayYears': 5,
            'summaryMessage': a.get('summaryMessage') or 'Starting early gives you a huge advantage!',
            'earlyCaption': a.get('earlyCaption'),
            'lateCaption': a.get('lateCaption'),
        }
    if t == 'CalloutQuoteSlide':
        return {'type': 'calloutQuote', 'quote': a.get('quote', ''), 'author': a.get('author')}
    if t == 'CallToActionSlide':
        return {'type': 'callToAction', 'title': a.get('title', ''), 'message': a.get('message', ''), 'actionText': a.get('actionText', '')}
    if t == 'ChecklistSlide':
        return {'type': 'checklist', 'title': a.get('title', ''), 'items': a.get('items', [])}
    if t == 'BeforeAfterSlide':
        return {'type': 'beforeAfter', 'title': a.get('title'), 'beforeText': a.get('beforeText', ''), 'afterText': a.get('afterText', '')}
    if t == 'MatchConceptSlide':
        return {'type': 'matchConcept', 'title': a.get('title', ''), 'concepts': a.get('concepts', []), 'definitions': a.get('definitions', []), 'correctMatches': a.get('correctMatches', {})}
    if t == 'EndSlide':
        return None  # web player has its own completion screen
    # fallback: capture any strings so nothing is blank
    strings = [v for v in a.values() if isinstance(v, str)]
    if not strings:
        return None
    return {'type': 'content', 'title': strings[0], 'body': strings[1:] }


def transcode_file(path):
    txt = open(path, encoding='utf-8').read()
    base = os.path.basename(path)
    m = re.search(r'Unit(\d+)Lesson(\d+)Data\.swift', base)
    if not m:
        return None
    unit, lesson = int(m.group(1)), int(m.group(2))
    lid = f'unit{unit}lesson{lesson}'

    # file-level constants, for resolving identifier references in slide args
    consts = dict(re.findall(r'let\s+(\w+)\s*=\s*"((?:[^"\\]|\\.)*)"', txt))
    for am in re.finditer(r'let\s+(\w+)\s*=\s*(\[)', txt):  # array constants (e.g. Objectives)
        try:
            consts[am.group(1)] = parse_value(txt[am.end() - 1:])
        except Exception:
            pass

    # metadata (values may span multiple lines — parse from the '=' onward)
    def meta(kind, default=None):
        mm = re.search(rf'let Unit{unit}Lesson{lesson}{kind}\s*=\s*', txt)
        if not mm:
            return default
        try:
            return parse_value(txt[mm.end():])
        except Exception:
            return default
    name = meta('Name', lid)
    desc = meta('Description', '')
    objectives = meta('Objectives', []) or []

    # slide vars: varname -> mapped slide
    slides_by_var = {}
    stats = {}
    for vm in re.finditer(r'(?:private\s+)?let\s+(\w+)\s*=\s*AnyView\(', txt):
        var = vm.group(1)
        p = vm.end() - 1  # index of '('
        inner, _ = extract_balanced(txt, p)  # inner = "TypeSlide( ... )"
        tm = re.match(r'\s*(\w+)\s*\(', inner)
        if not tm:
            continue
        typ = tm.group(1)
        arg_inner, _ = extract_balanced(inner, tm.end() - 1)
        stats[typ] = stats.get(typ, 0) + 1
        try:
            a = parse_args(arg_inner)
            a = resolve_consts(a, consts)
            mapped = map_slide(typ, a)
        except Exception:
            strs = re.findall(r'"((?:[^"\\]|\\.)*)"', arg_inner)
            mapped = {'type': 'content', 'title': strs[0], 'body': strs[1:]} if strs else None
        if mapped is not None:
            slides_by_var[var] = mapped

    # ordering via LessonDefinition slides: [...]
    order = re.findall(r'LessonSlide\((\w+)', txt)
    ordered = [slides_by_var[v] for v in order if v in slides_by_var]
    if not ordered:  # fallback: numeric suffix order
        def key(v):
            mm = re.search(r'slide(\d+)$', v)
            return int(mm.group(1)) if mm else 0
        ordered = [slides_by_var[v] for v in sorted(slides_by_var, key=key)]

    return {'id': lid, 'unit': unit, 'lesson': lesson, 'name': name, 'description': desc, 'objectives': objectives, 'slides': ordered}, stats


def main():
    data_dir, out = sys.argv[1], sys.argv[2]
    files = sorted(glob.glob(os.path.join(data_dir, 'Unit*', 'Unit*Lesson*Data.swift')))
    lessons = []
    total_stats = {}
    for f in files:
        r = transcode_file(f)
        if not r:
            continue
        lesson, stats = r
        lessons.append(lesson)
        for k, v in stats.items():
            total_stats[k] = total_stats.get(k, 0) + v
    lessons.sort(key=lambda l: (l['unit'], l['lesson']))
    json.dump(lessons, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'Transcoded {len(lessons)} lessons -> {out}')
    slidecount = sum(len(l['slides']) for l in lessons)
    print(f'Total slides: {slidecount}')
    print('Slide type usage:', dict(sorted(total_stats.items(), key=lambda kv: -kv[1])))


if __name__ == '__main__':
    main()
