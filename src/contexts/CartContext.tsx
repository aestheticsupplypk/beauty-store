'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

// Cart item type
export type CartItem = {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  variantLabel: string; // e.g., "Red / Large"
  price: number;
  quantity: number;
  thumbUrl?: string;
};

// Attribution data stored with cart
export type CartAttribution = {
  refCode?: string;
  refCodeLocked?: boolean; // true if first-touch, cannot be overridden
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingProductSlug?: string;
  firstTouchTs?: number;
};

type CartContextType = {
  items: CartItem[];
  attribution: CartAttribution;
  isOpen: boolean;
  itemCount: number;
  subtotal: number;
  
  // Actions
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  
  // Attribution
  setAttribution: (attr: Partial<CartAttribution>) => void;
  lockRefCode: (code: string) => void;
};

const CartContext = createContext<CartContextType | null>(null);

const CART_STORAGE_KEY = 'aestheticpk_cart';
const ATTRIBUTION_STORAGE_KEY = 'aestheticpk_attribution';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [attribution, setAttributionState] = useState<CartAttribution>({});
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const storedCart = localStorage.getItem(CART_STORAGE_KEY);
      if (storedCart) {
        setItems(JSON.parse(storedCart));
      }
      const storedAttr = localStorage.getItem(ATTRIBUTION_STORAGE_KEY);
      if (storedAttr) {
        setAttributionState(JSON.parse(storedAttr));
      }
    } catch (e) {
      console.error('Failed to load cart from storage:', e);
    }
    setHydrated(true);
  }, []);

  // Persist to localStorage on change
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error('Failed to save cart to storage:', e);
    }
  }, [items, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(ATTRIBUTION_STORAGE_KEY, JSON.stringify(attribution));
    } catch (e) {
      console.error('Failed to save attribution to storage:', e);
    }
  }, [attribution, hydrated]);

  // Computed values
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Actions
  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    const qty = newItem.quantity || 1;
    setItems(prev => {
      const existing = prev.find(i => i.variantId === newItem.variantId);
      if (existing) {
        return prev.map(i => 
          i.variantId === newItem.variantId 
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [...prev, { ...newItem, quantity: qty }];
    });
    setIsOpen(true); // Open cart drawer when adding item
  }, []);

  const updateQuantity = useCallback((variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => i.variantId !== variantId));
    } else {
      setItems(prev => prev.map(i => 
        i.variantId === variantId ? { ...i, quantity } : i
      ));
    }
  }, []);

  const removeItem = useCallback((variantId: string) => {
    setItems(prev => prev.filter(i => i.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setAttributionState({});
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen(prev => !prev), []);

  // Attribution management
  const setAttribution = useCallback((attr: Partial<CartAttribution>) => {
    setAttributionState(prev => {
      // Don't override locked ref code
      if (prev.refCodeLocked && attr.refCode && attr.refCode !== prev.refCode) {
        const { refCode, ...rest } = attr;
        return { ...prev, ...rest };
      }
      return { ...prev, ...attr };
    });
  }, []);

  const lockRefCode = useCallback((code: string) => {
    setAttributionState(prev => {
      // Only lock if not already locked
      if (prev.refCodeLocked) return prev;
      return {
        ...prev,
        refCode: code,
        refCodeLocked: true,
        firstTouchTs: prev.firstTouchTs || Date.now(),
      };
    });
  }, []);

  return (
    <CartContext.Provider value={{
      items,
      attribution,
      isOpen,
      itemCount,
      subtotal,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      setAttribution,
      lockRefCode,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
