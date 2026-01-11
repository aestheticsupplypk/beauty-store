import { getSupabaseServerClient } from '@/lib/supabaseServer';
import { isPurchasableFromPrice } from '@/lib/purchasable';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ProductsIndexPage() {
  const supabase = getSupabaseServerClient();

  const { data: products } = await supabase
    .from('products')
    .select('id, name, slug')
    .eq('active', true)
    .order('created_at', { ascending: false });

  // Purchasable = active product + has at least one active variant with price > 0
  const cards: { id: string; name: string; slug: string; fromPrice: number | null; image: string | null; isPurchasable: boolean }[] = [];

  for (const p of products ?? []) {
    const pid = (p as any).id as string;
    const name = (p as any).name as string;
    const slug = (p as any).slug as string;

    // Get min price from active variants with price > 0 (purchasable definition)
    const { data: pv } = await supabase
      .from('variants')
      .select('price, active')
      .eq('product_id', pid)
      .eq('active', true)
      .gt('price', 0)
      .order('price', { ascending: true })
      .limit(1);
    const fromPrice = pv && pv.length ? Number((pv[0] as any).price) : null;
    const isPurchasable = isPurchasableFromPrice({ fromPrice });

    const { data: media } = await supabase
      .from('product_media')
      .select('url, type, sort')
      .eq('product_id', pid)
      .eq('type', 'image')
      .order('sort', { ascending: true })
      .limit(1);
    const image = media && media.length ? ((media[0] as any).url as string) : null;

    cards.push({ id: pid, name, slug, fromPrice, image, isPurchasable });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FFF7F3] to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-[#7A1E3A]">Products</h1>
          <Link href="/" className="text-[#7A1E3A] hover:text-[#5A1226] text-sm font-medium">
            Back to home
          </Link>
        </header>

        {cards.length === 0 ? (
          <p className="text-sm text-[#7A7A7A]">No products available yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((p) => (
              <div
                key={p.id}
                className={`group rounded-xl border border-[#EFD6DE] bg-white overflow-hidden ${p.isPurchasable ? 'hover:shadow-md transition-shadow' : 'opacity-75'}`}
              >
                {/* Image with Coming Soon badge for non-purchasable */}
                <Link href={`/lp/${p.slug}`}>
                  <div className="aspect-[4/3] w-full bg-rose-50 grid place-items-center overflow-hidden relative">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={p.image}
                        alt={p.name}
                        className={`w-full h-full object-cover ${p.isPurchasable ? 'group-hover:scale-[1.02] transition-transform' : ''}`}
                      />
                    ) : (
                      <div className="text-rose-300 text-sm">Image coming soon</div>
                    )}
                    {/* Coming Soon badge */}
                    {!p.isPurchasable && (
                      <div className="absolute top-3 right-3 bg-[#7A1E3A]/90 text-white text-xs font-medium px-3 py-1 rounded-full">
                        Coming Soon
                      </div>
                    )}
                  </div>
                </Link>
                <div className="p-4 space-y-1">
                  <Link href={`/lp/${p.slug}`}>
                    <div className="font-medium text-[#2B2B2B] truncate hover:text-[#7A1E3A]">{p.name}</div>
                  </Link>
                  {p.isPurchasable ? (
                    <>
                      <div className="text-sm font-semibold text-[#7A1E3A]">
                        From PKR {Number(p.fromPrice).toLocaleString()}
                      </div>
                      <div className="text-xs text-[#7A7A7A]">COD • 24–48h Dispatch</div>
                      <Link 
                        href={`/lp/${p.slug}`}
                        className="block pt-2 text-sm text-[#7A1E3A] group-hover:text-[#5A1226] font-medium"
                      >
                        View product →
                      </Link>
                    </>
                  ) : (
                    <>
                      <div className="text-sm text-[#7A7A7A]">Price coming soon</div>
                      <div className="pt-2 text-sm text-[#7A7A7A]">Coming soon</div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
