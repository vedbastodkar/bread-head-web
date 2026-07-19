import type { MetadataRoute } from 'next'

const BASE_URL = 'https://bread-head.org'

export default function sitemap(): MetadataRoute.Sitemap {
  const routes: {
    path: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
  }[] = [
    { path: '/', changeFrequency: 'weekly', priority: 1.0 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/features', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/lessons', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/budget', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/journal', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/partners', changeFrequency: 'monthly', priority: 0.7 },
    { path: '/support', changeFrequency: 'yearly', priority: 0.5 },
    { path: '/privacy-notice', changeFrequency: 'yearly', priority: 0.3 },
  ]

  return routes.map((route) => ({
    url: `${BASE_URL}${route.path}`,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
