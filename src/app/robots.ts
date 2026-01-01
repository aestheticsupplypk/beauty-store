import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const site = SITE_URL;
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      // Block non-SEO paths
      { userAgent: '*', disallow: ['/admin', '/checkout', '/api'] },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
