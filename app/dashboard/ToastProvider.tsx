'use client'
// Lightweight in-app toast + async-confirm system for the teacher dashboard.
// Replaces native alert()/confirm() (blocking, unstyled, and — for alert(e.message)
// — a raw-error leak). Mounted once by app/dashboard/layout.tsx so every
// /dashboard/** page can call useToast().
//
//   const { notify, confirm } = useToast()
//   notify('Assigned.', 'success')
//   if (!(await confirm({ message: 'Delete this class?', destructive: true }))) return
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

type Variant = 'success' | 'error' | 'info'
interface Toast { id: number; message: string; variant: Variant }

interface ConfirmOptions {
  title?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
}
interface PendingConfirm { opts: ConfirmOptions; resolve: (ok: boolean) => void }

interface ToastApi {
  notify: (message: string, variant?: Variant) => void
  confirm: (opts: ConfirmOptions) => Promise<boolean>
}

const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider> (app/dashboard/layout.tsx)')
  return ctx
}

const VARIANT_STYLES: Record<Variant, { bar: string; icon: string }> = {
  success: { bar: '#4A5D4A', icon: '✓' },
  error: { bar: '#B23838', icon: '!' },
  info: { bar: '#1A2E1A', icon: 'i' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [pending, setPending] = useState<PendingConfirm | null>(null)
  const nextId = useRef(1)
  const confirmBtnRef = useRef<HTMLButtonElement>(null)

  const dismiss = useCallback((id: number) => setToasts((t) => t.filter((x) => x.id !== id)), [])

  const notify = useCallback((message: string, variant: Variant = 'info') => {
    const id = nextId.current++
    setToasts((t) => [...t, { id, message, variant }])
  }, [])

  const confirm = useCallback(
    (opts: ConfirmOptions) => new Promise<boolean>((resolve) => setPending({ opts, resolve })),
    [],
  )

  function resolveConfirm(ok: boolean) {
    pending?.resolve(ok)
    setPending(null)
  }

  // Focus the confirm button and wire Esc = cancel / Enter = confirm while open.
  useEffect(() => {
    if (!pending) return
    confirmBtnRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') resolveConfirm(false)
      if (e.key === 'Enter') resolveConfirm(true)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending])

  return (
    <ToastContext.Provider value={{ notify, confirm }}>
      {children}

      {/* ---- toaster (bottom-right, stacked, auto-dismiss) ---- */}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-[min(92vw,360px)]" aria-live="polite">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>

      {/* ---- confirm modal ---- */}
      {pending && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/40"
          role="dialog"
          aria-modal="true"
          aria-label={pending.opts.title ?? 'Confirm'}
          onMouseDown={(e) => { if (e.target === e.currentTarget) resolveConfirm(false) }}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
            {pending.opts.title && (
              <h2 className="font-display text-xl text-textTitle mb-1">{pending.opts.title}</h2>
            )}
            <p className="text-sm text-textTitle/70 leading-relaxed">{pending.opts.message}</p>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => resolveConfirm(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-textTitle/70 hover:bg-textTitle/5"
              >
                {pending.opts.cancelLabel ?? 'Cancel'}
              </button>
              <button
                ref={confirmBtnRef}
                onClick={() => resolveConfirm(true)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accentGold"
                style={{ background: pending.opts.destructive ? '#B23838' : '#4A5D4A' }}
              >
                {pending.opts.confirmLabel ?? 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}

function ToastCard({ toast, onDone }: { toast: Toast; onDone: () => void }) {
  const style = VARIANT_STYLES[toast.variant]
  useEffect(() => {
    // Errors linger longer (they usually need reading/acting on).
    const ms = toast.variant === 'error' ? 6500 : 4000
    const id = window.setTimeout(onDone, ms)
    return () => window.clearTimeout(id)
  }, [toast.variant, onDone])

  return (
    <div
      className="flex items-start gap-3 bg-white rounded-xl shadow-lg border border-textTitle/10 px-4 py-3 text-sm"
      style={{ borderLeft: `4px solid ${style.bar}` }}
      role={toast.variant === 'error' ? 'alert' : 'status'}
    >
      <span
        className="shrink-0 mt-0.5 w-5 h-5 rounded-full text-white text-[12px] font-bold flex items-center justify-center"
        style={{ background: style.bar }}
        aria-hidden
      >
        {style.icon}
      </span>
      <span className="text-textTitle/80 leading-snug flex-1">{toast.message}</span>
      <button onClick={onDone} aria-label="Dismiss" className="shrink-0 text-textTitle/40 hover:text-textTitle text-lg leading-none">
        ×
      </button>
    </div>
  )
}
