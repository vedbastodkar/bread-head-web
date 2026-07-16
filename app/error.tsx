'use client'

import Link from 'next/link'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-bgSage px-6">
      <div className="bg-cardBg rounded-xl shadow-sm max-w-md w-full p-8 text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.13em] text-brandGreen mb-3">
          Error
        </div>
        <h1 className="font-display text-4xl text-textTitle mb-3">
          Something went wrong
        </h1>
        <p className="text-textTitle/65 text-sm mb-7">
          An unexpected error occurred. Try refreshing the page or go back home.
        </p>

        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-5 py-2.5 rounded-xl bg-brandGreen text-white text-sm font-medium hover:opacity-90 transition"
          >
            Try again
          </button>
          <Link
            href="/"
            className="px-5 py-2.5 rounded-xl bg-bgSage text-textTitle text-sm font-medium hover:opacity-75 transition"
          >
            Go home
          </Link>
        </div>

        {process.env.NODE_ENV === 'development' && error.message && (
          <p className="mt-6 text-xs text-textTitle/65 pt-6 border-t border-bgSage">
            {error.message}
          </p>
        )}
      </div>
    </main>
  )
}
