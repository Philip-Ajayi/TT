//app/unauthorized/page.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { ArrowRight, Home, UserX } from "lucide-react";

import gsap from "gsap";

export default function Unauthorized() {
  const pageRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 100, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 20 });

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".hero-content > *", {
        y: 60,
        opacity: 0,
        stagger: 0.1,
        duration: 0.9,
        ease: "power4.out",
        delay: 0.2,
      });
      gsap.from(".error-icon", {
        scale: 0,
        rotate: -20,
        duration: 0.8,
        ease: "back.out(1.7)",
        delay: 0.1,
      });
      gsap.to(".orb-1", {
        y: -40,
        x: 30,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".orb-2", {
        y: 50,
        x: -20,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.5,
      });
    }, pageRef);
    return () => ctx.revert();
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width / 2) / 30);
    mouseY.set((e.clientY - rect.top - rect.height / 2) / 30);
  };

  return (
    <div
      ref={pageRef}
      onMouseMove={handleMouseMove}
      className="min-h-screen w-full overflow-hidden bg-canvas-light dark:bg-canvas-dark text-navy-deep dark:text-alabaster"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb-1 absolute -right-20 top-20 h-[400px] w-[400px] rounded-full bg-red-400/5 blur-[150px]" />
        <div className="orb-2 absolute -left-20 bottom-20 h-[400px] w-[400px] rounded-full bg-amber-400/5 blur-[150px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-pastel/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-20 text-center">
        <motion.div
          style={{ x: springX, y: springY }}
          className="hero-content max-w-4xl"
        >
          <div className="error-icon mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border-4 border-rose-500/30 bg-rose-500/10 text-rose-500 dark:border-rose-400/40 dark:bg-rose-400/10 dark:text-rose-400">
            <UserX className="h-14 w-14" />
          </div>

          <span className="mb-4 inline-block rounded-full border border-rose-500/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-rose-500 dark:text-rose-400">
            Access Denied
          </span>

          <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            You don’t have permission to view this page.
          </h1>

          <p className="mx-auto max-w-lg text-base leading-relaxed text-slate-blue dark:text-platinum">
            This area is restricted. Please verify your credentials or contact
            support if you believe this is a mistake.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-xl bg-gold-polished dark:bg-gold-metallic px-7 py-3.5 text-sm font-bold uppercase tracking-wider text-white dark:text-canvas-dark shadow-lg transition-transform hover:scale-105"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-slate-blue/70 dark:text-platinum/70">
            <Link
              href="/contact"
              className="flex items-center gap-1.5 transition-colors hover:text-gold-polished dark:hover:text-gold-metallic"
            >
              Need help? Contact Support
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
