import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = 'https://aestheticpk.com';
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
