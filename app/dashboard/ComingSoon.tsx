'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// Temporary curtain shown in place of every /dashboard/** route while the
// dashboard is being stabilised. Nothing under app/dashboard/ was removed —
// flip DASHBOARD_ENABLED in ./layout.tsx to bring the real pages back.
export function ComingSoon() {
  const router = useRouter()

  // router.back() is a no-op when the dashboard was opened directly (no history
  // to pop), so fall back to the homepage in that case.
  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back()
    else router.push('/')
  }

  return (
    <main className="min-h-screen bg-bgSage flex items-center justify-center px-4 pt-28 pb-16">
      <div className="w-full max-w-lg text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.13em] text-brandGreen">
          Dashboard
        </p>

        <h1 className="font-display italic text-textTitle mt-3 text-[34px] md:text-[42px] leading-[1.15]">
          Coming soon
        </h1>

        <p className="font-body text-[15px] leading-[1.7] text-textTitle/65 mt-4">
          We&rsquo;re hard at work getting this ready. Check back shortly.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={goBack}
            className="w-full sm:w-auto px-6 py-3 rounded-xl border border-textTitle/15 bg-white/60 text-sm font-medium text-textTitle/75 hover:text-textTitle hover:bg-white transition"
          >
            ← Back
          </button>
          <Link
            href="/"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brandGreen text-white text-sm font-bold hover:bg-[#3d4e3d] transition"
          >
            Home
          </Link>
        </div>
      </div>
    </main>
  )
}
