// components/customer/navbar.tsx
'use client';

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { ShoppingBasket, Sun, Moon, Coins, Menu, X, User, ChevronDown, LogOut } from "lucide-react";
import { useCart, CurrencyInfo } from "@/context/cart-context";
import { useSession, signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import CartDrawer from "./cart";

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { items, currency, setCurrency, stack, fetchStack, stackLoading } = useCart();
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // Restore persisted currency when stack becomes available
  useEffect(() => {
    setMounted(true);
    const persistedCurrency = localStorage.getItem("tt_selected_currency");
    if (persistedCurrency && stack?.currencies) {
      try {
        const parsed = JSON.parse(persistedCurrency) as CurrencyInfo;
        const matched = stack.currencies.find((c) => c.id === parsed.id);
        if (matched) setCurrency(matched);
      } catch (e) {
        console.error("Error restoring currency configuration", e);
      }
    }
  }, [stack, setCurrency]);

  useEffect(() => {
    if (stack?.currencies && !currency) {
      const fallback = stack.currencies.find((c) => c.multiplier === 1.0) || stack.currencies[0];
      if (fallback) setCurrency(fallback);
    }
  }, [stack, currency, setCurrency]);

  const handleCurrencyChange = (curr: CurrencyInfo) => {
    setCurrency(curr);
    localStorage.setItem("tt_selected_currency", JSON.stringify(curr));
    setCurrencyDropdownOpen(false);
  };

  const handleOpenCart = () => {
    if (!stack && !stackLoading) {
      fetchStack();
    }
    setCartDrawerOpen(true);
  };

  const handleCurrencyToggle = () => {
    if (!stack && !stackLoading) {
      fetchStack();
    }
    setCurrencyDropdownOpen(!currencyDropdownOpen);
  };

  const totalCartQuantity = items.reduce((acc, currentItem) => acc + currentItem.quantity, 0);

  if (!mounted) return <div className="h-20 w-full bg-canvas-light dark:bg-canvas-dark border-b border-navy-deep/5 dark:border-white/5" />;

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-20 z-50 border-b border-navy-deep/10 dark:border-white/5 bg-white/70 dark:bg-canvas-dark/70 backdrop-blur-md transition-all duration-300">
        <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-xl font-black uppercase tracking-widest bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent group-hover:opacity-80 transition-opacity">
              TT Laundry
            </span>
          </Link>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-6">
            {/* Services */}
            <Link
              href="/service"
              className="text-sm font-semibold tracking-wide hover:text-gold-polished dark:hover:text-gold-metallic transition-colors"
            >
              Services Catalog
            </Link>

            {/* Orders */}
            <Link
              href="/order"
              className="text-sm font-semibold tracking-wide hover:text-gold-polished dark:hover:text-gold-metallic transition-colors"
            >
              Orders
            </Link>

            {/* Currency Dropdown */}
            <div className="relative">
              <button
                onClick={handleCurrencyToggle}
                className="px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider border border-navy-deep/10 dark:border-white/10 flex items-center gap-2 liquid-glass-light dark:liquid-glass-dark hover:bg-gold-metallic/5 transition-all"
              >
                <Coins className="w-3.5 h-3.5 text-gold-polished dark:text-gold-metallic" />
                {currency ? currency.code : "Currency"}
              </button>

              <AnimatePresence>
                {currencyDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white dark:bg-canvas-dark shadow-2xl p-1 overflow-hidden"
                  >
                    {stack?.currencies?.map((curr) => (
                      <button
                        key={curr.id}
                        onClick={() => handleCurrencyChange(curr)}
                        className={`w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${
                          currency?.id === curr.id
                            ? "bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark"
                            : "hover:bg-navy-deep/5 dark:hover:bg-white/5 text-slate-blue dark:text-platinum"
                        }`}
                      >
                        {curr.code}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-slate-blue dark:text-platinum hover:text-gold-polished dark:hover:text-gold-metallic transition-all"
              aria-label="Toggle Theme Mode"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Cart */}
            <button
              onClick={handleOpenCart}
              className="relative p-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-slate-blue dark:text-platinum hover:text-gold-polished dark:hover:text-gold-metallic transition-all bg-transparent cursor-pointer"
            >
              <ShoppingBasket className="w-4 h-4" />
              {totalCartQuantity > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-[10px] font-black flex items-center justify-center shadow-md animate-pulse">
                  {totalCartQuantity}
                </span>
              )}
            </button>

            {/* Profile / Sign In */}
            {session ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-navy-deep/10 dark:border-white/10 hover:bg-gold-metallic/5 transition-all"
                >
                  <div className="w-7 h-7 rounded-full bg-gold-polished/20 dark:bg-gold-metallic/20 flex items-center justify-center text-xs font-bold text-gold-polished dark:text-gold-metallic">
                    {initials}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-blue dark:text-platinum" />
                </button>

                <AnimatePresence>
                  {profileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-44 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white dark:bg-canvas-dark shadow-2xl p-1"
                    >
                      <Link
                        href="/profile"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-navy-deep/5 dark:hover:bg-white/5 text-slate-blue dark:text-platinum transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                      <button
                        onClick={() => {
                          setProfileOpen(false);
                          signOut({ callbackUrl: "/" });
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wide hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/auth/signin"
                className="text-sm font-semibold tracking-wide hover:text-gold-polished dark:hover:text-gold-metallic transition-colors flex items-center gap-1.5"
              >
                <User className="w-4 h-4" />
                Sign In
              </Link>
            )}
          </div>

          {/* Handheld Device Toggles */}
          <div className="flex md:hidden items-center gap-3">
            <button
              onClick={handleOpenCart}
              className="relative p-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-slate-blue dark:text-platinum"
            >
              <ShoppingBasket className="w-4 h-4" />
              {totalCartQuantity > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-[10px] font-black flex items-center justify-center shadow-md">
                  {totalCartQuantity}
                </span>
              )}
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-slate-blue dark:text-platinum"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white dark:bg-canvas-dark border-t border-navy-deep/10 dark:border-white/5 px-4 py-4 space-y-3"
            >
              <Link
                href="/service"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-blue dark:text-platinum"
              >
                Services Catalog
              </Link>
              <Link
                href="/order"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-sm font-semibold text-slate-blue dark:text-platinum"
              >
                Orders
              </Link>

              {/* Currency in mobile – simple list */}
              <div className="border-t border-navy-deep/10 dark:border-white/5 pt-2">
                <p className="text-xs font-bold uppercase tracking-wider text-navy-deep/40 dark:text-white/40 mb-1">
                  Currency
                </p>
                {stack?.currencies?.map((curr) => (
                  <button
                    key={curr.id}
                    onClick={() => {
                      handleCurrencyChange(curr);
                      setMobileMenuOpen(false);
                    }}
                    className={`block w-full text-left py-1.5 text-sm ${
                      currency?.id === curr.id
                        ? "text-gold-polished dark:text-gold-metallic font-bold"
                        : "text-slate-blue dark:text-platinum"
                    }`}
                  >
                    {curr.code}
                  </button>
                ))}
              </div>

              {/* Theme toggle */}
              <button
                onClick={() => {
                  setTheme(theme === "dark" ? "light" : "dark");
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full text-sm font-semibold text-slate-blue dark:text-platinum"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark" ? "Light Mode" : "Dark Mode"}
              </button>

              {/* Profile / Sign In for mobile */}
              <div className="border-t border-navy-deep/10 dark:border-white/5 pt-2">
                {session ? (
                  <>
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block text-sm font-semibold text-slate-blue dark:text-platinum py-1"
                    >
                      Profile
                    </Link>
                    <button
                      onClick={() => {
                        signOut({ callbackUrl: "/" });
                        setMobileMenuOpen(false);
                      }}
                      className="block w-full text-left text-sm font-semibold text-red-600 dark:text-red-400 py-1"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block text-sm font-semibold text-slate-blue dark:text-platinum py-1"
                  >
                    Sign In
                  </Link>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Cart Side-out Drawer */}
      <CartDrawer isOpen={cartDrawerOpen} onClose={() => setCartDrawerOpen(false)} />
    </>
  );
}