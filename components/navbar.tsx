"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { Shield, Sun, Moon, Monitor, Menu, X } from "lucide-react";
import { motion, useScroll } from "framer-motion";

export default function Navbar() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollYProgress } = useScroll();

  useEffect(() => setMounted(true), []);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Our Services", href: "#services" },
    { name: "Why TT", href: "#why-tt" },
    { name: "Coverage", href: "#coverage" },
  ];

  return (
    <header className="fixed top-0 left-0 w-full h-20 z-[9999] liquid-glass-light dark:liquid-glass-dark border-b border-navy-deep/10 dark:border-gold-metallic/10 transition-all duration-300">
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Vector Bubble/Fabric Weave Minimalist Logo */}
        <a href="#home" className="flex items-center gap-2 group">
          <div className="relative w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-tr from-gold-polished to-gold-pastel dark:from-gold-metallic dark:to-navy-deep shadow-md">
            <Shield className="w-5 h-5 text-navy-deep dark:text-gold-pastel group-hover:rotate-12 transition-transform duration-300" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-400 rounded-full animate-ping" />
          </div>
          <span className="text-xl font-bold tracking-wider bg-gradient-to-r from-navy-deep to-slate-blue dark:from-gold-pastel dark:to-gold-metallic bg-clip-text text-transparent">
            TT LAUNDRY
          </span>
        </a>

        {/* Desktop Anchor Architecture */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-slate-blue dark:text-platinum hover:text-gold-polished dark:hover:text-gold-metallic transition-colors duration-200 relative group"
            >
              {link.name}
              <span className="absolute bottom-[-6px] left-0 w-0 h-[2px] bg-gold-polished dark:bg-gold-metallic group-hover:w-full transition-all duration-300" />
            </a>
          ))}
        </nav>

        {/* Action Controls Matrix */}
        <div className="hidden md:flex items-center gap-4">
          {/* Theme Control System */}
          {mounted && (
            <div className="flex items-center gap-1 bg-white/40 dark:bg-navy-deep/60 p-1 rounded-full border border-navy-deep/10 dark:border-white/10">
              <button onClick={() => setTheme("light")} className={`p-1.5 rounded-full ${theme === "light" ? "bg-gold-polished text-white" : "text-slate-blue"}`} title="Light Mode"><Sun className="w-4 h-4" /></button>
              <button onClick={() => setTheme("dark")} className={`p-1.5 rounded-full ${theme === "dark" ? "bg-gold-metallic text-navy-deep" : "text-platinum"}`} title="Dark Mode"><Moon className="w-4 h-4" /></button>
              <button onClick={() => setTheme("system")} className={`p-1.5 rounded-full ${theme === "system" ? "bg-slate-400 text-white" : "text-slate-500"}`} title="System Default"><Monitor className="w-4 h-4" /></button>
            </div>
          )}

          <a href="#scheduler" className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark hover:shadow-[0_0_20px_rgba(214,175,85,0.4)] transform hover:-translate-y-0.5 transition-all duration-300">
            Scheduling Hub
          </a>
        </div>

        {/* Mobile Interaction Trigger */}
        <div className="flex items-center gap-4 md:hidden">
          {mounted && (
            <button 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
              className="p-2 rounded-full liquid-glass-light dark:liquid-glass-dark text-gold-polished dark:text-gold-metallic"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-navy-deep dark:text-alabaster focus:outline-none"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Kinetic Scrollspy Tracking Node Line */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-gold-polished to-gold-pastel dark:from-gold-metallic dark:to-cyan-400 origin-left"
        style={{ scaleX: scrollYProgress }}
      />

      {/* Mobile Dynamic Full Screen Glass Overlay */}
      {mobileMenuOpen && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-20 left-0 w-full h-screen bg-canvas-light/95 dark:bg-canvas-dark/95 backdrop-blur-xl z-[9998] flex flex-col p-6 gap-6 md:hidden"
        >
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-2xl font-semibold border-b border-navy-deep/10 dark:border-white/10 pb-3"
            >
              {link.name}
            </a>
          ))}
          <a
            href="#scheduler"
            onClick={() => setMobileMenuOpen(false)}
            className="w-full py-4 text-center rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark font-bold text-lg"
          >
            Scheduling Hub
          </a>
        </motion.div>
      )}
    </header>
  );
}