import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import './globals.css'
import Nav            from './components/Nav'
import PageTransition from './components/PageTransition'
import { AuthProvider } from './context/AuthContext'
import { Analytics } from '@vercel/analytics/react'

// ── Playfair Display — 400, 400i, 700, 700i only ──────────────
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
  style: ['normal', 'italic'],
  weight: ['400', '700'],
})

// ── DM Sans — 400, 500, 600, 700 ──────────────────────────────
const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

// 1200x630 is the ratio Slack, iMessage, LinkedIn and X crop to — the old
// 1024x512 logo got letterboxed in every one of them.
const OG_IMAGE = {
  url: '/assets/og_card.png',
  width: 1200,
  height: 630,
  alt: 'Bread Head: the financial literacy app built for teens',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://bread-head.org'),
  icons: {
    icon: '/assets/icon_green.png',
  },
  title: {
    default: 'Bread Head: Know Your Dough',
    template: '%s | Bread Head',
  },
  description:
    'The financial literacy app built for teens. Learn real money skills, simulate budgets, and build lasting habits through reflection.',
  openGraph: {
    title: 'Bread Head: Know Your Dough',
    description:
      'The financial literacy app built for teens. Learn real money skills, simulate budgets, and build lasting habits.',
    type: 'website',
    url: 'https://bread-head.org',
    siteName: 'Bread Head',
    images: [OG_IMAGE],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bread Head: Know Your Dough',
    description:
      'The financial literacy app built for teens. Learn real money skills, simulate budgets, and build lasting habits.',
    images: [OG_IMAGE.url],
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
        <AuthProvider>
          <PageTransition />
          <Nav />
          {children}
          {/* Cookieless, no cross-site tracking, same-origin beacons — so this
              needs no consent banner and keeps the privacy notice accurate. */}
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  )
}
