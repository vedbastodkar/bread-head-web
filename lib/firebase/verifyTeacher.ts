import { NextRequest } from 'next/server'
import { adminAuth } from './admin'

export interface TeacherAuth { uid: string; role: string }

// Verify the caller is an authenticated teacher/admin. Returns null on failure.
export async function verifyTeacher(req: NextRequest): Promise<TeacherAuth | null> {
  const authz = req.headers.get('authorization') ?? ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  if (!token) return null
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    if (decoded.role !== 'teacher' && decoded.role !== 'admin') return null
    return { uid: decoded.uid, role: decoded.role as string }
  } catch {
    return null
  }
}

// Verify any signed-in user (student or teacher). Returns { uid } or null.
export async function verifyUser(req: NextRequest): Promise<{ uid: string } | null> {
  const authz = req.headers.get('authorization') ?? ''
  const token = authz.startsWith('Bearer ') ? authz.slice(7) : ''
  if (!token) return null
  try {
    const decoded = await adminAuth.verifyIdToken(token)
    return { uid: decoded.uid }
  } catch {
    return null
  }
}

// Random 6-letter join code (letters only). Joining is case-insensitive
// (the join API upper-cases input before matching).
export function makeJoinCode(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let s = ''
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)]
  return s
}
