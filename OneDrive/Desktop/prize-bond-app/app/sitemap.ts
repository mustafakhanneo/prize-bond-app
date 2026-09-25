import type { MetadataRoute } from 'next'
 
export default function sitemap(): MetadataRoute.Sitemap {

  const WEBSITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://YOUR-DOMAIN.com";

  return [
    {
      url: WEBSITE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
  ]
}