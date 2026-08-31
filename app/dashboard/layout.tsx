import type { ReactNode } from 'react'
import { ToastProvider } from './ToastProvider'

// Wraps every /dashboard/** route so teacher pages can use useToast() for
// in-app notifications and confirmations instead of native alert()/confirm().
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <ToastProvider>{children}</ToastProvider>
}
