//lib\context\CartContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CartItemConfig {
  id: string; // Unique configuration ID (supports duplicates)
  type: 'cloth' | 'variant' | 'clothPartialService' | 'variantPartialService';
  clothId: string;
  variantId?: string | null;
  clothPartialServiceId?: string | null;
  variantPartialServiceId?: string | null;
  name: string;
  basePriceNgn: number | null;
  isPriceNull: boolean;
  quantity: number;
  processingRuleId?: string;
  deliveryMode?: 'none' | 'pick' | 'return' | 'both';
  pickAddressId?: string;
  returnAddressId?: string;
}

interface CartContextProps {
  cart: CartItemConfig[];
  addToCart: (item: Omit<CartItemConfig, 'id'>) => void;
  updateCartItem: (id: string, updates: Partial<CartItemConfig>) => void;
  removeFromCart: (id: string) => void;
  duplicateCartItem: (id: string) => void;
  clearCart: () => void;
  currency: { id: string; code: string; multiplier: number };
  setCurrency: (curr: { id: string; code: string; multiplier: number }) => void;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItemConfig[]>([]);
  const [currency, setCurrencyState] = useState({ id: 'default', code: 'NGN', multiplier: 1.0 });

  useEffect(() => {
    const storedCart = localStorage.getItem('app_cart');
    const storedCurrency = localStorage.getItem('app_currency');
    if (storedCart) setCart(JSON.parse(storedCart));
    if (storedCurrency) setCurrencyState(JSON.parse(storedCurrency));
  }, []);

  const saveCart = (newCart: CartItemConfig[]) => {
    setCart(newCart);
    localStorage.setItem('app_cart', JSON.stringify(newCart));
  };

  const addToCart = (item: Omit<CartItemConfig, 'id'>) => {
    const newItem: CartItemConfig = { ...item, id: crypto.randomUUID() };
    saveCart([...cart, newItem]);
  };

  const updateCartItem = (id: string, updates: Partial<CartItemConfig>) => {
    saveCart(cart.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const removeFromCart = (id: string) => {
    saveCart(cart.filter(item => item.id !== id));
  };

  const duplicateCartItem = (id: string) => {
    const target = cart.find(i => i.id === id);
    if (target) {
      const duplicated: CartItemConfig = { ...target, id: crypto.randomUUID() };
      saveCart([...cart, duplicated]);
    }
  };

  const clearCart = () => saveCart([]);

  const setCurrency = (curr: { id: string; code: string; multiplier: number }) => {
    setCurrencyState(curr);
    localStorage.setItem('app_currency', JSON.stringify(curr));
  };

  return (
    <CartContext.Provider value={{ cart, addToCart, updateCartItem, removeFromCart, duplicateCartItem, clearCart, currency, setCurrency }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}