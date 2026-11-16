'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/context/AuthContext'
import { isAdminIdentity } from '@/lib/adminIdentity'
import type { Overview } from '@/lib/admin/overview'
import type { SponsorReport, Cell } from '@/lib/admin/sponsorReportShape'
import type { Sponsor } from '@/lib/sponsors/shared'

// Admin portal — gated to the operator (lib/firebase/verifyAdmin.ts; the API routes enforce
// the same check server-side, this page only decides what to render). Every number here comes
// from BigQuery via /api/admin/*, never from Firestore.

type AuthUser = { getIdToken: () => Promise<string>; email?: string | null }

async function api<T>(user: AuthUser, path: string, init: RequestInit = {}): Promise<T> {
  const token = await user.getIdToken()
  const res = await fetch(path, { ...init, headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) } })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error || `Request failed (${res.status})`)
  return body as T
}

const isoDate = (d: Date) => d.toISOString().slice(0, 10)

export default function AdminPage() {
  const { user, role, loading } = useAuth()
  if (loading) return <Frame><p className="text-textTitle/70">Loading…</p></Frame>
  if (!user) {
    return <Frame><p className="text-textTitle/70">Sign in to continue. <Link href="/login" className="underline">Log in</Link></p></Frame>
  }
  if (!isAdminIdentity({ email: user.email ?? undefined, email_verified: user.emailVerified, role })) {
    return <Frame><p className="text-textTitle/70">This page is restricted to the Bread Head administrator.</p></Frame>
  }
  return (
    <Frame>
      <h1 className="font-display text-3xl text-textTitle mb-1">Admin</h1>
      <p className="text-sm text-textTitle/60 mb-8">Reporting layer: BigQuery <code>breadhead_analytics</code>. Signed in as {user.email}.</p>
      <OverviewSection user={user} />
      <SponsorReportSection user={user} />
      <SponsorAdminSection user={user} />
      <TeachersSection user={user} />
    </Frame>
  )
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
      <div className="max-w-4xl mx-auto">{children}</div>
    </main>
  )
}

function Card({ title, children, aside }: { title: string; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm p-6 mb-6">
      <div className="flex items-baseline justify-between gap-4 mb-4">
        <h2 className="font-display text-xl text-textTitle">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  )
}

