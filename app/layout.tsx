import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import Nav            from './components/Nav'
import PageTransition from './components/PageTransition'

// ── Playfair Display — 400, 400i, 700, 700i only ──────────────
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '700'],
})

// ── DM Sans — 400, 500, 600 only ──────────────────────────────
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600'],
})

export const metadata: Metadata = {
  icons: {
    icon: '/assets/icon_green.png',
  },
  title: 'Bread Head — Know Your Dough',
  description:
    'The financial literacy app built for teens. Learn real money skills, simulate budgets, and build lasting habits through reflection.',
  openGraph: {
    title: 'Bread Head — Know Your Dough',
    description:
      'The financial literacy app built for teens. Learn real money skills, simulate budgets, and build lasting habits.',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="font-body">
        <PageTransition />
        <Nav />
        {children}
      </body>
    </html>
  )
}
