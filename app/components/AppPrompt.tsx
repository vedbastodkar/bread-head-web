'use client'
import { useEffect, useState } from 'react'
import { APP_STORE_URL } from '@/lib/links'

const DISMISS_KEY = 'bh_app_prompt_dismissed'

// Mobile-only, dismissible nudge to use the iOS app. Non-blocking: a "Continue
// in browser" escape hatch always lets people stay on the web. Shown once
// (remembered in localStorage). Intended for the student experience only.
export function AppPrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setShow(true)
    } catch { /* localStorage unavailable — just don't show */ }
  }, [])

  function dismiss() {
    try { localStorage.setItem(DISMISS_KEY, '1') } catch { /* noop */ }
    setShow(false)
  }

  if (!show) return null

  return (
    // md:hidden → never renders on tablet/desktop
    <div className="md:hidden fixed inset-0 z-[70] flex items-end">
      <button aria-label="Dismiss" onClick={dismiss} className="absolute inset-0 bg-black/40" />
      <div className="relative w-full bg-white rounded-t-3xl p-6 pb-8 shadow-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/icon_green.png" alt="" width={44} height={44} className="rounded-xl mb-3" />
        <h2 className="font-display text-2xl text-textTitle mb-1">Bread Head is better in the app</h2>
        <p className="text-sm text-textTitle/65 mb-5">
          Lessons, budgeting, and your journal are built for your phone. Grab the free app to keep going.
        </p>
        <a
          href={APP_STORE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="block w-full text-center px-4 py-3 rounded-xl bg-brandGreen text-white text-sm font-medium mb-2"
        >
          Open the App Store
        </a>
        <button onClick={dismiss} className="block w-full text-center px-4 py-2.5 text-sm text-textTitle/65">
          Continue in browser
        </button>
      </div>
    </div>
  )
}
