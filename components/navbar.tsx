"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FiSun, FiMoon, FiMonitor } from "react-icons/fi";

const navLinks = [
  { label: "Home", href: "#home" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Services", href: "#services" },
  { label: "Why TT", href: "#why-tt" },
  { label: "Coverage", href: "#coverage" },
];

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeSection, setActiveSection] = useState("home");
  const pathname = usePathname();

  useEffect(() => setMounted(true), []);

  // Scroll spy (simplified)
  useEffect(() => {
    const handleScroll = () => {
      const sections = navLinks.map((link) =>
        document.getElementById(link.href.slice(1))
      );
      const scrollPos = window.scrollY + 100;
      sections.forEach((section) => {
        if (section && section.offsetTop <= scrollPos) {
          setActiveSection(section.id);
        }
      });
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!mounted) return null;

  return (
    <header className="fixed top-0 left-0 w-full z-50 glass border-b border-gold/10 backdrop-blur-3xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl font-bold text-gold">TT</span>
          <span className="hidden sm:inline text-sm font-medium uppercase tracking-widest">
            Laundry
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors relative ${
                activeSection === link.href.slice(1)
                  ? "text-gold"
                  : "text-gray-600 dark:text-gray-300 hover:text-gold"
              }`}
            >
              {link.label}
              {activeSection === link.href.slice(1) && (
                <motion.div
                  layoutId="underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gold"
                />
              )}
            </a>
          ))}
        </nav>

        {/* Right controls */}
        <div className="flex items-center gap-4">
          {/* Theme switcher */}
          <div className="flex items-center gap-1 bg-gray-200 dark:bg-gray-800 p-1 rounded-full">
            <button
              onClick={() => setTheme("light")}
              className={`p-2 rounded-full transition ${
                theme === "light" ? "bg-white shadow text-gold" : "text-gray-500"
              }`}
              aria-label="Light theme"
            >
              <FiSun />
            </button>
            <button
              onClick={() => setTheme("system")}
              className={`p-2 rounded-full transition ${
                theme === "system" ? "bg-white shadow text-gold" : "text-gray-500"
              }`}
              aria-label="System theme"
            >
              <FiMonitor />
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`p-2 rounded-full transition ${
                theme === "dark" ? "bg-white shadow text-gold" : "text-gray-500"
              }`}
              aria-label="Dark theme"
            >
              <FiMoon />
            </button>
          </div>

          {/* CTA */}
          <Link
            href="/schedule"
            className="hidden sm:inline-block px-5 py-2.5 bg-gold text-navy font-semibold rounded-full hover:bg-gold-light transition shadow-gold/30"
          >
            Schedule Now
          </Link>
        </div>
      </div>

      {/* Scroll progress line */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-gold/30 w-full">
        <motion.div
          className="h-full bg-gold"
          initial={{ width: "0%" }}
          whileInView={{ width: "100%" }}
          transition={{ duration: 1 }}
        />
      </div>
    </header>
  );
}