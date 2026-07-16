'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'
import { signInWithGoogle, signInWithApple } from '@/lib/firebase/authProviders'

type Pane = 'student' | 'teacher'

export default function LoginPage() {
  const [pane, setPane] = useState<Pane>('teacher')

  return (
    <main className="min-h-screen bg-bgSage flex items-center justify-center px-4 pt-28 pb-16">
      <div className="w-full max-w-4xl">
        <div className="flex flex-col items-center mb-8">
          <Image src="/assets/logo_w_text.png" alt="Bread Head" width={180} height={48} priority />
          <p className="mt-3 text-textTitle/70 font-body">Sign in to Bread Head</p>
        </div>

        {/* Two-pane chooser */}
        <div className="grid grid-cols-2 gap-2 max-w-md mx-auto mb-6 bg-white/60 p-1 rounded-full">
          <button
            onClick={() => setPane('student')}
            className={`py-2.5 rounded-full text-sm font-medium transition ${
              pane === 'student' ? 'bg-brandGreen text-white' : 'text-textTitle/70 hover:text-textTitle'
            }`}
          >
            Student
          </button>
          <button
            onClick={() => setPane('teacher')}
            className={`py-2.5 rounded-full text-sm font-medium transition ${
              pane === 'teacher' ? 'bg-brandGreen text-white' : 'text-textTitle/70 hover:text-textTitle'
            }`}
          >
            Teacher / Admin
          </button>
        </div>

        {pane === 'student' ? <StudentPane /> : <TeacherPane />}
      </div>
    </main>
  )
}

function TeacherPane() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      if (mode === 'signup') {
        // Create the account — or recover one left roleless by a prior attempt that
        // created the Firebase user but failed before the teacher role was assigned.
        let user
        try {
          const cred = await createUserWithEmailAndPassword(auth, email, password)
          try { await updateProfile(cred.user, { displayName: name.trim() }) } catch { /* noop */ }
          user = cred.user
        } catch (e: any) {
          if (e?.code !== 'auth/email-already-in-use') throw e
          // The email exists. Sign in to prove ownership, then finish/verify the role.
          let cred
          try {
            cred = await signInWithEmailAndPassword(auth, email, password)
          } catch {
            setError('That email is already registered. Try signing in instead.')
            setBusy(false)
            return
          }
          const claims = (await cred.user.getIdTokenResult()).claims
          if (claims.role === 'teacher' || claims.role === 'admin') {
            router.push('/dashboard') // already a teacher — nothing to finish
            return
          }
          if (claims.role === 'student') {
            setError('That email is already registered to a student account.')
            setBusy(false)
            return
          }
          user = cred.user // roleless leftover — fall through and complete registration
        }

        const idToken = await user.getIdToken()
        const res = await fetch('/api/auth/register-teacher', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ name: name.trim() }),
        })
        if (!res.ok) {
          setError('Could not create teacher account. Please try again.')
          setBusy(false)
          return
        }
        await user.getIdToken(true) // force-refresh so the teacher claim is live
        router.push('/dashboard')
        return
      }

      const cred = await signInWithEmailAndPassword(auth, email, password)
      const res = await cred.user.getIdTokenResult()
      const role = res.claims.role
      if (role !== 'teacher' && role !== 'admin') {
        setError('This account is not a teacher/admin account.')
        setBusy(false)
        return
      }
      router.push('/dashboard')
    } catch (e: any) {
      setError(mode === 'signup' ? (e?.message || 'Could not create teacher account.') : 'Wrong email or password.')
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm max-w-md mx-auto p-8">
      <h1 className="font-display text-2xl text-textTitle mb-1">Teacher / Admin</h1>
      <p className="text-textTitle/70 text-sm mb-6">{mode === 'signup' ? 'Create your teacher account to set up classes.' : 'See your class progress dashboard.'}</p>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <Field label="Name" type="text" value={name} onChange={setName} />}
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit" disabled={busy}
          className="w-full py-3 rounded-xl bg-brandGreen text-white font-medium disabled:opacity-60"
        >
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}
        className="mt-4 text-sm text-textTitle/70 hover:text-textTitle mx-auto block">
        {mode === 'signup' ? 'Have an account? Sign in' : 'New teacher? Create an account'}
      </button>
    </div>
  )
}

