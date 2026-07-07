import {
  GoogleAuthProvider, OAuthProvider, signInWithPopup, type User,
} from 'firebase/auth'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './client'

// Create the same profile shape email signup writes, only if the user is new.
export async function ensureProfile(user: User, role: 'student' | 'teacher' = 'student') {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (snap.exists() && (snap.data() as any)?.profile) return
  await setDoc(ref, {
    profile: {
      uid: user.uid, email: user.email ?? '', name: user.displayName || user.email || 'Student',
      role, provider: user.providerData[0]?.providerId ?? 'oauth',
      createdAt: serverTimestamp(), updatedAt: serverTimestamp(), classIds: [], teacherIds: [],
    },
  }, { merge: true })
}

export async function signInWithGoogle(): Promise<User> {
  const cred = await signInWithPopup(auth, new GoogleAuthProvider())
  await ensureProfile(cred.user)
  return cred.user
}

export async function signInWithApple(): Promise<User> {
  const provider = new OAuthProvider('apple.com')
  provider.addScope('email'); provider.addScope('name')
  const cred = await signInWithPopup(auth, provider)
  await ensureProfile(cred.user)
  return cred.user
}
