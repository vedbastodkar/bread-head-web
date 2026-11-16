'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onIdTokenChanged, signOut as fbSignOut, type User } from 'firebase/auth'
import { auth } from '@/lib/firebase/client'

interface AuthCtx {
  user: User | null
  role: string | null      // "student" | "teacher" | "admin" | null (from custom claim)
  loading: boolean
  signOut: () => Promise<void>
}

const Ctx = createContext<AuthCtx>({
  user: null, role: null, loading: true, signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // onIdTokenChanged (not onAuthStateChanged): it also fires when the token is refreshed, which
    // is how a brand-new teacher's `role` claim arrives — the claim is set by
    // /api/auth/register-teacher AFTER the account is created and the first event has fired.
    return onIdTokenChanged(auth, async (u) => {
      setUser(u)
      try {
        setRole(u ? (((await u.getIdTokenResult()).claims.role as string) ?? null) : null)
      } catch {
        setRole(null) // token refresh failed (offline, revoked) — never leave pages on a skeleton
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const signOut = async () => { await fbSignOut(auth) }

  return <Ctx.Provider value={{ user, role, loading, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
