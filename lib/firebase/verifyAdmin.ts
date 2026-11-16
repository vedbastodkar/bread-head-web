import { NextRequest } from 'next/server'
import { adminAuth } from './admin'
import { isAdminIdentity } from '@/lib/adminIdentity'

// The admin portal is gated to one operator (lib/adminIdentity.ts). An `admin` custom claim
// also passes so the gate can move to claims later without touching the routes.
export interface AdminAuth { uid: string; email: string | null }

/** Verify the caller's Firebase ID token and require the admin identity. Null on failure. */
export async function verifyAdmin(req: NextRequest): Promise<AdminAuth | null> {
  const authz = req.headers.get('authorization') ?? ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  if (!token) return null
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    if (!isAdminIdentity(decoded)) return null
    return { uid: decoded.uid, email: decoded.email ?? null }
  } catch {
    return null
  }
}
