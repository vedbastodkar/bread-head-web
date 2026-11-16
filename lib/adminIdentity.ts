// Who counts as the admin. Pure — safe to import from client components (the server gate in
// lib/firebase/verifyAdmin.ts uses the same function after verifying the token).
export const ADMIN_EMAILS: ReadonlySet<string> = new Set(['ved@bread-head.org'])

// The email path requires `email_verified`: Firebase lets anyone create an email/password
// account under any address, so an unverified claim to be the admin address means nothing.
// Google/Apple sign-in and the Admin SDK both set email_verified; a plain password sign-up
// does not, and must be promoted with the `admin` custom claim instead.
export function isAdminIdentity(claims: { email?: string | null; email_verified?: boolean; role?: unknown }): boolean {
  if (claims.role === 'admin') return true
  const email = (claims.email ?? '').toLowerCase()
  return !!email && claims.email_verified === true && ADMIN_EMAILS.has(email)
}
