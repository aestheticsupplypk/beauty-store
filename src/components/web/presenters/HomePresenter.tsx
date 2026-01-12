'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import ImageCarousel from './ImageCarousel';
import CartIcon from '@/components/web/cart/CartIcon';
import { useCart } from '@/contexts/CartContext';

type ProductCard = { id: string; name: string; slug: string; fromPrice: number | null; image: string | null };

type HomePresenterProps = {
  onAddToCart?: () => void;
  startingPrice?: number | null;
  colorPrices?: Record<string, number>;
  colorAvailability?: Record<string, number>;
  products?: ProductCard[];
  primaryGallery?: string[];
  activeProductCount?: number;
  featuredProduct?: ProductCard | null;
  productsHref?: string;
};

type ColorOption = {
  name: string;
  value: string;
  tailwindClass: string;
};

export default function HomePresenter({ onAddToCart, startingPrice, colorPrices, colorAvailability, products, primaryGallery, activeProductCount = 0, featuredProduct, productsHref = '/products' }: HomePresenterProps) {
  const { itemCount } = useCart();
  
  // Cart icon visibility: show only when cart has items (per spec Q1)
  const showCartIcon = itemCount > 0;
  
  const tealName = React.useMemo(() => (colorPrices && 'Teal' in (colorPrices ?? {}) && !('Teel' in (colorPrices ?? {})) ? 'Teal' : 'Teel'), [colorPrices]);
  const colorOptions: ColorOption[] = React.useMemo(() => ([
    { name: 'Black', value: '#000000', tailwindClass: 'bg-black' },
    { name: 'White', value: '#FFFFFF', tailwindClass: 'bg-white ring-1 ring-gray-200' },
    { name: 'Pink', value: '#EC4899', tailwindClass: 'bg-pink-500' },
    { name: tealName, value: '#14B8A6', tailwindClass: 'bg-teal-500' },
  ]), [tealName]);
  const [selectedColor, setSelectedColor] = React.useState<ColorOption>(colorOptions[0]);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);
  const [userInteracted, setUserInteracted] = React.useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [urduExpanded, setUrduExpanded] = React.useState(false);
  const [showSwipeHint, setShowSwipeHint] = React.useState(true);
  const [showHowItWorks, setShowHowItWorks] = React.useState(false);
  const [showWhyUs, setShowWhyUs] = React.useState(false);
  const [showReturnPolicy, setShowReturnPolicy] = React.useState(false);
  const hasProducts = Array.isArray(products) && products.length > 0;
  
  // Auto-hide swipe hint after 3 seconds
  React.useEffect(() => {
    if (!hasProducts || !products || products.length <= 1) return;
    const timer = setTimeout(() => setShowSwipeHint(false), 3000);
    return () => clearTimeout(timer);
  }, [hasProducts, products]);
  const activeProduct = hasProducts ? products[Math.max(0, Math.min(activeIndex, products.length - 1))] : null;
  
  // Auto-slideshow: 6s interval, only when 2+ products, pause on hover or after user interaction
  React.useEffect(() => {
    if (!hasProducts || !products || products.length <= 1) return;
    if (isPaused || userInteracted) return;
    
    const productCount = products.length;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % productCount);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [hasProducts, products, isPaused, userInteracted]);
  
  // Manual navigation handlers
  const goToSlide = (index: number) => {
    setActiveIndex(index);
    setUserInteracted(true);
  };
  const goToPrev = () => {
    if (!products) return;
    setActiveIndex((prev) => (prev - 1 + products.length) % products.length);
    setUserInteracted(true);
  };
  const goToNext = () => {
    if (!products) return;
    setActiveIndex((prev) => (prev + 1) % products.length);
    setUserInteracted(true);
  };
  const handleAdd = React.useCallback(() => {
    if (typeof onAddToCart === 'function') onAddToCart();
  }, [onAddToCart]);
  const getProductImage = (idx: number, fallbackAlt: string): { src: string; alt: string; hasImage: boolean } => {
    // If we only have a single product but a gallery of LP images, use those for richer visuals
    if (Array.isArray(products) && products.length === 1 && Array.isArray(primaryGallery) && primaryGallery.length > 0) {
      const galleryIdx = idx % primaryGallery.length;
      const src = primaryGallery[galleryIdx];
      if (src) {
        return { src, alt: fallbackAlt, hasImage: true };
      }
    }

    const p = Array.isArray(products) && products[idx] ? products[idx] : null;
    if (p?.image) {
      return { src: p.image, alt: p.name, hasImage: true };
    }
    return { src: '', alt: fallbackAlt, hasImage: false };
  };
  return (
    <div className="min-h-screen bg-[#FFF7F3]">
      {/* Header - Mobile: hamburger + centered logo + cart | Desktop: full nav */}
      <header className="bg-white sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-4">
          {/* Mobile Header - more breathing room */}
          <div className="flex sm:hidden items-center justify-between">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2.5 -ml-2 text-[#7A1E3A] hover:bg-rose-50 rounded-lg transition-colors"
              aria-label="Open menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#A12B52] to-[#7A1E3A] bg-clip-text text-transparent">Aesthetic PK</h1>
            <div className="p-2 -mr-2">
              {showCartIcon ? (
                <CartIcon className="text-[#7A1E3A]" />
              ) : (
                <div className="w-6" /> 
              )}
            </div>
          </div>
          
          {/* Desktop Header */}
          <div className="hidden sm:flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#A12B52] to-[#7A1E3A] bg-clip-text text-transparent">Aesthetic PK</h1>
              <span className="text-[#7A1E3A] tracking-wide uppercase text-sm font-medium">Professional Beauty & Parlour Supplies</span>
            </div>
            <nav className="flex items-center space-x-8">
              <Link href={productsHref} className="text-[#7A1E3A] hover:text-[#5A1226] font-medium transition-colors">Products</Link>
              {showCartIcon && (
                <CartIcon className="text-[#7A1E3A] hover:text-[#5A1226]" />
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-50 sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white z-50 shadow-xl sm:hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-bold text-[#7A1E3A]">Menu</h2>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
                aria-label="Close menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <nav className="p-4 space-y-1">
              <Link 
                href={productsHref}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                Products
              </Link>
              <Link 
                href="/track"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                Track Order
              </Link>
              <Link 
                href="/parlours"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Wholesale / Parlours
              </Link>
              <Link 
                href="/returns"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
                </svg>
                Returns Policy
              </Link>
              <Link 
                href="/shipping"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
                Shipping & Delivery
              </Link>
              <Link 
                href="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                About Aesthetic PK
              </Link>
            </nav>
            {/* Trust footer line */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-rose-50/50">
              <p className="text-xs text-center text-gray-600">🇵🇰 Nationwide COD · Salon Tested Products</p>
            </div>
          </div>
        </>
      )}

      {/* Hero Section - Compact on mobile */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-12 items-start">
          <div className="text-[#2B2B2B] space-y-4 sm:space-y-8">
            <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold">
              Salon-Grade Beauty. Trusted Across Pakistan.
            </h2>
            <div className="space-y-4 sm:space-y-8 max-w-2xl">
              <div className="h-px w-24 bg-gradient-to-r from-[#A12B52] via-[#E0869C] to-transparent" />
              <div className="relative pl-4 sm:pl-6">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#A12B52] via-[#E0869C] to-transparent rounded-full" />
                <p className="text-[13px] sm:text-lg lg:text-xl text-[#2B2B2B] leading-relaxed tracking-wide font-medium">
                  Professional skincare, hair treatments, and salon essentials — tested for real results in Pakistani
                  conditions.
                </p>
              </div>
              {/* Urdu text - collapsible on mobile (hidden by default) */}
              <div className="relative pr-4 sm:pr-6 mt-3 sm:mt-8">
                <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#A12B52] via-[#E0869C] to-transparent rounded-full" />
                {/* Mobile: hidden by default with toggle button */}
                <div className="sm:hidden">
                  {!urduExpanded ? (
                    <button 
                      onClick={() => setUrduExpanded(true)}
                      className="text-[12px] text-[#7A1E3A] font-medium font-urdu"
                      dir="rtl"
                    >
                      اردو دیکھیں ←
                    </button>
                  ) : (
                    <>
                      <p className="text-[13px] text-[#2B2B2B] leading-relaxed font-urdu text-right tracking-wider font-medium" dir="rtl">
                        نرم جلد، خوبصورت بال اور پرفیکٹ فینش کے لیے منتخب پروفیشنل بیوٹی پراڈکٹس، جو آپ کے سیلون اور گھریلو استعمال
                        دونوں کے لیے موزوں ہیں۔
                      </p>
                      <button 
                        onClick={() => setUrduExpanded(false)}
                        className="text-[11px] text-gray-500 mt-1"
                      >
                        Hide
                      </button>
                    </>
                  )}
                </div>
                {/* Desktop: full text */}
                <p className="hidden sm:block text-lg lg:text-xl text-[#2B2B2B] leading-relaxed font-urdu text-right tracking-wider font-medium" dir="rtl">
                  نرم جلد، خوبصورت بال اور پرفیکٹ فینش کے لیے منتخب پروفیشنل بیوٹی پراڈکٹس، جو آپ کے سیلون اور گھریلو استعمال
                  دونوں کے لیے موزوں ہیں۔
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4">
              {/* Primary CTA: dynamic based on active product in slideshow */}
              <div className="flex flex-wrap items-center gap-4">
                {activeProduct ? (
                  <Link
                    href={`/lp/${activeProduct.slug}`}
                    className="font-medium px-8 py-3 rounded-lg transition-all text-white bg-[#7A1E3A] hover:bg-[#5A1226]"
                  >
                    {activeProductCount === 1 ? 'Order Now' : `View ${activeProduct.name}`}
                  </Link>
                ) : (
                  <Link
                    href={productsHref}
                    className="font-medium px-8 py-3 rounded-lg transition-all text-white bg-[#7A1E3A] hover:bg-[#5A1226]"
                  >
                    Shop professionals&apos; picks
                  </Link>
                )}
                {/* Secondary CTA: only show when multiple products */}
                {activeProductCount > 1 && (
                  <Link
                    href={productsHref}
                    className="font-medium px-8 py-3 rounded-lg border border-[#EFD6DE] text-[#7A1E3A] bg-white/90 hover:bg-white"
                  >
                    View all products
                  </Link>
                )}
              </div>
              {/* Compact trust line under CTA */}
              <p className="text-xs text-gray-500">
                COD Available • 24–48h Dispatch • Easy Returns
              </p>
            </div>
          </div>
          <div className={`relative flex items-center justify-center bg-gradient-to-r from-[#FFF7F3] via-rose-20 to-[#FFF7F3] rounded-3xl overflow-hidden p-8 ${activeProductCount === 1 ? 'hidden sm:flex' : ''}`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.9)_0%,transparent_70%)]" />
            
            {/* Feature Badges - hidden on mobile, shown on desktop */}
            <div className="absolute top-6 left-6 hidden sm:flex gap-2">
              <div className="bg-[#7A1E3A]/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                Salon Grade
              </div>
              <div className="bg-[#7A1E3A]/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                Dermatologist Inspired
              </div>
              <div className="bg-[#7A1E3A]/90 backdrop-blur-sm text-white text-sm font-medium px-3 py-1 rounded-full shadow-sm">
                Trusted by Beauticians
              </div>
            </div>

            {/* Hero image area with pause on hover */}
            <div 
              className="relative w-full max-w-4xl mx-auto px-4 py-8"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              {/* Prev arrow - only show for 2+ products */}
              <div className="absolute inset-y-1/2 -left-1 translate-y-[-50%] hidden sm:flex">
                {hasProducts && products && products.length > 1 && (
                  <button
                    type="button"
                    onClick={goToPrev}
                    className="w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white text-[#7A1E3A]"
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
              {/* Next arrow - only show for 2+ products */}
              <div className="absolute inset-y-1/2 -right-1 translate-y-[-50%] hidden sm:flex">
                {hasProducts && products && products.length > 1 && (
                  <button
                    type="button"
                    onClick={goToNext}
                    className="w-9 h-9 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white text-[#7A1E3A]"
                    aria-label="Next product"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M7.5 4L12.5 10L7.5 16"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                )}
              </div>
              {/* Fixed aspect ratio container for consistent image sizing */}
              <div className="relative w-full max-w-md mx-auto aspect-[4/5] overflow-hidden rounded-xl">
                <div className="absolute inset-0 bg-gradient-to-t from-rose-300/15 to-transparent z-10" />
                {activeProduct?.image ? (
                  <Image
                    src={activeProduct.image}
                    alt={activeProduct?.name || 'Aesthetic PK hair & beauty product'}
                    fill
                    className="object-contain select-none"
                    priority
                    quality={100}
                  />
                ) : (
                  <div className="w-full h-full bg-rose-50 flex items-center justify-center">
                    <span className="text-rose-300 text-sm">Image coming soon</span>
                  </div>
                )}
              </div>
              {/* Dots navigation + swipe hint - only show for 2+ products */}
              {hasProducts && products && products.length > 1 && (
                <div className="flex flex-col items-center gap-2 mt-4">
                  <div className="flex justify-center gap-2">
                    {products.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => goToSlide(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${
                          idx === activeIndex 
                            ? 'bg-[#7A1E3A] w-6' 
                            : 'bg-[#7A1E3A]/30 hover:bg-[#7A1E3A]/50'
                        }`}
                        aria-label={`Go to product ${idx + 1}`}
                      />
                    ))}
                  </div>
                  {/* Swipe hint - fades out after 3s */}
                  {showSwipeHint && (
                    <p className="text-xs text-gray-400 sm:hidden animate-pulse">
                      Swipe to see more →
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Featured Product Card - Mobile only, single product mode */}
      {activeProduct && activeProductCount === 1 && (
        <div className="sm:hidden px-4 pb-6 bg-white">
          <Link href={`/lp/${activeProduct.slug}`} className="block">
            <div className="bg-white rounded-xl border border-rose-100 shadow-sm overflow-hidden">
              <div className="aspect-[4/5] w-full bg-rose-50 relative">
                {activeProduct.image ? (
                  <Image
                    src={activeProduct.image}
                    alt={activeProduct.name}
                    fill
                    className="object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-rose-300 text-sm">Image coming soon</span>
                  </div>
                )}
                {/* Badges inside card */}
                <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                  <span className="bg-[#7A1E3A]/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    Salon Grade
                  </span>
                  <span className="bg-[#7A1E3A]/90 text-white text-[10px] font-medium px-2 py-0.5 rounded-full">
                    Dermatologist Inspired
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <h3 className="font-semibold text-[#2B2B2B] text-lg">{activeProduct.name}</h3>
                {activeProduct.fromPrice != null && (
                  <p className="text-[#7A1E3A] font-bold text-xl">
                    From PKR {Number(activeProduct.fromPrice).toLocaleString()}
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  COD Available • 24–48h Dispatch • Easy Returns
                </p>
                <div className="pt-2">
                  <span className="block w-full text-center bg-[#7A1E3A] text-white font-medium py-3 rounded-lg">
                    Order {activeProduct.name}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Trust strip */}
      <div className="border-y border-[#EFD6DE] bg-white/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-2 sm:gap-6 text-xs sm:text-sm text-[#7A7A7A]">
          <div className="flex items-center gap-2">
            <span className="text-[#7A1E3A]">✔</span>
            <span>Cash on Delivery available</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#8C1D40]">✔</span>
            <span>Used by salons &amp; academies</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#8C1D40]">✔</span>
            <span>Dermatologist-inspired selection</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[#8C1D40]">✔</span>
            <span>Nationwide delivery across Pakistan</span>
          </div>
        </div>
      </div>

      {/* Who this is for - Hidden on mobile for LP-style experience */}
      <div className="hidden sm:block py-12 bg-[#FFF1EC]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-rose-900">
              Designed for Professionals. Trusted by Everyday Customers.
            </h2>
            <p className="text-sm sm:text-base text-rose-700">
              Whether you run a busy salon or simply love salon-level results at home, our products are selected to fit
              real routines in Pakistan.
            </p>
          </div>
          {/* Q5: Make audience cards clickable - route to featured LP with audience param */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Link 
              href={featuredProduct ? `/lp/${featuredProduct.slug}?audience=salon` : '/products'}
              className="rounded-xl bg-white shadow-sm border border-[#F3E0E7] p-5 space-y-2 text-left hover:shadow-md hover:border-[#E0869C] transition-all group"
            >
              <h3 className="font-semibold text-rose-900 group-hover:text-[#7A1E3A]">Salon owners</h3>
              <p className="text-sm text-rose-700">Reliable inventory, professional pricing, and fast restocking.</p>
            </Link>
            <Link 
              href={featuredProduct ? `/lp/${featuredProduct.slug}?audience=professional` : '/products'}
              className="rounded-xl bg-white shadow-sm border border-[#F3E0E7] p-5 space-y-2 text-left hover:shadow-md hover:border-[#E0869C] transition-all group"
            >
              <h3 className="font-semibold text-rose-900 group-hover:text-[#7A1E3A]">Beauty professionals</h3>
              <p className="text-sm text-rose-700">Salon-tested formulas that deliver consistent, client-safe results.</p>
            </Link>
            <Link 
              href={featuredProduct ? `/lp/${featuredProduct.slug}?audience=home` : '/products'}
              className="rounded-xl bg-white shadow-sm border border-[#F3E0E7] p-5 space-y-2 text-left hover:shadow-md hover:border-[#E0869C] transition-all group"
            >
              <h3 className="font-semibold text-rose-900 group-hover:text-[#7A1E3A]">Home users</h3>
              <p className="text-sm text-rose-700">Salon-style results at home with simple routines and nationwide COD.</p>
            </Link>
          </div>
        </div>
      </div>

      {/* Product Description / Why Aesthetic PK - Hidden on mobile */}
      <div className="hidden sm:block relative py-20 overflow-hidden bg-white">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-white via-[#FFF7F3] to-white" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(244,114,182,0.05)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(236,72,153,0.04)_0%,transparent_60%)]" />
        
        {/* Curved Divider Top */}
        <div className="absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-[#FFF1EC] to-transparent" />
        <div className="absolute top-0 left-0 right-0 overflow-hidden">
          <svg className="relative block w-full h-8 text-blue-100" viewBox="0 0 1200 80" preserveAspectRatio="none">
            <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor" className="text-white/10" />
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" fill="currentColor" className="text-white/5" />
        </svg>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative max-w-3xl mx-auto text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-[#2B2B2B]">Beauty that Works as Hard as You Do</h2>
          <p className="text-xl text-[#7A7A7A] leading-relaxed">
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
          {/* Q6: Scroll CTA to featured product section */}
          <div className="text-center pt-8">
            <button
              onClick={() => document.getElementById('featured-product')?.scrollIntoView({ behavior: 'smooth' })}
              className="inline-flex items-center gap-2 text-[#7A1E3A] hover:text-[#5A1226] font-medium text-sm transition-colors"
            >
              See the results
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      </div>

      {/* Why Choose Us - Trust Signals (Replaces category tiles per LP-first strategy) */}
      <div className="relative py-8 sm:py-16 bg-gradient-to-r from-rose-100 via-rose-200 to-rose-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h3 className="text-xl sm:text-3xl lg:text-4xl font-bold text-center mb-6 sm:mb-10 text-rose-900">Why Professionals Choose Aesthetic PK</h3>
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 max-w-5xl mx-auto">
            {/* Trust Signal 1 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center shadow-sm border border-rose-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#7A1E3A]/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#7A1E3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="font-semibold text-rose-900 mb-1 sm:mb-2 text-sm sm:text-base">Cash on Delivery</h4>
              <p className="text-xs sm:text-sm text-rose-700 hidden sm:block">Pay when you receive. No advance payment required.</p>
            </div>
            
            {/* Trust Signal 2 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center shadow-sm border border-rose-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#7A1E3A]/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#7A1E3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h4 className="font-semibold text-rose-900 mb-1 sm:mb-2 text-sm sm:text-base">Fast Dispatch</h4>
              <p className="text-xs sm:text-sm text-rose-700 hidden sm:block">Orders dispatched within 24–48 hours nationwide.</p>
            </div>
            
            {/* Trust Signal 3 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center shadow-sm border border-rose-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#7A1E3A]/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#7A1E3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h4 className="font-semibold text-rose-900 mb-1 sm:mb-2 text-sm sm:text-base">Salon Tested</h4>
              <p className="text-xs sm:text-sm text-rose-700 hidden sm:block">Products trusted by beauticians and salons across Pakistan.</p>
            </div>
            
            {/* Trust Signal 4 */}
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4 sm:p-6 text-center shadow-sm border border-rose-100">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#7A1E3A]/10 rounded-full flex items-center justify-center mx-auto mb-2 sm:mb-4">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[#7A1E3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <h4 className="font-semibold text-rose-900 mb-1 sm:mb-2 text-sm sm:text-base">Easy Returns</h4>
              <p className="text-xs sm:text-sm text-rose-700 hidden sm:block">7-day return policy for defective products.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Professional Urdu trust block - Hidden on mobile */}
      <div className="hidden sm:block relative py-20 overflow-hidden bg-[#FFF7F3]">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(244,114,182,0.09) 1px, transparent 0)', backgroundSize: '42px 42px' }} />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-3xl mx-auto">
            <div className="relative p-8 sm:p-10 rounded-2xl bg-white shadow-sm space-y-5 border border-[#F3E0E7]">
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-[#7A1E3A] rounded-full flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div className="text-center pt-4">
                <p className="text-base sm:text-lg text-rose-700 font-urdu" dir="rtl">
                  پاکستان بھر میں پروفیشنل بیوٹی سپلائز
                </p>
              </div>
              <p className="text-base sm:text-lg text-[#2B2B2B] leading-relaxed font-urdu text-right space-y-1" dir="rtl">
                <span className="block">سیلونز، اکیڈمیز اور بیوٹی پروفیشنلز کے لیے منتخب کردہ پروڈکٹس — معیار، اعتماد اور کیش آن ڈیلیوری کے ساتھ۔</span>
                <span className="block">پاکستان کے بڑے شہروں میں تیز ڈلیوری اور آسان آرڈرنگ۔</span>
              </p>
              <div className="pt-4 border-t border-rose-100/70">
                <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm text-rose-700 font-urdu" dir="rtl">
                  <li className="flex items-center gap-2 justify-end">
                    <span>کیش آن ڈیلیوری</span>
                    <span className="w-2 h-2 rounded-full bg-[#7A1E3A]" />
                  </li>
                  <li className="flex items-center gap-2 justify-end">
                    <span>پروفیشنلز کی پسند</span>
                    <span className="w-2 h-2 rounded-full bg-[#7A1E3A]" />
                  </li>
                  <li className="flex items-center gap-2 justify-end">
                    <span>پاکستان بھر میں ڈلیوری</span>
                    <span className="w-2 h-2 rounded-full bg-[#7A1E3A]" />
                  </li>
                </ul>
              </div>
              {/* Q8: Attribution footer */}
              <p className="text-xs text-center text-[#7A7A7A] pt-4 font-urdu" dir="rtl">
                — Aesthetic PK، پاکستان بھر کے سیلونز کا اعتماد
              </p>
            </div>
          </div>
        </div>
      </div>
      {/* Featured product block - Hidden on mobile */}
      {activeProduct && (
        <div id="featured-product" className="hidden sm:block py-16 bg-white border-t border-[#EFD6DE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-8 items-center">
            <div className="space-y-3">
              <p className="text-xs font-semibold tracking-wide text-[#7A1E3A] uppercase">Featured product</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-[#2B2B2B]">{activeProduct.name}</h3>
              <p className="text-sm text-[#7A7A7A] max-w-md">
                A salon-grade treatment selected for real results. Ideal for professionals and beauty lovers who want
                consistent performance in everyday routines.
              </p>
              <ul className="text-sm text-[#2B2B2B] space-y-1 list-disc pl-5">
                <li>Formulated to perform in Pakistani climate and routines.</li>
                <li>Trusted by salons and beauticians for repeat clients.</li>
                <li>Available with Cash on Delivery across major cities.</li>
              </ul>
              <div className="flex items-center gap-4 pt-2">
                <div>
                  <span className="text-lg font-semibold text-[#7A1E3A]">
                    {activeProduct.fromPrice != null ? `From PKR ${Number(activeProduct.fromPrice).toLocaleString()}` : 'PKR —'}
                  </span>
                  {/* Q10: Add micro-copy under price */}
                  <p className="text-xs text-[#7A7A7A] mt-0.5">Cash on Delivery | 24–48h Dispatch</p>
                </div>
                <Link
                  href={`/lp/${activeProduct.slug}`}
                  className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-[#7A1E3A] text-white text-sm font-medium hover:bg-[#5A1226]"
                >
                  {/* Q9: CTA text - "Order Now" when cart dormant */}
                  Order Now
                </Link>
              </div>
            </div>
            <div className="rounded-2xl overflow-hidden bg-[#FFF7F2] border border-[#EFD6DE]">
              <div className="aspect-[4/3] w-full bg-white grid place-items-center overflow-hidden">
                {activeProduct.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={activeProduct.image} alt={activeProduct.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-rose-200 text-sm">Image coming soon</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid (Best sellers) */}
      {Array.isArray(products) && products.length > 1 && (
        <div className="py-16 bg-[#FFF7F3] border-t border-[#F3E0E7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-2xl font-bold text-[#2B2B2B]">Best Sellers</h3>
                <p className="text-sm text-[#7A7A7A]">Top picks chosen by professionals and repeat customers.</p>
              </div>
              <a href="/products" className="text-[#7A1E3A] hover:text-[#5A1226] text-sm font-medium">Shop all products</a>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Testimonials */}
      <div className="py-16 bg-[#FFF1EC] border-t border-[#F3E0E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h3 className="text-2xl sm:text-3xl font-bold text-[#2B2B2B]">Trusted by Salons Across Pakistan</h3>
            <p className="mt-2 text-sm sm:text-base text-[#7A7A7A]">
              Feedback from real salons, beauticians and customers using Aesthetic PK in everyday routines.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl bg-white p-6 shadow-sm border border-[#F3E0E7] flex flex-col justify-between">
              <p className="text-sm text-[#2B2B2B]">
                “Reliable stock and consistent quality. Exactly what we need for clients.”
              </p>
              <p className="mt-4 text-xs font-medium text-[#7A7A7A]">Salon Owner, Lahore</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm border border-[#F3E0E7] flex flex-col justify-between">
              <p className="text-sm text-[#2B2B2B]">
                “Fast delivery and easy ordering. The products perform well in real routines.”
              </p>
              <p className="mt-4 text-xs font-medium text-[#7A7A7A]">Beautician, Karachi</p>
            </div>
            <div className="rounded-xl bg-white p-6 shadow-sm border border-[#F3E0E7] flex flex-col justify-between">
              <p className="text-sm text-[#2B2B2B]">
                “Professional-grade feel, good packaging, and simple routine instructions.”
              </p>
              <p className="mt-4 text-xs font-medium text-[#7A7A7A]">Customer, Islamabad</p>
            </div>
          </div>
        </div>
      </div>

      {/* Final CTA - Q12: Conditional based on product count */}
      <div className="py-16 bg-white border-t border-[#F3E0E7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <h3 className="text-2xl sm:text-3xl font-bold text-[#2B2B2B]">Professional Beauty Starts Here</h3>
          <p className="text-sm sm:text-base text-[#7A7A7A] max-w-2xl mx-auto">
            Shop salon-grade products that fit real routines — for salons, beauty professionals, and everyday customers
            across Pakistan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {/* Q12: If 1 product → Primary CTA = "Order [Product Name]", else "Shop All Products" */}
            {activeProductCount === 1 && featuredProduct ? (
              <Link
                href={`/lp/${featuredProduct.slug}`}
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[#7A1E3A] text-white text-sm font-medium hover:bg-[#5A1226] w-full sm:w-auto"
              >
                Order {featuredProduct.name}
              </Link>
            ) : (
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-[#7A1E3A] text-white text-sm font-medium hover:bg-[#5A1226] w-full sm:w-auto"
              >
                Shop All Products
              </Link>
            )}
            {activeProductCount > 1 && (
              <Link
                href="/products"
                className="inline-flex items-center justify-center px-8 py-3 rounded-lg border border-[#7A1E3A] text-[#7A1E3A] bg-white hover:bg-[#FFF1EC] text-sm font-medium w-full sm:w-auto"
              >
                View all products
              </Link>
            )}
          </div>
          {/* B2B link for salon owners */}
          <p className="text-xs text-gray-500 pt-4">
            Salon owner?{' '}
            <Link href="/parlours" className="text-[#7A1E3A] hover:underline font-medium">
              Apply for wholesale access
            </Link>
          </p>
        </div>
      </div>

      {/* How It Works Modal */}
      {showHowItWorks && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowHowItWorks(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl p-6 max-w-md mx-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#7A1E3A]">How It Works</h3>
              <button onClick={() => setShowHowItWorks(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7A1E3A] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                <div>
                  <p className="font-medium text-[#2B2B2B]">Order in 2 minutes</p>
                  <p className="text-sm text-gray-600">Select your product, choose options, and place your order.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7A1E3A] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                <div>
                  <p className="font-medium text-[#2B2B2B]">Cash on Delivery</p>
                  <p className="text-sm text-gray-600">No advance payment needed. Pay when you receive.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7A1E3A] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                <div>
                  <p className="font-medium text-[#2B2B2B]">Dispatch in 24–48 hours</p>
                  <p className="text-sm text-gray-600">Fast processing and nationwide delivery.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#7A1E3A] text-white flex items-center justify-center text-sm font-bold flex-shrink-0">4</div>
                <div>
                  <p className="font-medium text-[#2B2B2B]">Pay when you receive</p>
                  <p className="text-sm text-gray-600">Inspect your order and pay the courier on delivery.</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setShowHowItWorks(false)}
              className="w-full mt-6 py-3 bg-[#7A1E3A] text-white rounded-lg font-medium hover:bg-[#5A1226]"
            >
              Got it
            </button>
          </div>
        </>
      )}

      {/* Why Aesthetic PK Modal */}
      {showWhyUs && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowWhyUs(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl p-6 max-w-md mx-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#7A1E3A]">Why Aesthetic PK</h3>
              <button onClick={() => setShowWhyUs(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
                <span className="text-[#7A1E3A]">✔</span>
                <p className="text-sm text-[#2B2B2B]"><strong>Salon Tested</strong> — Products trusted by beauticians and salons across Pakistan</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
                <span className="text-[#7A1E3A]">✔</span>
                <p className="text-sm text-[#2B2B2B]"><strong>COD Nationwide</strong> — Cash on Delivery available across all major cities</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
                <span className="text-[#7A1E3A]">✔</span>
                <p className="text-sm text-[#2B2B2B]"><strong>Professional-Grade</strong> — Carefully sourced for real results</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
                <span className="text-[#7A1E3A]">✔</span>
                <p className="text-sm text-[#2B2B2B]"><strong>Built for Pakistan</strong> — Formulated for local climate and routines</p>
              </div>
            </div>
            <button 
              onClick={() => setShowWhyUs(false)}
              className="w-full mt-6 py-3 bg-[#7A1E3A] text-white rounded-lg font-medium hover:bg-[#5A1226]"
            >
              Got it
            </button>
          </div>
        </>
      )}

      {/* Return Policy Modal */}
      {showReturnPolicy && (
        <>
          <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setShowReturnPolicy(false)} />
          <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 bg-white rounded-2xl p-6 max-w-md mx-auto shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-[#7A1E3A]">Return Policy</h3>
              <button onClick={() => setShowReturnPolicy(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-rose-50 rounded-lg">
                <p className="font-medium text-[#7A1E3A] mb-2">7-Day Return Policy</p>
                <p className="text-sm text-gray-700">Returns accepted for defective products within 7 days of receiving, with original packaging intact.</p>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <p className="flex items-start gap-2">
                  <span className="text-[#7A1E3A]">•</span>
                  <span>Inspect your order upon delivery</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#7A1E3A]">•</span>
                  <span>Contact us via WhatsApp for return requests</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-[#7A1E3A]">•</span>
                  <span>Refunds processed within 14 days via Easypaisa</span>
                </p>
              </div>
              <Link 
                href="/return-policy"
                onClick={() => setShowReturnPolicy(false)}
                className="block text-center text-sm text-[#7A1E3A] underline"
              >
                View full policy
              </Link>
            </div>
            <button 
              onClick={() => setShowReturnPolicy(false)}
              className="w-full mt-4 py-3 bg-[#7A1E3A] text-white rounded-lg font-medium hover:bg-[#5A1226]"
            >
              Got it
            </button>
          </div>
        </>
      )}
    </div>
  );
}
