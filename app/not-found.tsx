//app/not-found.tsx
"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Home } from "lucide-react";

import gsap from "gsap";

export default function NotFound() {
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
      gsap.from(".error-number", {
        scale: 0.6,
        opacity: 0,
        duration: 1.2,
        ease: "elastic.out(1, 0.5)",
        delay: 0.1,
      });
      gsap.to(".orb-1", {
        y: 50,
        x: 30,
        duration: 6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".orb-2", {
        y: -40,
        x: -20,
        duration: 7,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 1,
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
      {/* Ambient background orbs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="orb-1 absolute -left-20 top-20 h-[400px] w-[400px] rounded-full bg-gold-polished/5 dark:bg-gold-metallic/5 blur-[150px]" />
        <div className="orb-2 absolute -right-20 bottom-20 h-[400px] w-[400px] rounded-full bg-cyan-400/5 blur-[150px]" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-pastel/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 py-20 text-center">
        <motion.div
          style={{ x: springX, y: springY }}
          className="hero-content max-w-4xl"
        >
          {/* 404 number */}
          <div className="error-number relative mb-6">
            <span className="text-[10rem] font-black leading-[0.8] tracking-[-0.06em] text-gold-polished dark:text-gold-metallic sm:text-[14rem] lg:text-[18rem]">
              404
            </span>
            <div className="absolute -right-8 top-0 h-32 w-32 rounded-full bg-gold-polished/20 blur-3xl" />
          </div>

          <span className="mb-4 inline-block rounded-full border border-gold-polished/30 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-gold-polished dark:text-gold-pastel">
            Page not found
          </span>

          <h1 className="mb-4 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Oops! We couldn’t find that page.
          </h1>

          <p className="mx-auto max-w-lg text-base leading-relaxed text-slate-blue dark:text-platinum">
            The page you’re looking for might have been moved, renamed, or never
            existed. Let’s get you back on track.
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
        </motion.div>
      </div>
    </div>
  );
}