function Table({ rows, head }: { rows: React.ReactNode[][]; head?: string[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        {head && (
          <thead><tr>{head.map((h) => <th key={h} className="text-left font-medium text-textTitle/60 pb-2 pr-4">{h}</th>)}</tr></thead>
        )}
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-textTitle/10">
              {r.map((c, j) => <td key={j} className={`py-2 pr-4 ${j === 0 ? 'text-textTitle' : 'text-textTitle/80 tabular-nums'}`}>{c ?? '—'}</td>)}
            </tr>
          ))}
          {rows.length === 0 && <tr><td className="py-2 text-textTitle/50">No data</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

const btn = 'px-4 py-2 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60'
const input = 'px-3 py-2 rounded-xl border border-textTitle/15 focus:border-brandGreen outline-none text-sm bg-white'

// ---------------------------------------------------------------- overview
function OverviewSection({ user }: { user: AuthUser }) {
  const [data, setData] = useState<Overview | null>(null)
  const [err, setErr] = useState('')
  const load = useCallback(() => {
    setErr('')
    api<Overview>(user, '/api/admin/overview').then(setData).catch((e) => setErr(e.message))
  }, [user])
  useEffect(load, [load])

  return (
    <Card title="Overview" aside={<button onClick={load} className="text-xs text-textTitle/60 hover:text-textTitle">Refresh</button>}>
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      {!data && !err && <p className="text-sm text-textTitle/50">Querying BigQuery…</p>}
      {data && (
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs uppercase tracking-wider text-textTitle/60 mb-2">Students</h3>
            <Table rows={[
              ['Students', data.users.students],
              ['Teachers', data.users.teachers],
              ['Answered the attribution question', data.users.withSource],
              ['Verified through a class', data.users.verified],
              ...data.users.bySource.map((s) => [`  source: ${s.source}`, s.n]),
            ]} />
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-textTitle/60 mb-2">Events, last 30 days</h3>
            <Table head={['Platform', 'Events', 'Students']} rows={data.events.last30d.map((r) => [r.platform, r.events, r.students])} />
            <p className="text-xs text-textTitle/50 mt-2">
              {data.events.total} events all-time{data.events.lastAt ? `, latest ${data.events.lastAt.slice(0, 19).replace('T', ' ')} UTC` : ''}.
            </p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-textTitle/60 mb-2">Lesson completions</h3>
            <Table head={['Platform', 'Completions', 'Students', 'Avg score']}
              rows={data.lessons.byPlatform.map((r) => [r.platform, r.completions, r.students, r.avgScore == null ? null : `${r.avgScore}%`])} />
            <p className="text-xs text-textTitle/50 mt-2">{data.lessons.last30d} in the last 30 days. Rows without a platform predate tagging (2026-09).</p>
          </div>
          <div>
            <h3 className="text-xs uppercase tracking-wider text-textTitle/60 mb-2">Daily active students, 14 days</h3>
            <Table head={['Day', 'Students']} rows={data.dailyActive.map((r) => [r.day, r.students])} />
          </div>
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------- sponsor report
function useSponsorList(user: AuthUser) {
  const [sponsors, setSponsors] = useState<Sponsor[]>([])
  const [err, setErr] = useState('')
  const reload = useCallback(() => {
    api<{ sponsors: Sponsor[] }>(user, '/api/admin/sponsors').then((r) => setSponsors(r.sponsors)).catch((e) => setErr(e.message))
  }, [user])
  useEffect(reload, [reload])
  return { sponsors, err, reload }
}

const showCell = (c: Cell, suffix = '') => (c.suppressed ? 'withheld (<10)' : `${c.value}${suffix}`)

function SponsorReportSection({ user }: { user: AuthUser }) {
  const { sponsors } = useSponsorList(user)
  const [sponsorId, setSponsorId] = useState('')
  const [from, setFrom] = useState(() => isoDate(new Date(Date.now() - 90 * 86_400_000)))
  const [to, setTo] = useState(() => isoDate(new Date()))
  const [report, setReport] = useState<SponsorReport | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  useEffect(() => { if (!sponsorId && sponsors[0]) setSponsorId(sponsors[0].id) }, [sponsors, sponsorId])

  const qs = () => new URLSearchParams({ sponsorId, from, to }).toString()

  const run = async () => {
    if (!sponsorId) return
    setBusy(true); setErr(''); setReport(null)
    try { setReport(await api<SponsorReport>(user, `/api/admin/sponsor-report?${qs()}`)) }
    catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }
  const downloadCsv = async () => {
    const token = await user.getIdToken()
    const res = await fetch(`/api/admin/sponsor-report?${qs()}&format=csv`, { headers: { Authorization: `Bearer ${token}` } })
    if (!res.ok) { setErr('CSV download failed'); return }
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a'); a.href = url; a.download = `sponsor-report-${sponsorId}-${from}-${to}.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const cohortRows = (c: SponsorReport['selfReported']) => [
    ['Students', c.students],
    ['Active in window', showCell(c.activeInWindow)],
    ['Completed a lesson in window', showCell(c.completedALesson)],
    ['Lessons completed in window', showCell(c.lessonsCompleted)],
    ['Average lesson score', showCell(c.averageScore, '%')],
    ...c.byPlatform.map((p) => [`  on ${p.platform}`, showCell(p.students)]),
  ]

  return (
    <Card title="Sponsor report">
      <p className="text-sm text-textTitle/70 mb-4">
        Per partner, per window. Self-reported and verified are two separate numbers, the denominator is stated, and any breakdown under 10 students is withheld.
      </p>
      <div className="flex flex-wrap gap-2 items-end mb-4">
        <label className="text-xs text-textTitle/60">Partner<br />
          <select value={sponsorId} onChange={(e) => setSponsorId(e.target.value)} className={input}>
            {sponsors.length === 0 && <option value="">No partners yet</option>}
            {sponsors.map((s) => <option key={s.id} value={s.id}>{s.displayName}{s.active ? '' : ' (inactive)'}</option>)}
          </select>
        </label>
        <label className="text-xs text-textTitle/60">From<br /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={input} /></label>
        <label className="text-xs text-textTitle/60">To<br /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={input} /></label>
        <button onClick={run} disabled={busy || !sponsorId} className={btn}>{busy ? 'Running…' : 'Run report'}</button>
        {report && <button onClick={downloadCsv} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/80 hover:bg-bgSage">Download CSV</button>}
      </div>
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      {report && (
        <div>
          <p className="text-sm text-textTitle bg-bgSage rounded-xl p-4 mb-4">{report.denominator.statement}</p>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-textTitle/60 mb-2">Self-reported</h3>
              <Table rows={cohortRows(report.selfReported)} />
            </div>
            <div>
              <h3 className="text-xs uppercase tracking-wider text-textTitle/60 mb-2">Verified (via class join code)</h3>
              <Table rows={cohortRows(report.verified)} />
            </div>
          </div>
          <ul className="text-xs text-textTitle/50 mt-4 space-y-1 list-disc pl-4">
            {report.notes.map((n) => <li key={n}>{n}</li>)}
            <li>Window {report.window.from} → {report.window.to} (UTC). Generated {report.generatedAt.slice(0, 19).replace('T', ' ')} UTC.</li>
          </ul>
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------- sponsor admin
function SponsorAdminSection({ user }: { user: AuthUser }) {
  const { sponsors, err: loadErr, reload } = useSponsorList(user)
  const [editing, setEditing] = useState<Sponsor | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [codes, setCodes] = useState<Record<string, string>>({})

  useEffect(() => {
    api<{ codes: Record<string, string> }>(user, '/api/admin/org-codes').then((r) => setCodes(r.codes)).catch((e) => setErr(e.message))
  }, [user])

  const newCode = async (sponsorId: string) => {
    setErr('')
    try {
      const r = await api<{ code: string }>(user, '/api/admin/org-codes', { method: 'POST', body: JSON.stringify({ sponsorId }) })
      setCodes((c) => ({ ...c, [sponsorId]: r.code }))
    } catch (e: any) { setErr(e.message) }
  }

  const save = async () => {
    if (!editing) return
    setBusy(true); setErr('')
    try {
      await api(user, '/api/admin/sponsors', { method: 'PUT', body: JSON.stringify(editing) })
      setEditing(null); reload()
    } catch (e: any) { setErr(e.message) } finally { setBusy(false) }
  }

  return (
    <Card title="Sponsoring partners"
      aside={<button onClick={() => setEditing({ id: '', displayName: '', active: true, sortOrder: (sponsors.at(-1)?.sortOrder ?? 0) + 1 })} className="text-xs text-brandGreen hover:underline">+ Add partner</button>}>
      <p className="text-sm text-textTitle/70 mb-4">
        Edits <code>public/sponsors.items</code>, which drives the onboarding picker on iOS.
        Partners are deactivated, never deleted — students already attributed keep resolving.
        Give a partner&apos;s teachers its <strong>teacher code</strong>: they enter it at sign-up or in their dashboard, and students
        who join their classes then count as verified for that partner. A new code replaces the old one; teachers who already used it stay linked.
      </p>
      {loadErr && <p className="text-sm text-red-600 mb-3">{loadErr}</p>}
      {!editing && err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      <Table head={['id', 'Display name', 'Active', 'Order', 'Teacher code', '']} rows={sponsors.map((s) => [
        s.id, s.displayName, s.active ? 'yes' : 'no', s.sortOrder,
        <span key="code" className="inline-flex items-center gap-3">
          {codes[s.id] && <code className="tracking-wider">{codes[s.id]}</code>}
          <button onClick={() => newCode(s.id)} className="text-xs text-brandGreen hover:underline">{codes[s.id] ? 'New code' : 'Generate'}</button>
        </span>,
        <button key="edit" onClick={() => setEditing({ ...s })} className="text-xs text-brandGreen hover:underline">Edit</button>,
      ])} />
      {editing && (
        <div className="mt-4 border-t border-textTitle/10 pt-4 flex flex-wrap gap-2 items-end">
          <label className="text-xs text-textTitle/60">id (slug)<br />
            <input value={editing.id} disabled={sponsors.some((s) => s.id === editing.id)} onChange={(e) => setEditing({ ...editing, id: e.target.value })} placeholder="first-national" className={input} />
          </label>
          <label className="text-xs text-textTitle/60">Display name<br />
            <input value={editing.displayName} onChange={(e) => setEditing({ ...editing, displayName: e.target.value })} placeholder="First National Bank" className={input} />
          </label>
          <label className="text-xs text-textTitle/60">Order<br />
            <input type="number" value={editing.sortOrder} onChange={(e) => setEditing({ ...editing, sortOrder: Number(e.target.value) || 0 })} className={`${input} w-20`} />
          </label>
          <label className="text-xs text-textTitle/60 flex items-center gap-2 pb-2">
            <input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /> Active
          </label>
          <button onClick={save} disabled={busy || !editing.id || !editing.displayName.trim()} className={btn}>{busy ? 'Saving…' : 'Save'}</button>
          <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/70">Cancel</button>
          {err && <p className="text-sm text-red-600 w-full">{err}</p>}
        </div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------- teachers
type TeacherRow = { uid: string; name: string; email: string; sponsorId: string | null }

function TeachersSection({ user }: { user: AuthUser }) {
  const { sponsors } = useSponsorList(user)
  const [teachers, setTeachers] = useState<TeacherRow[]>([])
  const [err, setErr] = useState('')

  useEffect(() => {
    api<{ teachers: TeacherRow[] }>(user, '/api/admin/teachers').then((r) => setTeachers(r.teachers)).catch((e) => setErr(e.message))
  }, [user])

  const setOrg = async (uid: string, sponsorId: string | null) => {
    setErr('')
    try {
      await api(user, '/api/admin/teachers', { method: 'PUT', body: JSON.stringify({ uid, sponsorId }) })
      setTeachers((ts) => ts.map((t) => (t.uid === uid ? { ...t, sponsorId } : t)))
    } catch (e: any) { setErr(e.message) }
  }

  return (
    <Card title="Teachers">
      <p className="text-sm text-textTitle/70 mb-4">
        Each teacher belongs to at most one partner. Teachers link themselves with a teacher code; you can also set or clear it here.
        Changing it affects students who join from now on — students already verified keep their partner.
      </p>
      {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
      <Table head={['Teacher', 'Email', 'Organization']} rows={teachers.map((t) => [
        t.name || '—', t.email || '—',
        <select key="org" value={t.sponsorId ?? ''} onChange={(e) => setOrg(t.uid, e.target.value || null)} className={input} aria-label={`Organization for ${t.name || t.email}`}>
          <option value="">Not with a partner</option>
          {sponsors.map((s) => <option key={s.id} value={s.id}>{s.displayName}{s.active ? '' : ' (inactive)'}</option>)}
        </select>,
      ])} />
    </Card>
  )
}
