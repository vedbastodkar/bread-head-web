'use client'
import { useEffect, useState } from 'react'
import { apiCall } from './useDashboard'

type AuthUser = { getIdToken: () => Promise<string> }
type Org = { sponsorId: string | null; displayName: string | null }

// The sponsoring partner this teacher belongs to. Set with an organization code issued by
// Bread Head (at sign-up or here); students who join any of this teacher's classes are then
// counted in that partner's participation report. Teachers cannot pick a partner freely.
export function OrganizationCard({ user }: { user: AuthUser }) {
  const [org, setOrg] = useState<Org | null>(null)
  const [entering, setEntering] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const token = await user.getIdToken()
        const res = await fetch('/api/teacher/organization', { headers: { Authorization: `Bearer ${token}` } })
        if (alive && res.ok) setOrg(await res.json())
      } catch { /* card stays hidden; nothing else depends on it */ }
    })()
    return () => { alive = false }
  }, [user])

  if (!org) return null

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const r = await apiCall(user, '/api/teacher/organization', 'POST', { code })
      setOrg({ sponsorId: r.sponsorId, displayName: r.displayName })
      setEntering(false); setCode('')
    } catch (e: any) { setErr(e?.message || 'Could not apply that code.') } finally { setBusy(false) }
  }

  return (
    <section className="bg-white rounded-2xl shadow-sm p-4 mb-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-textTitle/70 text-xs">Organization</div>
          <div className="font-medium text-textTitle">{org.displayName ?? 'Not with a partner'}</div>
        </div>
        {!entering && (
          <button type="button" onClick={() => setEntering(true)} className="text-sm text-brandGreen hover:underline">
            {org.sponsorId ? 'Enter a different code' : 'Enter organization code'}
          </button>
        )}
      </div>
      {entering && (
        <form onSubmit={submit} className="flex flex-wrap items-center gap-2 mt-3">
          <input
            value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABCD2345" aria-label="Organization code" autoCapitalize="characters"
            className="px-4 py-2.5 rounded-xl border border-textTitle/15 focus:border-brandGreen outline-none text-sm"
          />
          <button type="submit" disabled={busy || !code.trim()} className="px-4 py-2.5 rounded-xl bg-brandGreen text-white text-sm font-medium disabled:opacity-60">
            {busy ? 'Checking…' : 'Apply'}
          </button>
          <button type="button" onClick={() => { setEntering(false); setErr(''); setCode('') }} className="text-sm text-textTitle/70 hover:text-textTitle">Cancel</button>
          {err && <p className="text-sm text-red-600 w-full">{err}</p>}
        </form>
      )}
      <p className="text-xs text-textTitle/60 mt-2">
        {org.sponsorId
          ? 'Students who join your classes are counted in this partner’s participation report (totals only, never individual records).'
          : 'If Bread Head gave your organization a code, enter it so your students count toward that partner. Optional.'}
      </p>
    </section>
  )
}
