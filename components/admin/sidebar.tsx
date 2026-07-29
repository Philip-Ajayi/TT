// components/admin/sidebar.tsx
'use client';

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";
import { X, LayoutDashboard, Package, MapPin, Shirt, PenTool, Coins, Truck, Clock, Tag, Shield, DollarSign, User, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSidebar({ isOpen, onClose }: SidebarProps) {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role; // 'admin' | 'superadmin'
  const isSuperAdmin = userRole === "superadmin";
  const pathname = usePathname();

  // Base links visible to all admins
  const baseLinks = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Orders", href: "/admin/orders", icon: Package },
  ];

  // Superadmin-only management links (grouped)
  const managementLinks = [
    { label: "Address Management", href: "/admin/address", icon: MapPin },
    { label: "Create Cloth", href: "/admin/cloth/new", icon: PenTool },
    { label: "Cloth Management", href: "/admin/cloth/edit", icon: Shirt },
    { label: "Currency Management", href: "/admin/currency", icon: Coins },
    { label: "Delivery Rules", href: "/admin/delivery", icon: Truck },
    { label: "Processing Time", href: "/admin/processing", icon: Clock },
    { label: "Discount Management", href: "/admin/discount", icon: Tag },
    { label: "Admin Management", href: "/admin/management", icon: Shield },
    { label: "Financials", href: "/admin/expenditure", icon: DollarSign },
  ];

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="h-full flex flex-col bg-white/80 dark:bg-canvas-dark/90 backdrop-blur-xl border-r border-navy-deep/10 dark:border-white/5">
      {/* Logo area */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-navy-deep/5 dark:border-white/5">
        <Link
          href="/admin"
          onClick={onClose}
          className="flex items-center gap-2 group"
        >
          <span className="text-xl font-black uppercase tracking-widest bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
            TT Laundry
          </span>
        </Link>
        {/* Close button (mobile) */}
        <button
          onClick={onClose}
          className="lg:hidden p-1 rounded-lg text-slate-blue dark:text-platinum hover:bg-navy-deep/5 dark:hover:bg-white/5"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Base links */}
        <ul className="space-y-1">
          {baseLinks.map((link) => {
            const Icon = link.icon;
            const active = isActive(link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    active
                      ? "bg-gold-polished/10 dark:bg-gold-metallic/10 text-gold-polished dark:text-gold-metallic"
                      : "text-slate-blue dark:text-platinum hover:bg-navy-deep/5 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Management section – superadmin only */}
        {isSuperAdmin && (
          <div>
            <p className="px-4 text-xs font-bold uppercase tracking-wider text-navy-deep/40 dark:text-white/40 mb-2">
              Management
            </p>
            <ul className="space-y-1">
              {managementLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                        active
                          ? "bg-gold-polished/10 dark:bg-gold-metallic/10 text-gold-polished dark:text-gold-metallic"
                          : "text-slate-blue dark:text-platinum hover:bg-navy-deep/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {link.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* Profile & Sign Out at bottom */}
      <div className="px-4 py-4 border-t border-navy-deep/5 dark:border-white/5 space-y-1">
        <Link
          href="/admin/profile"
          onClick={onClose}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-blue dark:text-platinum hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-all"
        >
          <User className="w-5 h-5" />
          Profile
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="flex w-full items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar (always visible, fixed) */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-72 lg:flex-col z-40">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            />

            {/* Sidebar panel */}
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed inset-y-0 left-0 z-40 w-72 lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}