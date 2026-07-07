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
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(''); setBusy(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const res = await cred.user.getIdTokenResult()
      const role = res.claims.role
      if (role !== 'teacher' && role !== 'admin') {
        setError('This account is not a teacher/admin account.')
        setBusy(false)
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Wrong email or password.')
      setBusy(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm max-w-md mx-auto p-8">
      <h1 className="font-display text-2xl text-textTitle mb-1">Teacher / Admin</h1>
      <p className="text-textTitle/60 text-sm mb-6">See your class progress dashboard.</p>
      <form onSubmit={submit} className="space-y-4">
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit" disabled={busy}
          className="w-full py-3 rounded-xl bg-brandGreen text-white font-medium disabled:opacity-60"
        >
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <button
        type="button"
        onClick={() => { setEmail('demo.teacher@bread-head.org'); setPassword('DemoPass123!') }}
        className="mt-4 text-xs text-textTitle/50 hover:text-textTitle underline mx-auto block"
      >
        Fill demo teacher account
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
      <p className="text-textTitle/60 text-sm mb-6">{mode === 'signup' ? 'Create your account, then join your class with a code.' : 'Jump into your lessons.'}</p>
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
        <span className="text-xs text-textTitle/40 uppercase tracking-wide">or</span>
        <div className="h-px flex-1 bg-textTitle/10" />
      </div>

      <div className="space-y-3">
        <button
          type="button" onClick={google} disabled={busy}
          className="w-full py-3 rounded-xl border border-textTitle/15 text-textTitle font-medium hover:bg-textTitle/5 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          Continue with Google
        </button>
        <button
          type="button" onClick={apple} disabled={busy}
          className="w-full py-3 rounded-xl border border-textTitle/15 text-textTitle font-medium hover:bg-textTitle/5 transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          Continue with Apple
        </button>
      </div>

      <button type="button" onClick={() => { setMode(mode === 'signup' ? 'signin' : 'signup'); setError('') }}
        className="mt-4 text-sm text-textTitle/60 hover:text-textTitle mx-auto block">
        {mode === 'signup' ? 'Have an account? Sign in' : 'New here? Create an account'}
      </button>
      {mode === 'signin' && (
        <button type="button" onClick={() => { setEmail('demo.student2@bread-head.org'); setPassword('DemoPass123!') }}
          className="mt-2 text-xs text-textTitle/50 hover:text-textTitle underline mx-auto block">
          Fill demo student account
        </button>
      )}
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
