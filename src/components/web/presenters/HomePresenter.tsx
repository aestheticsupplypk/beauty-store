'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageCarousel from './ImageCarousel';

type HomePresenterProps = {
  onAddToCart?: () => void;
  startingPrice?: number | null;
  colorPrices?: Record<string, number>;
  colorAvailability?: Record<string, number>;
  products?: { id: string; name: string; slug: string; fromPrice: number | null; image: string | null }[];
};

type ColorOption = {
  name: string;
  value: string;
  tailwindClass: string;
};

export default function HomePresenter({ onAddToCart, startingPrice, colorPrices, colorAvailability, products }: HomePresenterProps) {
  const tealName = React.useMemo(() => (colorPrices && 'Teal' in (colorPrices ?? {}) && !('Teel' in (colorPrices ?? {})) ? 'Teal' : 'Teel'), [colorPrices]);
  const colorOptions: ColorOption[] = React.useMemo(() => ([
    { name: 'Black', value: '#000000', tailwindClass: 'bg-black' },
    { name: 'White', value: '#FFFFFF', tailwindClass: 'bg-white ring-1 ring-gray-200' },
    { name: 'Pink', value: '#EC4899', tailwindClass: 'bg-pink-500' },
    { name: tealName, value: '#14B8A6', tailwindClass: 'bg-teal-500' },
  ]), [tealName]);
  const [selectedColor, setSelectedColor] = React.useState<ColorOption>(colorOptions[0]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const hasProducts = Array.isArray(products) && products.length > 0;
  const activeProduct = hasProducts ? products[Math.max(0, Math.min(activeIndex, products.length - 1))] : null;
  const handleAdd = React.useCallback(() => {
    if (typeof onAddToCart === 'function') onAddToCart();
  }, [onAddToCart]);
  return (
    <div className="min-h-screen bg-gradient-to-r from-amber-50 via-rose-50 to-stone-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-fuchsia-500 bg-clip-text text-transparent">Aesthetic PK</h1>
              <span className="text-rose-700 tracking-wide uppercase text-sm font-medium">Professional Beauty & Parlour Supplies</span>
            </div>
            <nav className="flex items-center space-x-8">
              <Link href="/products" className="text-rose-700 hover:text-rose-800 font-medium transition-colors">Products</Link>
              <Link href="/track-order" className="text-rose-700 hover:text-rose-800 font-medium transition-colors">Track Order</Link>
              <button className="text-rose-700 hover:text-rose-800 relative group">
                <svg className="w-6 h-6 transform group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="text-rose-900 space-y-8">
            <h2 className="text-4xl sm:text-5xl font-bold">{activeProduct?.name || 'Signature Beauty Collection'}</h2>
            <div className="space-y-8 max-w-2xl">
              <div className="h-px w-24 bg-gradient-to-r from-rose-500 via-fuchsia-400 to-transparent" />
              <div className="relative pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 via-fuchsia-400 to-transparent rounded-full" />
                <p className="text-xl text-rose-900 leading-relaxed tracking-wide font-medium">
                  Glow-focused skincare, salon-grade treatments, and parlour essentials curated for professionals and beauty lovers across Pakistan.
                </p>
              </div>
              <div className="relative pr-6 mt-8">
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-500 via-fuchsia-400 to-transparent rounded-full" />
                <p className="text-xl text-rose-900 leading-relaxed font-urdu text-right tracking-wider font-medium" dir="rtl">
                  نرم جلد، خوبصورت بال اور پرفیکٹ فینش کے لیے منتخب پروفیشنل بیوٹی پراڈکٹس، جو آپ کے سیلون اور گھریلو استعمال دونوں کے لیے موزوں ہیں۔
                </p>
              </div>
            </div>
            <div className="space-y-8">
              <div className="space-y-4">
                <p className="text-sm font-medium text-rose-700">Select Shade / Variant:</p>
                <div className="flex items-center gap-3">
                  {colorOptions.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => setSelectedColor(color)}
                      className={`w-10 h-10 rounded-full ${color.tailwindClass} transition-all ${selectedColor.name === color.name ? 'scale-110 ring-2 ring-blue-600 ring-offset-2' : 'hover:scale-105 hover:shadow'} shadow-sm`}
                      title={color.name}
                      aria-label={`Select ${color.name} color`}
                    />
                  ))}
                </div>
                <div className="text-sm text-rose-800">Selected: <span className="font-semibold">{selectedColor.name}</span></div>
              </div>
              
              <div className="flex items-center flex-wrap gap-4">
                <span className="text-3xl font-bold text-rose-900">
                  {activeProduct?.fromPrice != null ? `PKR ${Number(activeProduct.fromPrice).toLocaleString()}` : 'PKR —'}
                </span>
                <span className="text-sm text-rose-800">
                  {(() => {
                    const avail = colorAvailability?.[selectedColor.name];
                    if (avail == null) return '';
                    return avail > 0 ? `${avail} available` : 'Out of stock';
                  })()}
                </span>
                <Link
                  href={activeProduct ? `/lp/${activeProduct.slug}` : '/products'}
                  className="font-medium px-8 py-3 rounded-lg transition-all text-white bg-gradient-to-r from-rose-500 to-fuchsia-500 hover:from-rose-600 hover:to-fuchsia-600"
                >
                  View product
                </Link>
              </div>
            </div>
          </div>
          <div className="relative flex items-center justify-center bg-gradient-to-r from-amber-50/70 via-rose-50/70 to-stone-50/70 rounded-3xl overflow-hidden p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0%,transparent_70%)]" />
            
            {/* Feature Badges */}
            <div className="absolute top-6 left-6 flex gap-2">
              <div className="bg-rose-500/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                Salon Grade
              </div>
              <div className="bg-rose-500/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                Dermatologist Inspired
              </div>
              <div className="bg-rose-500/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                Trusted by Beauticians
              </div>
            </div>

            <div className="relative w-full max-w-4xl mx-auto px-4 py-8">
              <div className="absolute inset-y-1/2 -left-1 translate-y-[-50%] hidden sm:flex">
                {hasProducts && products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveIndex((idx) => (idx - 1 + products.length) % products.length)}
                    className="w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white text-blue-700"
                    aria-label="Previous product"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M12.5 4L7.5 10L12.5 16"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
              <div className="absolute inset-y-1/2 -right-1 translate-y-[-50%] hidden sm:flex">
                {hasProducts && products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setActiveIndex((idx) => (idx + 1) % products.length)}
                    className="w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white text-blue-700"
                    aria-label="Next product"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7.5 4L12.5 10L7.5 16" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                )}
              </div>
              <div className="relative w-full max-w-2xl mx-auto bg-blend-screen">
                <div className="absolute inset-0 bg-gradient-to-t from-rose-300/15 to-transparent" />
                <Image
                  src={(activeProduct?.image as string) || '/images/9e6a7339bbd3890af376ef20faeea292.avif'}
                  alt={activeProduct?.name || 'Aesthetic PK hair & beauty product'}
                  width={800}
                  height={600}
                  className="w-full h-auto select-none mix-blend-multiply brightness-110"
                  priority
                  quality={100}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description */}
      <div className="relative py-24 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-rose-50/60 to-white/60" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.15)_0%,transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.12)_0%,transparent_50%)]" />
        
        {/* Curved Divider Top */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-rose-100 to-transparent" />
        <div className="absolute top-0 left-0 right-0 overflow-hidden">
          <svg className="relative block w-full h-8 text-blue-100" viewBox="0 0 1200 80" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor" className="text-white/10" />
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" fill="currentColor" className="text-white/5" />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-rose-900">Beauty that Works as Hard as You Do</h2>
          <p className="text-xl text-rose-800 leading-relaxed">
            High-performance skincare, makeup and salon equipment that help professionals deliver consistent, camera-ready results while keeping routines simple for everyday customers.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mt-16 text-left">
            <div className="absolute -left-48 -top-48 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
            <div className="absolute -right-48 -bottom-48 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-rose-900">Salon-Quality Results</h3>
                  <p className="text-rose-700">Formulas and tools selected to perform in busy parlours and at-home routines alike.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-rose-900">Trusted Ingredients</h3>
                  <p className="text-rose-700">Carefully vetted actives and textures that are gentle yet effective for regular clients.</p>
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-rose-900">For Every Skin & Hair Type</h3>
                  <p className="text-rose-700">Options for different concerns, from bridal glam to everyday glow-ups.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-rose-900">Consistent Supply</h3>
                  <p className="text-rose-700">Bulk-friendly packs and restock support for parlours and academies.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Features */}
      <div className="relative py-20 bg-gradient-to-r from-rose-100 via-rose-200 to-rose-100 overflow-hidden">
        {/* Wave Pattern */}
        <div className="absolute top-0 left-0 right-0 h-24 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor" className="text-white/10" />
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" fill="currentColor" className="text-white/5" />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h3 className="text-3xl sm:text-4xl font-bold text-center mb-8 text-rose-900">Why Professionals Choose Aesthetic PK</h3>
        <div className="flex flex-nowrap overflow-x-auto gap-6 max-w-5xl mx-auto pb-4 px-2 pr-8 snap-x snap-mandatory -mx-2 scrollbar-blue">
          <div className="flex-none w-[280px] snap-start">
            <div className="mb-4">
              <ImageCarousel 
                images={[
                  { src: '/images/2c6e7458128b076e82bd99f52ab130c8.avif', alt: 'Find My Device Front' },
                  { src: '/images/94caacfb5a2c869439a89646703d75bb.avif', alt: 'Find My Device App' },
                ]}
              />
            </div>
            <h4 className="text-lg font-bold mb-2 text-rose-900">Face & Skin Care</h4>
            <p className="text-sm text-rose-700">Serums, masks and treatments curated for Pakistani climate and routines.</p>
          </div>

          <div className="flex-none w-[280px] snap-start">
            <div className="mb-4">
              <ImageCarousel 
                images={[
                  { src: '/images/3c03271147d6f8062d3cdbea740aee99.avif', alt: 'Battery Life Front' },
                  { src: '/images/8f2cf7b23a638f499313f6fbf6bd4087.avif', alt: 'Battery Life Detail' },
                ]}
              />
            </div>
            <h4 className="text-lg font-bold mb-2 text-rose-900">Hair & Styling</h4>
            <p className="text-sm text-rose-700">Oils, treatments and styling products for long hours and bridal looks.</p>
          </div>

          <div className="flex-none w-[280px] snap-start">
            <div className="mb-4">
              <ImageCarousel 
                images={[
                  { src: '/images/8227e60d14e5f9f681bd580a6671b3c5.avif', alt: 'Waterproof Front' },
                  { src: '/images/cad05795ed848d2c89cb4b7b53970f4c.avif', alt: 'Waterproof Detail' },
                ]}
              />
            </div>
            <h4 className="text-lg font-bold mb-2 text-rose-900">Salon Equipment</h4>
            <p className="text-sm text-rose-700">Practical tools and accessories that fit inside real parlours.</p>
          </div>

          <div className="flex-none w-[280px] snap-start">
            <div className="mb-4">
              <ImageCarousel 
                images={[
                  { src: '/images/d3d9555482ccfc3130698b9400c07518.avif', alt: 'Compact Front' },
                  { src: '/images/ab848a78a9c626e6cb937806b8c8fbfd.avif', alt: 'Compact Detail' },
                ]}
              />
            </div>
            <h4 className="text-lg font-bold mb-2 text-rose-900">Bundles & Kits</h4>
            <p className="text-sm text-rose-700">Ready-made combinations for academies, salons and starter setups.</p>
          </div>
        </div>
      </div>
      </div>

      {/* Delivery Information */}
      <div className="relative py-24 overflow-hidden">
        {/* Background with Dots Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-50 via-rose-100 to-rose-50" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(244,114,182,0.16) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <div className="relative p-10 rounded-2xl bg-white/60 backdrop-blur-sm shadow-sm hover:shadow-md transition-shadow">
              <div className="absolute inset-0 bg-gradient-to-br from-rose-50/40 via-transparent to-rose-100/40 rounded-2xl" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-2xl text-rose-800 leading-loose font-urdu text-right" dir="rtl">
                نرم ہاتھوں کی محنت، خوبصورت چہرے کی چمک،<br />
                ہر دلہن، ہر بیوتیشن کا ہو انداز الگ۔<br />
                اچھا سامان ہو تو کام میں آئے نکھار،<br />
                بس اسی سوچ سے ہم لائے ہیں یہ بیوٹی اسٹاک بے شمار۔<br />
                سیلون ہو یا گھر، ہر جگہ حسن کا حق،<br />
                ساتھ ہو جب Aesthetic PK، تو ہر لک ہو پرفیکٹ۔
              </p>
              <div className="mt-10 pt-6 border-t border-rose-100/60">
                <div className="flex items-center gap-3 text-rose-700">
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm">
                    <span className="font-medium">Available Across Pakistan:</span> Delivery and Cash on Delivery for salons, academies and beauty lovers in all major cities including Karachi, Lahore, Islamabad, Rawalpindi, Peshawar and Faisalabad.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Products Grid (scalable) */}
      {Array.isArray(products) && products.length > 0 && (
        <div className="py-16 bg-white/60">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-rose-900">Featured Beauty & Salon Products</h3>
              <a href="/products" className="text-rose-700 hover:text-rose-900 text-sm font-medium">View all</a>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <Link key={p.id} href={`/lp/${p.slug}`} className="group rounded-xl border border-rose-100 bg-white hover:shadow-md transition-shadow overflow-hidden">
                  <div className="aspect-[4/3] w-full bg-rose-50 grid place-items-center overflow-hidden">
                    {p.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform" />
                    ) : (
                      <div className="text-rose-300 text-sm">Image coming soon</div>
                    )}
                  </div>
                  <div className="p-4 space-y-1">
                    <div className="font-medium text-rose-900 truncate">{p.name}</div>
                    <div className="text-sm text-rose-700">{p.fromPrice != null ? `From PKR ${Number(p.fromPrice).toLocaleString()}` : 'Price coming soon'}</div>
                    <div className="pt-2 text-sm text-rose-600 group-hover:text-rose-800 font-medium">View product →</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