function StudentPane() {
  const router = useRouter()
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        try { await updateProfile(cred.user, { displayName: name.trim() }) } catch { /* noop */ }
        await setDoc(doc(db, 'users', cred.user.uid), {
          profile: {
            uid: cred.user.uid, email, name: name.trim() || email, role: 'student',
            provider: 'email', createdAt: serverTimestamp(), updatedAt: serverTimestamp(), classIds: [], teacherIds: [],
          },
        }, { merge: true })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
      router.push('/dashboard')
    } catch (e: any) {
      setError(mode === 'signup' ? (e?.message || 'Could not create account') : 'Wrong email or password.')
      setBusy(false)
    }
  }

  async function google() {
    setError(''); setBusy(true)
    try { await signInWithGoogle(); router.push('/dashboard') }
    catch (e: any) {
      setError(e?.code === 'auth/account-exists-with-different-credential'
        ? 'You already have an account with this email — sign in with your original method first, then link Google in settings.'
        : 'Google sign-in failed.')
      setBusy(false)
    }
  }

  async function apple() {
    setError(''); setBusy(true)
    try { await signInWithApple(); router.push('/dashboard') }
    catch (e: any) {
      setError(e?.code === 'auth/account-exists-with-different-credential'
        ? 'You already have an account with this email — sign in with your original method first, then link Apple in settings.'
        : 'Apple sign-in failed.')
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm max-w-md mx-auto p-8">
      <h1 className="font-display text-2xl text-textTitle mb-1">Student</h1>
      <p className="text-textTitle/70 text-sm mb-6">{mode === 'signup' ? 'Create your account, then join your class with a code.' : 'Jump into your lessons.'}</p>
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <Field label="Name" type="text" value={name} onChange={setName} />}
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" disabled={busy} className="w-full py-3 rounded-xl bg-brandGreen text-white font-medium disabled:opacity-60">
          {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
        </button>
      </form>

      <div className="flex items-center gap-3 my-5">
        <div className="h-px flex-1 bg-textTitle/10" />
        <span className="text-xs text-textTitle/70 uppercase tracking-wide">or</span>
        <div className="h-px flex-1 bg-textTitle/10" />
      </div>

      <div className="space-y-3">
        <button
          type="button" onClick={google} disabled={busy}
          className="w-full py-3 rounded-xl border border-textTitle/15 text-textTitle font-medium hover:bg-textTitle/5 transition disabled:opacity-60 flex items-center justify-center gap-2.5"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/google_logo.png" alt="" width={18} height={18} className="w-[18px] h-[18px]" />
          Continue with Google
        </button>
        <button
          type="button" onClick={apple} disabled={busy}
          className="w-full py-3 rounded-xl border border-textTitle/15 text-textTitle font-medium hover:bg-textTitle/5 transition disabled:opacity-60 flex items-center justify-center gap-2.5"
        >
          <svg viewBox="0 0 384 512" width="17" height="17" fill="currentColor" aria-hidden="true" className="-mt-0.5">
            <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
          </svg>
          Continue with Apple
        </button>
      </div>

      <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}
        className="mt-4 text-sm text-textTitle/70 hover:text-textTitle mx-auto block">
        {mode === 'signup' ? 'Have an account? Sign in' : 'New here? Create an account'}
      </button>
    </div>
  )
}

function Field({ label, type, value, onChange }: {
  label: string; type: string; value: string; onChange: (v: string) => void
}) {
  return (
    <label className="block">
      <span className="block text-sm text-textTitle/70 mb-1">{label}</span>
      <input
        type={type} value={value} onChange={(e) => onChange(e.target.value)} required
        className="w-full px-4 py-2.5 rounded-xl border border-textTitle/15 focus:border-brandGreen outline-none"
      />
    </label>
  )
}
