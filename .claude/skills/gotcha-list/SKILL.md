---
name: gotcha-list
description: >
  Tracks mistakes Claude Code has made and the rules to follow to avoid them
  again. Invoke after any task where something went wrong, broke, or needed
  fixing. Also invoke at the start of any task to review past gotchas relevant
  to the work about to be done. Use when asked to log a mistake, add a gotcha,
  review lessons learned, or check the gotcha list before starting work.
---

# Gotcha list

This skill has two modes: **log** and **review**.

---

## Mode 1: Log a gotcha

When invoked after a mistake, ask the user (or infer from context):
1. What went wrong
2. Which file or area of the codebase was affected
3. What the correct behaviour should have been

Then append a new entry to `.claude/gotchas.md` in the project root using
this exact format:

```markdown
### G<N> — <short title>
**Date:** <YYYY-MM-DD>
**Skill:** <name of skill that was active, or "general">
**What went wrong:** <one or two sentences describing the mistake>
**Rule:** <the concrete rule to follow next time — written as a positive
instruction, not "don't do X" but "always do Y instead">
**Affected area:** <file, module, or feature>
```

Increment `<N>` by reading the existing file and finding the highest G number.
If `.claude/gotchas.md` does not exist, create it with this header first:

```markdown
# Gotcha list

Rules Claude Code has learned from its own mistakes in this project.
Review the relevant entries before starting any task.

---
```

After appending, confirm to the user: "Gotcha G<N> logged."

---

## Mode 2: Review before a task

When invoked at the start of a task, or when the user says "check gotchas"
or "review lessons learned":

1. Read `.claude/gotchas.md`
2. Filter entries relevant to the current task by matching the skill name,
   affected area, or keywords in the task description
3. Print a compact summary of relevant gotchas:

```
Relevant gotchas for this task:
• G3 [security-hardening] Always validate env vars exist at startup — do not
  assume they are set
• G7 [general] Never modify package.json scripts without reading them first
```

4. If no relevant gotchas, say: "No relevant gotchas found — proceed carefully
   and log anything that goes wrong."

---

## Mode 3: Review all

When the user asks to see the full list, read and print `.claude/gotchas.md`
in full, grouped by skill name.

---

## Mode 4: Amend a gotcha

When the user says a rule needs updating (e.g. "that rule was wrong" or
"update G4"), find the entry by number and rewrite only the **Rule** field
with the corrected instruction. Preserve everything else.

---

## Automatic integration with other skills

At the top of any skill execution, Claude Code should:
1. Check if `.claude/gotchas.md` exists
2. If it does, silently scan for gotchas tagged with the current skill name
3. Apply those rules proactively during the task without being asked

This makes every skill smarter over time as gotchas accumulate.

---

## File location

Always use `.claude/gotchas.md` at the project root — never a different path.
This keeps it version-controlled and shared with the team.

If the project is personal (no team), also offer to copy new entries to
`~/.claude/gotchas-global.md` for lessons that apply across all projects.

---

## Gotcha list

<!-- Entries will be appended below by Claude Code -->
