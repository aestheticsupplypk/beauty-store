import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabaseServer';

// Use a fixed canonical base URL so the sitemap always matches the verified
// domain in Google Search Console and avoids "URL not allowed" errors.
const BASE_URL = 'https://aestheticpk.com';

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    // Fetch active products to include their LP URLs
    const { data: products } = await supabase
      .from('products')
      .select('slug, active')
      .eq('active', true);

    const urls: string[] = [];

    // Core pages
    urls.push('/');
    urls.push('/products');

    // LPs for active products
    for (const p of products || []) {
      const slug = (p as any).slug as string | null;
      if (!slug) continue;
      urls.push(`/lp/${slug}`);
    }

    const urlset = urls
      .map((path) => {
        const loc = `${BASE_URL.replace(/\/$/, '')}${path}`;
        // Give LPs and home slightly higher priority
        const priority = path === '/' ? '1.0' : path.startsWith('/lp/') ? '0.9' : '0.8';
        return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly<\/changefreq>\n    <priority>${priority}<\/priority>\n  <\/url>`;
      })
      .join('\n');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urlset}\n<\/urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  } catch (e) {
    // In case of error, return a minimal sitemap with just the homepage
    const fallback = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${BASE_URL.replace(/\/$/, '')}/<\/loc>\n    <changefreq>weekly<\/changefreq>\n    <priority>1.0<\/priority>\n  <\/url>\n<\/urlset>`;
    return new NextResponse(fallback, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml; charset=utf-8',
      },
    });
  }
}
