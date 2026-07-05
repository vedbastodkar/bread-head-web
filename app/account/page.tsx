'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { sendPasswordResetEmail, updateProfile } from 'firebase/auth'
import { auth, db } from '@/lib/firebase/client'
import { useAuth } from '@/app/context/AuthContext'

export default function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const [name, setName] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { router.replace('/login'); return }
    ;(async () => {
      const snap = await getDoc(doc(db, 'users', user.uid))
      setName(((snap.data() ?? {}) as any).profile?.name ?? user.displayName ?? '')
      setLoaded(true)
    })()
  }, [loading, user, router])

  if (loading || !user || !loaded) return <main className="min-h-screen bg-bgSage pt-28" />

  async function saveName() {
    if (!user) return
    setBusy(true); setMsg('')
    try {
      await setDoc(doc(db, 'users', user.uid), { profile: { name: name.trim() } }, { merge: true })
      try { await updateProfile(user, { displayName: name.trim() }) } catch { /* noop */ }
      setMsg('Saved.')
    } catch (e: any) { setMsg(e?.message || 'Could not save') } finally { setBusy(false) }
  }
  async function resetPw() {
    if (!user?.email) return
    setMsg('')
    try { await sendPasswordResetEmail(auth, user.email); setMsg('Password reset email sent.') }
    catch (e: any) { setMsg(e?.message || 'Could not send reset email') }
  }

  return (
    <main className="min-h-screen bg-bgSage pt-28 pb-16 px-4">
      <div className="max-w-xl mx-auto">
        <button onClick={() => router.push('/dashboard')} className="text-sm text-textTitle/50 hover:text-textTitle">← Dashboard</button>
        <h1 className="font-display text-3xl text-textTitle mt-1 mb-6">Account settings</h1>

        <div className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
          <label className="block">
            <span className="block text-sm text-textTitle/70 mb-1">Display name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-textTitle/15 focus:border-brandGreen outline-none" />
          </label>
          <div>
            <span className="block text-sm text-textTitle/70 mb-1">Email</span>
            <div className="px-4 py-2.5 rounded-xl bg-bgSage/60 text-textTitle/70 text-sm">{user.email}</div>
          </div>
          <button onClick={saveName} disabled={busy} className="px-5 py-2.5 rounded-xl bg-brandGreen text-white text-sm disabled:opacity-60">{busy ? 'Saving…' : 'Save'}</button>
          {msg && <p className="text-sm text-textTitle/60">{msg}</p>}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6 mt-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-sm text-textTitle">Password</div>
            <div className="text-xs text-textTitle/50">We’ll email you a reset link.</div>
          </div>
          <button onClick={resetPw} className="px-4 py-2 rounded-xl border border-textTitle/15 text-sm text-textTitle/80 hover:bg-bgSage shrink-0">Send reset email</button>
        </div>

        <div className="mt-6">
          <button onClick={async () => { await signOut(); router.replace('/login') }} className="text-sm text-red-600 hover:underline">Sign out</button>
        </div>
      </div>
    </main>
  )
}
