// app/(customer)/layout.tsx
'use client';

import React from "react";
import Navbar from "@/components/customer/navbar";
import { CartProvider } from "@/context/cart-context"; // Import the provider

export default function CustomerShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="relative min-h-screen flex flex-col w-full overflow-x-hidden selection:bg-gold-metallic/30">
        {/* Universal Sticky Glass Header */}
        <Navbar />
        
        {/* Content wrapper */}
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
      </div>
    </CartProvider>
  );
}