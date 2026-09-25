import type { MetadataRoute } from 'next'
 
export default function robots(): MetadataRoute.Robots {
    const WEBSITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://YOUR-DOMAIN.com";
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: '/private/',
    },
    sitemap: `${WEBSITE_URL}/sitemap.xml`,
  }
}