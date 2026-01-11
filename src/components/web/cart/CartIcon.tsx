'use client';

import React from 'react';
import { useCart } from '@/contexts/CartContext';

type CartIconProps = {
  className?: string;
  showWhenEmpty?: boolean;
};

export default function CartIcon({ className = '', showWhenEmpty = false }: CartIconProps) {
  const { itemCount, openCart } = useCart();

  // Hide if cart is empty and showWhenEmpty is false
  if (itemCount === 0 && !showWhenEmpty) {
    return null;
  }

  return (
    <button
      onClick={openCart}
      className={`relative p-2 hover:bg-gray-100 rounded-full transition-colors ${className}`}
      aria-label={`Cart with ${itemCount} items`}
    >
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <circle cx="9" cy="21" r="1"></circle>
        <circle cx="20" cy="21" r="1"></circle>
        <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
      </svg>
      
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-black text-white text-xs font-medium rounded-full w-5 h-5 flex items-center justify-center">
          {itemCount > 9 ? '9+' : itemCount}
        </span>
      )}
    </button>
  );
}
