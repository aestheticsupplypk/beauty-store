'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabaseBrowser';

type MobileNavProps = {
  affiliateName?: string;
  affiliateCity?: string;
  pageTitle?: string;
};

export default function MobileNav({ affiliateName, affiliateCity, pageTitle = 'Affiliate Dashboard' }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const pathname = usePathname();

  async function handleSignOut() {
    setSigningOut(true);
    await supabaseBrowser.auth.signOut();
    window.location.href = '/affiliate/dashboard';
  }

  const navItems = [
    { href: '/affiliate/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/affiliate/orders', label: 'View All Orders', icon: '📋' },
    { href: '/affiliate/settings', label: 'Account Settings', icon: '⚙️' },
  ];

  const externalLinks = [
    { href: '/affiliate/terms', label: 'Terms & Conditions', icon: '📄' },
    { href: 'https://wa.me/923001234567', label: 'Contact Support', icon: '💬', external: true },
  ];

  // Get initials for avatar
  const initials = affiliateName 
    ? affiliateName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AF';

  return (
    <>
      {/* Mobile App Bar - fixed header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Hamburger */}
          <button
            onClick={() => setIsOpen(true)}
            className="p-2 -ml-2 text-gray-700"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          {/* Title */}
          <h1 className="text-base font-semibold text-gray-900 truncate flex-1 text-center px-2">
            {pageTitle}
          </h1>
          
          {/* Spacer to balance hamburger */}
          <div className="w-10" />
        </div>
      </div>

      {/* Spacer to push content below fixed header */}
      <div className="md:hidden h-14" />

      {/* Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40 transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Slide-out Drawer - 80% width max */}
      <div
        className={`md:hidden fixed top-0 left-0 h-full w-[80%] max-w-[280px] bg-white z-50 transform transition-transform duration-300 ease-in-out shadow-xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Profile Header with Avatar */}
        <div className="p-4 border-b bg-gradient-to-r from-emerald-50 to-emerald-100">
          <div className="flex items-center gap-3">
            {/* Avatar Circle */}
            <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-semibold text-lg">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-semibold text-gray-900 truncate">{affiliateName || 'Affiliate'}</h2>
              {affiliateCity && (
                <p className="text-sm text-gray-600 truncate">{affiliateCity}</p>
              )}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-gray-500 hover:text-gray-700 -mr-2"
              aria-label="Close menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] transition-colors ${
                  isActive
                    ? 'bg-emerald-100 text-emerald-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span className="text-lg w-6 text-center">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Divider */}
        <div className="border-t mx-3 my-2" />

        {/* External Links */}
        <div className="px-3 space-y-1">
          {externalLinks.map((item) => (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <span className="text-lg w-6 text-center">{item.icon}</span>
              {item.label}
              <svg className="w-3.5 h-3.5 ml-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          ))}
        </div>

        {/* Sign Out Button - fixed at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t bg-gray-50">
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50 font-medium"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {signingOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </div>
    </>
  );
}
