"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Mousewheel, Keyboard } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { FiMapPin, FiCheckCircle, FiTruck } from "react-icons/fi";

gsap.registerPlugin(ScrollTrigger);

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const heroTextRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Parallax hero background
    gsap.to(".hero-bg", {
      y: "20%",
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: 1,
      },
    });

    // Hero text reveal
    gsap.from(heroTextRef.current, {
      opacity: 0,
      y: 60,
      duration: 1.2,
      ease: "power3.out",
    });

    // Section animations
    gsap.utils.toArray(".reveal-section").forEach((section) => {
      gsap.from(section as HTMLElement, {
        opacity: 0,
        y: 80,
        duration: 1,
        scrollTrigger: {
          trigger: section as HTMLElement,
          start: "top 80%",
          end: "top 50%",
          toggleActions: "play none none reverse",
        },
      });
    });
  }, []);

  return (
    <div className="overflow-x-hidden">
      {/* ===== HERO ===== */}
      <section
        id="home"
        ref={heroRef}
        className="relative min-h-screen flex items-center pt-20 overflow-hidden"
      >
        {/* Parallax background */}
        <div className="hero-bg absolute inset-0 bg-gradient-to-br from-navy/80 to-dark-bg dark:from-navy/90 dark:to-dark-bg" />

        {/* Liquid glass floating droplets (decorative) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="liquid-glass absolute top-1/4 left-10 w-64 h-64 bg-gold/5 dark:bg-gold/10 blur-3xl" />
          <div className="liquid-glass absolute bottom-1/4 right-10 w-80 h-80 bg-navy/10 dark:bg-navy/20 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-2 gap-12 items-center">
          <div ref={heroTextRef} className="space-y-6">
            <div className="inline-block glass px-4 py-1 rounded-full text-gold text-sm font-medium">
              Ibadan's Finest Fabric Care — Now Expanding Nationwide
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              The Absolute Pinnacle of <br />
              <span className="text-gold">Fabric Reclamation</span> & Luxury Care
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md">
              We collect from your doorstep, execute tailored cleaning cycles, and
              return garments in pristine, ready to wear state. No stress.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <button className="px-8 py-4 bg-gold text-navy font-bold rounded-full hover:bg-gold-light transition shadow-lg shadow-gold/30">
                Initiate Wardrobe Collection
              </button>
              <button className="px-8 py-4 glass border border-gold/50 text-gold font-medium rounded-full hover:bg-gold/10 transition">
                Explore Specialized Workflows
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="liquid-glass aspect-square max-w-md mx-auto overflow-hidden bg-gradient-to-br from-gold/20 to-navy/20 p-4">
              <div className="w-full h-full bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <span className="text-gray-400">Hero Image Placeholder</span>
                {/* Replace with actual image */}
              </div>
            </div>
          </div>
        </div>

        {/* Scrollspy tab strip (floating at bottom) */}
        <div className="absolute bottom-0 left-0 w-full bg-navy/80 dark:bg-navy/60 backdrop-blur-md border-t border-gold/10">
          <div className="max-w-7xl mx-auto px-4 py-2 flex justify-around text-xs font-medium text-gray-300">
            <span className="text-gold">01. Origin Flow</span>
            <span>02. The Protocol</span>
            <span>03. Fabric Pillars</span>
            <span>04. Map</span>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS (DUAL-ROUTE) ===== */}
      <section id="how-it-works" className="reveal-section py-20 bg-navy/5 dark:bg-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">How It Works</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Choose your preferred way to get started.
            </p>
          </div>

          {/* Route selector (glass pill toggle) */}
          <div className="flex justify-center mb-10">
            <div className="glass p-1 rounded-full flex items-center gap-1">
              <button className="px-6 py-2 rounded-full bg-gold/20 text-gold font-medium">
                Doorstep Valet
              </button>
              <button className="px-6 py-2 rounded-full hover:bg-white/10 transition text-gray-600 dark:text-gray-300">
                Walk in Depot
              </button>
            </div>
          </div>

          {/* Route A Swiper */}
          <Swiper
            modules={[Navigation, Pagination, Mousewheel, Keyboard]}
            spaceBetween={24}
            slidesPerView={1.2}
            centeredSlides={false}
            breakpoints={{
              768: { slidesPerView: 2.2 },
              1024: { slidesPerView: 3 },
            }}
            navigation
            pagination={{ clickable: true }}
            className="pb-12"
          >
            {[
              {
                icon: <FiMapPin className="w-8 h-8 text-gold" />,
                title: "Request Valet",
                desc: "Set your coordinates via our smart scheduler. No upfront price traps.",
              },
              {
                icon: <FiTruck className="w-8 h-8 text-gold" />,
                title: "The Handoff",
                desc: "Hand over to our audited logistics couriers at your preferred time.",
              },
              {
                icon: <FiCheckCircle className="w-8 h-8 text-gold" />,
                title: "Process & Return",
                desc: "Track digital processing milestones. Delivered pristine, hung or folded.",
              },
            ].map((item, idx) => (
              <SwiperSlide key={idx}>
                <div className="glass p-6 rounded-2xl h-full flex flex-col items-center text-center hover:scale-[1.02] transition duration-300">
                  <div className="mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.desc}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </section>

      {/* ===== SERVICES (ACCORDIONS + TABS) ===== */}
      <section id="services" className="reveal-section py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>

          {/* Category tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {["All Workflows", "Wash & Fold", "Artisan Ironing", "Micro Stain Lab"].map((tab) => (
              <button
                key={tab}
                className="px-4 py-2 rounded-full glass text-sm font-medium hover:bg-gold/10 transition"
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Accordions */}
          <div className="space-y-4 max-w-3xl mx-auto">
            {[
              {
                title: "The Laundry Foundry (Washing & Processing)",
                content:
                  "Eco tumble, active oxygen baths, delicate silk agitation, hypoallergenic chemical lines, bulk daily garments.",
              },
              {
                title: "The Press & Shape Forge (Artisan Ironing)",
                content:
                  "Cold press operations, tension steam mannequins for suits, hyper crisp lines for native attire.",
              },
              {
                title: "The Stain Lab (Advanced Molecular Remediation)",
                content:
                  "Oil, wine, protein, and age degraded fiber stabilization without color bleaching.",
              },
              {
                title: "Architectural Crispness Studio (Starching Profiles)",
                content:
                  "Variable starch levels from soft fluid motion to military grade rigid sculptural structures.",
              },
            ].map((item, idx) => (
              <details
                key={idx}
                className="glass p-4 rounded-2xl border border-gold/10 open:border-gold/60 transition-all duration-300 group"
              >
                <summary className="flex justify-between items-center cursor-pointer font-semibold text-lg">
                  {item.title}
                  <span className="group-open:rotate-90 transition-transform">›</span>
                </summary>
                <div className="mt-3 text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {item.content}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ===== WHY TT (4 CARDS) ===== */}
      <section id="why-tt" className="reveal-section py-20 bg-navy/5 dark:bg-navy/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Why TT</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: "Fiber Security Warranty",
                desc: "Every garment is logged via high res digital imaging. Total custody tracking protects your high value wear.",
              },
              {
                title: "Zero Anxiety Committal",
                desc: "No complex calculations or hidden cost math. You only see real itemized rates when choosing options.",
              },
              {
                title: "Master Craftsmen Logic",
                desc: "We do not blindly dump clothes into common washers. Fabric specialists dictate individual chemical paths.",
              },
              {
                title: "Hyper Personalized Care",
                desc: "State your lifestyle settings once: fragrance levels, folding profiles, hanger systems. We preserve your profile.",
              },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                whileHover={{ scale: 1.03, backdropFilter: "blur(40px)" }}
                className="glass p-6 rounded-2xl text-center"
              >
                <h3 className="text-lg font-semibold mb-2 text-gold">{card.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{card.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COVERAGE (MAP + LOCATION SEARCH) ===== */}
      <section id="coverage" className="reveal-section py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-5 gap-12">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-3xl font-bold">
              Serving Ibadan's Elite <br /> Expanding Our Footprint
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Operating active luxury networks across Ibadan. Scaling up premium logistics
              links to new territories shortly.
            </p>
            <div className="glass p-4 rounded-2xl">
              <label className="block text-sm font-medium mb-1">Enter your neighborhood</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. Bodija, Jericho"
                  className="flex-1 bg-transparent border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-gold"
                />
                <button className="bg-gold text-navy px-4 py-2 rounded-lg font-semibold">
                  Check
                </button>
              </div>
            </div>
            <details className="glass p-4 rounded-2xl open:border-gold/60">
              <summary className="font-medium cursor-pointer">Ibadan Hubs (Active)</summary>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>Bodija (Valet Active)</li>
                <li>Jericho (Full Depot + Valet)</li>
                <li>Oluyole (Valet Active)</li>
                <li>Akobo (Valet Active)</li>
              </ul>
            </details>
          </div>

          <div className="md:col-span-3 relative h-80 md:h-auto bg-navy/10 dark:bg-navy/30 rounded-2xl flex items-center justify-center">
            <span className="text-gray-400">Interactive Map Placeholder</span>
            {/* Replace with SVG map */}
          </div>
        </div>
      </section>

      {/* ===== CONVERSION LAUNCHPAD ===== */}
      <section className="py-20 bg-gradient-to-r from-gold/20 to-navy/20 dark:from-gold/10 dark:to-navy/40 text-center">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-4xl font-bold mb-4">Ready to Experience True Fabric Luxury?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8">
            Step into the scheduling hub to configure your wardrobe collection or drop off plan.
            Zero friction. Absolute precision.
          </p>
          <button className="px-12 py-5 bg-navy text-white dark:bg-white dark:text-navy font-bold rounded-full text-xl hover:scale-105 transition shadow-xl hover:shadow-gold/30">
            Enter TT Wardrobe Scheduler
          </button>
        </div>
      </section>
    </div>
  );
}