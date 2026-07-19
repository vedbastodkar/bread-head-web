import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/dashboard',
        '/mybudget',
        '/myjournal',
        '/mylessons',
        '/student',
        '/grades',
        '/account',
        '/budgetchallenge',
        '/login',
      ],
    },
    sitemap: 'https://bread-head.org/sitemap.xml',
  }
}
