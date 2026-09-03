import type { ReactNode } from 'react'
import { ToastProvider } from './ToastProvider'
import { ComingSoon } from './ComingSoon'

// Temporarily disabled: the dashboard is unstable, so every /dashboard/** route
// renders a "coming soon" curtain instead. All page code is untouched — set this
// back to true to restore the real dashboard.
const DASHBOARD_ENABLED = false

// Wraps every /dashboard/** route so teacher pages can use useToast() for
// in-app notifications and confirmations instead of native alert()/confirm().
export default function DashboardLayout({ children }: { children: ReactNode }) {
  if (!DASHBOARD_ENABLED) return <ComingSoon />
  return <ToastProvider>{children}</ToastProvider>
}
