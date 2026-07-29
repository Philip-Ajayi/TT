// components/admin/topbar.tsx
'use client';

import React, { useState } from "react";
import { useTheme } from "next-themes";
import { useSession, signOut } from "next-auth/react";
import { Menu, Sun, Moon, User, ChevronDown, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

interface TopbarProps {
  onMenuClick: () => void;
}

export default function AdminTopbar({ onMenuClick }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { data: session } = useSession();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-16 bg-canvas-light dark:bg-canvas-dark border-b" />;

  const user = session?.user;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center justify-between px-4 lg:px-8 bg-white/70 dark:bg-canvas-dark/70 backdrop-blur-lg border-b border-navy-deep/5 dark:border-white/5">
      {/* Mobile menu button */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-xl text-slate-blue dark:text-platinum hover:bg-navy-deep/5 dark:hover:bg-white/5"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Right-side actions */}
      <div className="flex items-center gap-4 ml-auto">
        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-slate-blue dark:text-platinum hover:text-gold-polished dark:hover:text-gold-metallic transition-all"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen(!profileOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-navy-deep/10 dark:border-white/10 hover:bg-gold-metallic/5 transition-all"
          >
            <div className="w-7 h-7 rounded-full bg-gold-polished/20 dark:bg-gold-metallic/20 flex items-center justify-center text-xs font-bold text-gold-polished dark:text-gold-metallic">
              {initials}
            </div>
            <span className="hidden sm:block text-xs font-semibold uppercase tracking-wide text-slate-blue dark:text-platinum">
              {user?.name || "Admin"}
            </span>
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
                  href="/admin/profile"
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
      </div>
    </header>
  );
}