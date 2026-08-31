'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signOut as fbSignOut, type User } from 'firebase/auth'
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
    return onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        const res = await u.getIdTokenResult()
        setRole((res.claims.role as string) ?? null)
      } else {
        setRole(null)
      }
      setLoading(false)
    })
  }, [])

  const signOut = async () => { await fbSignOut(auth) }

  return <Ctx.Provider value={{ user, role, loading, signOut }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
