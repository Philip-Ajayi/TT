"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { navigationItems } from "@/lib/navigation-config";
import { LogOut, Menu, X } from "lucide-react";

export function Sidebar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  if (status === "loading" || !session?.user) return null;

  const user = session.user as any;
  const userRole = user.role || "customer";
  const isAdminApproved = user.adminApproved;

  const filteredNavItems = navigationItems.filter((item) => {
    const roleMatches = item.roles.includes(userRole);
    if (item.requiresAdminApproval && userRole === "admin") {
      return roleMatches && isAdminApproved;
    }
    return roleMatches;
  });

  const fallbackLetter = user.name ? user.name.charAt(0).toUpperCase() : user.email?.charAt(0).toUpperCase() || "?";

  return (
    <>
      {/* BRAND LOGO OVERLAY & FLOATING MENU TRIGGER (Desktop Only) */}
      <div className="fixed top-6 left-6 z-50 hidden md:flex flex-col gap-3 pointer-events-auto">
        {/* Brand Text Header Overlay */}
        <span className="text-xl font-bold tracking-tight text-primary-600 select-none">
          Trinity Laundry
        </span>
        
        {/* Underneath Menu Action Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white shadow-sm transition-colors hover:bg-gray-50 dark:border-gray-800 dark:bg-zinc-950 dark:hover:bg-zinc-900 self-start"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? (
            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          ) : (
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          )}
        </button>
      </div>

      {/* MOBILE BOTTOM NAVIGATION BAR */}
      <aside className="fixed bottom-0 left-0 right-0 z-40 flex h-16 border-t border-gray-200 bg-white px-2 dark:border-gray-800 dark:bg-zinc-950 md:hidden">
        <nav className="flex w-full items-center justify-around">
          {filteredNavItems.slice(0, 4).map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-md p-2 text-xs transition-colors ${
                  isActive ? "text-primary-600 font-semibold" : "text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="sr-only">{item.label}</span>
              </Link>
            );
          })}
          <Link href="/profile" className="flex flex-col items-center justify-center p-2">
            {user.image ? (
              <img src={user.image} alt="Profile" className="h-6 w-6 rounded-full object-cover" />
            ) : (
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
                {fallbackLetter}
              </div>
            )}
          </Link>
        </nav>
      </aside>

      {/* COLLAPSIBLE DRAWER OVERLAY WITH BLUR BACKGROUND (Desktop Only) */}
      <div 
        className={`fixed inset-0 z-40 hidden md:block transition-all duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Blur backdrop behind the active navigation overlay */}
        <div 
          onClick={() => setIsOpen(false)} 
          className="absolute inset-0 bg-zinc-950/20 backdrop-blur-sm"
        />

        {/* Sliding Sidebar Navigation Box Panel */}
        <aside 
          className={`absolute inset-y-0 left-0 flex w-64 flex-col border-r border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-zinc-950 transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Spacer block pushes contents down neatly, leaving visual breathing room for the floating overlay components */}
          <div className="h-32 shrink-0 border-b border-transparent" />

          {/* Dynamic Navigation Links */}
          <nav className="flex-1 space-y-1 px-4 py-6 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all ${
                    isActive
                      ? "bg-primary-500/10 text-primary-600 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-zinc-900 dark:hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer containing Profile & Logout */}
          <div className="border-t border-gray-200 p-4 dark:border-gray-800">
            <div className="flex items-center justify-between gap-2">
              <Link href="/profile" className="flex items-center gap-3 rounded-lg p-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-zinc-900 flex-1 min-w-0">
                {user.image ? (
                  <img src={user.image} alt="Avatar" className="h-9 w-9 rounded-full object-cover" />
                ) : (
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 font-bold text-white">
                    {fallbackLetter}
                  </div>
                )}
                <div className="flex flex-col text-left text-sm truncate">
                  <span className="font-medium text-gray-700 dark:text-gray-200 truncate">{user.name || "User"}</span>
                  <span className="text-xs text-gray-400 capitalize">{userRole}</span>
                </div>
              </Link>

              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:text-gray-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}