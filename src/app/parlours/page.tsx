'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ParloursLandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [whyParloursOpen, setWhyParloursOpen] = useState(true);
  const [paymentPolicyOpen, setPaymentPolicyOpen] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [whoCanApplyExpanded, setWhoCanApplyExpanded] = useState(false);

  // Show sticky bar after scrolling past hero
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = 400; // Approximate hero height
      const footerOffset = document.body.scrollHeight - window.innerHeight - 300;
      setShowStickyBar(scrollY > heroHeight && scrollY < footerOffset);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#FFF7F3]">
      {/* Header */}
      <header className="bg-white border-b border-rose-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Hamburger menu button - mobile only */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="sm:hidden p-2 -ml-2 text-[#7A1E3A] hover:bg-rose-50 rounded-lg cursor-pointer"
            aria-label="Open menu"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <Link href="/" className="text-[#7A1E3A] font-bold text-lg">
            Aesthetic PK
          </Link>
          {/* Parlour Login - hidden on mobile, shown on desktop */}
          <Link href="/p/login" className="hidden sm:block text-sm text-[#7A1E3A] font-medium hover:underline">
            Parlour Login
          </Link>
          {/* Empty spacer for mobile to balance hamburger */}
          <div className="w-10 sm:hidden" />
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/40 z-[60] sm:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white z-[60] shadow-xl sm:hidden">
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
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Home
              </Link>
              <Link 
                href="/p/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                  <circle cx="8.5" cy="7" r="4"></circle>
                  <line x1="20" y1="8" x2="20" y2="14"></line>
                  <line x1="23" y1="11" x2="17" y2="11"></line>
                </svg>
                Apply for Wholesale Account
              </Link>
              <a 
                href="#how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                How It Works
              </a>
              <a 
                href="#payment-policy"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Payment Policy
              </a>
              <Link 
                href="/p/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg text-[#2B2B2B] hover:bg-rose-50 hover:text-[#7A1E3A] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path>
                  <polyline points="10 17 15 12 10 7"></polyline>
                  <line x1="15" y1="12" x2="3" y2="12"></line>
                </svg>
                Parlour Login
              </Link>
            </nav>
            {/* Trust footer line */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-rose-50/50">
              <p className="text-xs text-center text-gray-600">🇵🇰 Wholesale for Professional Salons</p>
            </div>
          </div>
        </>
      )}

      {/* Hero Section - Sharp & Decisive */}
      <section className="bg-gradient-to-br from-[#7A1E3A] to-[#5A1226] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 sm:py-20 text-center">
          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold mb-3">
            Wholesale Beauty for Registered Parlours
          </h1>
          <p className="text-base sm:text-lg text-rose-100 mb-6">
            Bulk pricing • Advance payment • Approval-based access
          </p>
          <Link
            href="/p/signup"
            className="inline-block bg-white text-[#7A1E3A] font-semibold px-8 py-4 rounded-lg text-lg hover:bg-rose-50 transition-colors shadow-lg"
          >
            Apply for Parlour Account
          </Link>
          <p className="mt-3 text-xs sm:text-sm text-rose-200">
            Approval required · Advance payment only · Not for retail customers
          </p>
        </div>
      </section>

      {/* Who This Is For - Compressed on mobile */}
      <section className="py-10 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-xl sm:text-3xl font-bold text-center text-[#2B2B2B] mb-6">
            Who Can Apply?
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {/* Always visible */}
            <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
              <span className="text-[#7A1E3A] text-lg">✔</span>
              <span className="text-[#2B2B2B] font-medium text-sm">Registered beauty parlours</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
              <span className="text-[#7A1E3A] text-lg">✔</span>
              <span className="text-[#2B2B2B] font-medium text-sm">Salon owners & managers</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-rose-50 rounded-lg">
              <span className="text-[#7A1E3A] text-lg">✔</span>
              <span className="text-[#2B2B2B] font-medium text-sm">Beauty academies & training institutes</span>
            </div>
            {/* Hidden on mobile by default */}
            <div className={`flex items-center gap-3 p-3 bg-rose-50 rounded-lg ${whoCanApplyExpanded ? 'block' : 'hidden sm:flex'}`}>
              <span className="text-[#7A1E3A] text-lg">✔</span>
              <span className="text-[#2B2B2B] font-medium text-sm">Professionals ordering in bulk</span>
            </div>
          </div>
          {/* Show more button - mobile only */}
          {!whoCanApplyExpanded && (
            <button 
              onClick={() => setWhoCanApplyExpanded(true)}
              className="sm:hidden block mx-auto mt-3 text-xs text-[#7A1E3A] font-medium"
            >
              Show more ↓
            </button>
          )}
          <p className="text-center text-gray-500 text-xs sm:text-sm mt-4">
            This portal is not for individual retail customers.
          </p>
        </div>
      </section>

      {/* Why Parlours Choose Aesthetic PK - Accordion on mobile */}
      <section id="why-parlours" className="py-12 sm:py-16 bg-[#FFF7F3]">
        <div className="max-w-4xl mx-auto px-4">
          {/* Mobile: Accordion header */}
          <button 
            onClick={() => setWhyParloursOpen(!whyParloursOpen)}
            className="sm:hidden w-full flex items-center justify-between p-4 bg-white rounded-xl border border-rose-100 shadow-sm mb-4"
          >
            <h2 className="text-lg font-bold text-[#2B2B2B]">Why Parlours Work With Aesthetic PK</h2>
            <svg 
              className={`w-5 h-5 text-[#7A1E3A] transition-transform ${whyParloursOpen ? 'rotate-180' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Desktop: Normal heading */}
          <h2 className="hidden sm:block text-2xl sm:text-3xl font-bold text-center text-[#2B2B2B] mb-10">
            Why Parlours Work With Aesthetic PK
          </h2>
          {/* Content - collapsible on mobile */}
          <div className={`${whyParloursOpen ? 'block' : 'hidden'} sm:block`}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100">
              <div className="w-12 h-12 bg-[#7A1E3A]/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#7A1E3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2">Wholesale Pricing</h3>
              <p className="text-sm text-gray-600">Special bulk pricing on all orders for approved parlours.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100">
              <div className="w-12 h-12 bg-[#7A1E3A]/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#7A1E3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2">Advance Payment</h3>
              <p className="text-sm text-gray-600">Professional ordering with advance payment — no COD delays.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100">
              <div className="w-12 h-12 bg-[#7A1E3A]/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#7A1E3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2">Consistent Stock</h3>
              <p className="text-sm text-gray-600">Reliable availability for your salon routines.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100">
              <div className="w-12 h-12 bg-[#7A1E3A]/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#7A1E3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2">Priority Handling</h3>
              <p className="text-sm text-gray-600">Professional accounts get priority dispatch and support.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100">
              <div className="w-12 h-12 bg-[#7A1E3A]/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#7A1E3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2">Salon Tested</h3>
              <p className="text-sm text-gray-600">Products tested in real salon environments across Pakistan.</p>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-rose-100">
              <div className="w-12 h-12 bg-[#7A1E3A]/10 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-[#7A1E3A]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2">Dedicated Support</h3>
              <p className="text-sm text-gray-600">Team support after approval for order assistance.</p>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-12 sm:py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-center text-[#2B2B2B] mb-10">
            How It Works
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-14 h-14 bg-[#7A1E3A] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2">Apply for Account</h3>
              <p className="text-sm text-gray-600">Fill out a short registration form with your salon details.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-[#7A1E3A] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2">Manual Review</h3>
              <p className="text-sm text-gray-600">We verify your business and approve eligible parlours.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-[#7A1E3A] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2">Get Approved</h3>
              <p className="text-sm text-gray-600">You'll receive an email once your account is approved.</p>
            </div>

            <div className="text-center">
              <div className="w-14 h-14 bg-[#7A1E3A] text-white rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                4
              </div>
              <h3 className="font-semibold text-[#2B2B2B] mb-2">Place Orders</h3>
              <p className="text-sm text-gray-600">Log in, view wholesale pricing, and place bulk orders.</p>
            </div>
          </div>
          <p className="text-center text-gray-500 text-sm mt-6">
            Most approvals are completed within 1–2 business days.
          </p>
        </div>
      </section>

      {/* Wholesale Payment & Dispatch Policy - Accordion on mobile */}
      <section id="payment-policy" className="py-12 sm:py-16 bg-[#FFF7F3]">
        <div className="max-w-3xl mx-auto px-4">
          {/* Mobile: Accordion header */}
          <button 
            onClick={() => setPaymentPolicyOpen(!paymentPolicyOpen)}
            className="sm:hidden w-full flex items-center justify-between p-4 bg-white rounded-xl border border-rose-100 shadow-sm mb-4"
          >
            <h2 className="text-lg font-bold text-[#2B2B2B]">Wholesale Payment & Dispatch Policy</h2>
            <svg 
              className={`w-5 h-5 text-[#7A1E3A] transition-transform ${paymentPolicyOpen ? 'rotate-180' : ''}`} 
              fill="none" viewBox="0 0 24 24" stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {/* Desktop: Normal heading */}
          <h2 className="hidden sm:block text-2xl sm:text-3xl font-bold text-center text-[#2B2B2B] mb-8">
            Wholesale Payment & Dispatch Policy
          </h2>
          {/* Content - collapsible on mobile */}
          <div className={`${paymentPolicyOpen ? 'block' : 'hidden'} sm:block`}>
            <div className="bg-white rounded-xl p-6 sm:p-8 shadow-sm border border-rose-100">
              <p className="text-sm text-gray-600 mb-4 text-center">
                Designed for serious, recurring professional orders.
              </p>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-[#7A1E3A] mt-0.5">•</span>
                  <p className="text-[#2B2B2B]">All parlour orders require <strong>advance payment</strong></p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#7A1E3A] mt-0.5">•</span>
                  <p className="text-[#2B2B2B]">Payment instructions are provided after order placement</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#7A1E3A] mt-0.5">•</span>
                  <p className="text-[#2B2B2B]">Orders are dispatched after payment confirmation</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-[#7A1E3A] mt-0.5">•</span>
                  <p className="text-[#2B2B2B]">Designed for bulk and recurring professional orders</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Retail vs Parlour Comparison */}
      <section className="py-10 sm:py-12 bg-white">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-lg sm:text-2xl font-bold text-center text-[#2B2B2B] mb-6">
            Retail vs Parlour Access
          </h2>
          <div className="overflow-hidden rounded-xl border border-rose-100">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-rose-50">
                  <th className="py-3 px-4 text-left font-semibold text-[#2B2B2B]">Feature</th>
                  <th className="py-3 px-4 text-center font-semibold text-gray-500">Retail</th>
                  <th className="py-3 px-4 text-center font-semibold text-[#7A1E3A]">Parlour</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100">
                <tr>
                  <td className="py-3 px-4 text-[#2B2B2B]">Payment</td>
                  <td className="py-3 px-4 text-center text-gray-500">COD</td>
                  <td className="py-3 px-4 text-center text-[#7A1E3A] font-medium">Advance</td>
                </tr>
                <tr className="bg-rose-50/30">
                  <td className="py-3 px-4 text-[#2B2B2B]">Pricing</td>
                  <td className="py-3 px-4 text-center text-gray-500">Single units</td>
                  <td className="py-3 px-4 text-center text-[#7A1E3A] font-medium">Bulk pricing</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 text-[#2B2B2B]">Access</td>
                  <td className="py-3 px-4 text-center text-gray-500">Public</td>
                  <td className="py-3 px-4 text-center text-[#7A1E3A] font-medium">Approval required</td>
                </tr>
                <tr className="bg-rose-50/30">
                  <td className="py-3 px-4 text-[#2B2B2B]">Portal</td>
                  <td className="py-3 px-4 text-center text-gray-500">Public site</td>
                  <td className="py-3 px-4 text-center text-[#7A1E3A] font-medium">Private portal</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Final CTA - Mirrors top CTA exactly */}
      <section className="py-12 sm:py-16 bg-gradient-to-br from-[#7A1E3A] to-[#5A1226] text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">
            Ready to Get Started?
          </h2>
          <Link
            href="/p/signup"
            className="inline-block bg-white text-[#7A1E3A] font-semibold px-8 py-4 rounded-lg text-lg hover:bg-rose-50 transition-colors shadow-lg"
          >
            Apply for Parlour Account
          </Link>
          <p className="mt-3 text-xs sm:text-sm text-rose-200">
            Approval required · Advance payment only · Not for retail customers
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 pb-24 sm:pb-8 bg-white border-t border-rose-100">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/p/login" className="text-[#7A1E3A] hover:underline font-medium">
              Sign in here
            </Link>
          </p>
          <p className="text-xs text-gray-400 mt-4">
            © {new Date().getFullYear()} Aesthetic PK. All rights reserved.
          </p>
        </div>
      </footer>

      {/* Sticky Bottom CTA Bar - Mobile only */}
      {showStickyBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-rose-200 shadow-lg z-50 sm:hidden">
          <div className="px-4 py-3">
            <p className="text-[10px] text-center text-gray-500 mb-2">
              Wholesale • Advance Payment • Approved Parlours
            </p>
            <Link
              href="/p/signup"
              className="block w-full text-center bg-[#7A1E3A] text-white font-semibold py-3 rounded-lg"
            >
              Apply for Wholesale Access
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
