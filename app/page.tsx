"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import {
  ArrowRight,
  Truck,
  Store,
  MapPin,
  ChevronDown,
  Layers,
  ShieldCheck,
  HeartPulse,
  HelpCircle,
} from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-fade";

export default function HomePage() {
  // Parallax hooks
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  const textY = useTransform(heroScrollProgress, [0, 1], ["0%", "40%"]);
  const backgroundY = useTransform(heroScrollProgress, [0, 1], ["0%", "15%"]);

  // Cursor droplets
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Route switcher
  const [activeRoute, setActiveRoute] = useState<"valet" | "walkin">("valet");

  // Accordion
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);

  // Zone search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);
  const activeZones = ["bodija", "jericho", "oluyole", "akobo"];

  const handleZoneValidation = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    if (activeZones.includes(query)) {
      setSearchFeedback(
        `Great news! We already serve ${searchQuery}. Schedule a pickup today.`
      );
    } else {
      setSearchFeedback(
        `${searchQuery} is on our expansion list. We'll notify you when we launch there.`
      );
    }
  };

  // Simplified service data
  const servicesData = [
    {
      title: "Washing & Cleaning",
      desc: "We use gentle, effective washing methods that respect every fabric type. From everyday cottons to delicate silks, your clothes get a deep clean without damage.",
      image:
        "https://images.unsplash.com/photo-1545173168-9f1907e8006e?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Ironing & Finishing",
      desc: "Crisp, neat results every time. Our team presses each item with the right heat and steam, so your shirts, trousers, and traditional outfits look freshly tailored.",
      image:
        "https://images.unsplash.com/photo-1489274495757-95c7c837b101?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Stain Removal",
      desc: "Stubborn stains from food, oil, or drinks? We treat them carefully, lifting marks without harming the fabric. Even old stains have a chance.",
      image:
        "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Starching & Stiffening",
      desc: "For a crisp, structured look, we offer custom starch levels. Perfect for native wear, uniforms, or any outfit that needs extra sharpness.",
      image:
        "https://images.unsplash.com/photo-1610555356070-d0efb6505f81?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <div className="w-full pt-20">
      {/* SECTION 01: HERO – reduced height on mobile */}
      <section
        id="home"
        ref={heroRef}
        className="relative w-full min-h-[80vh] lg:min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* Animated backgrounds */}
        <motion.div
          style={{ y: backgroundY }}
          className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20 flex items-center justify-center"
        >
          <div className="absolute w-[600px] h-[600px] bg-gold-metallic/10 dark:bg-cyan-500/5 rounded-full blur-3xl transform -translate-x-1/4" />
          <div className="absolute w-[400px] h-[400px] bg-gold-pastel/20 dark:bg-gold-metallic/5 rounded-full blur-3xl transform translate-x-1/3" />
        </motion.div>

        {/* Floating droplets (desktop only) */}
        <motion.div
          animate={{ x: mousePosition.x, y: mousePosition.y }}
          transition={{ type: "spring", damping: 15 }}
          className="absolute top-1/4 right-1/4 w-32 h-32 hidden lg:block border border-gold-metallic/30 bg-white/5 dark:bg-white/5 backdrop-blur-md animate-liquid-shape pointer-events-none z-10"
        />
        <motion.div
          animate={{ x: -mousePosition.x, y: -mousePosition.y }}
          transition={{ type: "spring", damping: 20 }}
          className="absolute bottom-1/4 left-1/4 w-24 h-24 hidden lg:block border border-cyan-400/20 bg-white/5 dark:bg-white/5 backdrop-blur-md animate-liquid-shape pointer-events-none z-10"
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-20">
          {/* Text column */}
          <motion.div
            style={{ y: textY }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 flex flex-col justify-center text-left"
          >
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              Laundry Done Right, <br />
              <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
                Every Single Time
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-blue dark:text-platinum max-w-xl mb-8 leading-relaxed">
              We pick up your clothes, clean them with care, and return them
              fresh and neatly pressed. No hidden fees, no stress – just clean
              clothes on your schedule.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="#scheduler"
                className="px-8 py-4 rounded-xl text-sm font-bold tracking-wide uppercase bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark flex items-center justify-center gap-3 shadow-lg hover:shadow-gold-metallic/20 transform hover:-translate-y-0.5 transition-all"
              >
                Schedule a Pickup
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#services"
                className="px-8 py-4 rounded-xl text-sm font-bold tracking-wide uppercase border border-gold-polished/40 dark:border-gold-metallic/30 liquid-glass-light dark:liquid-glass-dark flex items-center justify-center gap-3 hover:bg-gold-metallic/5 transition-all"
              >
                Our Services
              </a>
            </div>
          </motion.div>

          {/* Image column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="lg:col-span-5 flex justify-center items-center"
          >
            <div className="relative w-full max-w-[400px] aspect-square group">
              <div className="absolute inset-0 bg-gradient-to-tr from-gold-metallic via-cyan-500 to-navy-light rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="w-full h-full border border-gold-metallic/30 dark:border-gold-metallic/20 overflow-hidden shadow-2xl animate-liquid-shape relative liquid-glass-light dark:liquid-glass-dark p-3">
                <div
                  className="w-full h-full bg-cover bg-center animate-liquid-shape transform scale-105 group-hover:scale-110 transition-transform duration-700"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop')`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 02: HOW IT WORKS – unchanged */}
      <section
        id="how-it-works"
        className="w-full py-24 bg-white/20 dark:bg-navy-deep/20 border-y border-navy-deep/5 dark:border-white/5 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              How It Works
            </h2>
            <p className="text-slate-blue dark:text-platinum">
              Choose the way that fits your routine. We either come to you, or
              you can drop by our store.
            </p>

            {/* Toggle */}
            <div className="mt-8 inline-flex p-1.5 rounded-full bg-white/50 dark:bg-navy-deep/80 border border-navy-deep/10 dark:border-white/10 shadow-inner">
              <button
                onClick={() => setActiveRoute("valet")}
                className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all duration-300 ${
                  activeRoute === "valet"
                    ? "bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark shadow-md"
                    : "text-slate-blue dark:text-platinum hover:text-gold-polished"
                }`}
              >
                <Truck className="w-3.5 h-3.5" />
                Pickup & Delivery
              </button>
              <button
                onClick={() => setActiveRoute("walkin")}
                className={`px-6 py-2.5 rounded-full text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all duration-300 ${
                  activeRoute === "walkin"
                    ? "bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark shadow-md"
                    : "text-slate-blue dark:text-platinum hover:text-gold-polished"
                }`}
              >
                <Store className="w-3.5 h-3.5" />
                Drop Off In Store
              </button>
            </div>
          </div>

          <div className="w-full min-h-[360px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeRoute}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4 }}
              >
                <Swiper
                  modules={[Pagination, Autoplay]}
                  spaceBetween={30}
                  slidesPerView={1}
                  pagination={{ clickable: true, dynamicBullets: true }}
                  autoplay={{ delay: 5000, disableOnInteraction: true }}
                  breakpoints={{
                    640: { slidesPerView: 1.5 },
                    1024: { slidesPerView: 3 },
                  }}
                  className="pb-14"
                >
                  {activeRoute === "valet" ? (
                    <>
                      <SwiperSlide>
                        <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 h-full hover:scale-[1.03] transition-transform duration-300">
                          <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                            <MapPin className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold mb-2">
                            1. You Request
                          </h3>
                          <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                            Tell us your address and when you want us to come. No
                            complicated forms.
                          </p>
                          <div
                            className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                            style={{
                              backgroundImage: `url('https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=400&auto=format&fit=crop')`,
                            }}
                          />
                        </div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 h-full hover:scale-[1.03] transition-transform duration-300">
                          <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold mb-2">
                            2. We Collect
                          </h3>
                          <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                            A friendly rider picks up your laundry at the agreed
                            time. Your clothes are tagged for safety.
                          </p>
                          <div
                            className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                            style={{
                              backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=400&auto=format&fit=crop')`,
                            }}
                          />
                        </div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 h-full hover:scale-[1.03] transition-transform duration-300">
                          <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                            <ArrowRight className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold mb-2">
                            3. Clean Delivery
                          </h3>
                          <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                            We return your clothes clean, fresh, and neatly
                            pressed. Track progress in real time.
                          </p>
                          <div
                            className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                            style={{
                              backgroundImage: `url('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop')`,
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    </>
                  ) : (
                    <>
                      <SwiperSlide>
                        <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 h-full hover:scale-[1.03] transition-transform duration-300">
                          <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                            <Store className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold mb-2">
                            1. Drop Off
                          </h3>
                          <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                            Visit any of our Ibadan locations. Hand over your
                            clothes in minutes.
                          </p>
                          <div
                            className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                            style={{
                              backgroundImage: `url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=400&auto=format&fit=crop')`,
                            }}
                          />
                        </div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-white/10 h-full hover:scale-[1.03] transition-transform duration-300">
                          <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                            <Layers className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold mb-2">
                            2. We Process
                          </h3>
                          <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                            We sort, wash, and iron your items with precision.
                            You get a digital receipt instantly.
                          </p>
                          <div
                            className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                            style={{
                              backgroundImage: `url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&auto=format&fit=crop')`,
                            }}
                          />
                        </div>
                      </SwiperSlide>
                      <SwiperSlide>
                        <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 h-full hover:scale-[1.03] transition-transform duration-300">
                          <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                            <ArrowRight className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold mb-2">
                            3. Pick Up or Delivery
                          </h3>
                          <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                            Once done, you can collect or opt for home delivery.
                            Clean, fresh clothes without the wait.
                          </p>
                          <div
                            className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                            style={{
                              backgroundImage: `url('https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=400&auto=format&fit=crop')`,
                            }}
                          />
                        </div>
                      </SwiperSlide>
                    </>
                  )}
                </Swiper>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* SECTION 03: SERVICES ACCORDION – unchanged */}
      <section
        id="services"
        className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            What We Offer
          </h2>
          <p className="text-slate-blue dark:text-platinum">
            Every service is designed to keep your clothes looking their best.
            Tap to learn more.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Accordions */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {servicesData.map((service, index) => {
              const isActive = openAccordion === index;
              return (
                <div
                  key={index}
                  className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
                    isActive
                      ? "liquid-glass-light dark:liquid-glass-dark border-gold-polished dark:border-gold-metallic/60 shadow-lg"
                      : "bg-transparent border-navy-deep/10 dark:border-white/10"
                  }`}
                >
                  <button
                    onClick={() => setOpenAccordion(isActive ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between font-bold text-base sm:text-lg text-navy-deep dark:text-alabaster"
                  >
                    <span
                      className={
                        isActive
                          ? "text-gold-polished dark:text-gold-metallic"
                          : ""
                      }
                    >
                      {service.title}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isActive
                          ? "rotate-180 text-gold-polished dark:text-gold-metallic"
                          : ""
                      }`}
                    />
                  </button>

                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{
                      height: isActive ? "auto" : 0,
                      opacity: isActive ? 1 : 0,
                    }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  >
                    <div className="p-6 pt-0 text-sm text-slate-blue dark:text-platinum leading-relaxed">
                      {service.desc}
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>

          {/* Dynamic image */}
          <div className="lg:col-span-5 hidden lg:block sticky top-28">
            <div className="w-full aspect-square border border-navy-deep/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl relative bg-navy-deep">
              <AnimatePresence mode="wait">
                <motion.div
                  key={openAccordion ?? "empty"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url('${
                      openAccordion !== null
                        ? servicesData[openAccordion].image
                        : "https://images.unsplash.com/photo-1545173168-9f1907e8006e?q=80&w=600&auto=format&fit=crop"
                    }')`,
                  }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-deep via-transparent to-transparent opacity-80" />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04: WHY TT – completely stable, no glass morphism */}
      <section
        id="why-tt"
        className="w-full py-24 bg-gradient-to-b from-transparent to-navy-deep/5 dark:to-navy-deep/40 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Why Choose TT Laundry?
            </h2>
            <p className="text-slate-blue dark:text-platinum">
              We treat your clothes like our own. Here’s what makes us
              different.
            </p>
          </div>

          {/* Stable flat cards – no backdrop-filter, no liquid-glass */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white dark:bg-navy-light p-6 sm:p-8 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/20 shadow-sm hover:shadow-md transition-shadow min-h-[220px] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Total Fabric Safety
                </h3>
                <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed">
                  Every item is checked carefully. We follow the best cleaning
                  methods so your clothes last longer, whether they are everyday
                  wear or delicate traditional pieces.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-navy-light p-6 sm:p-8 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/20 shadow-sm hover:shadow-md transition-shadow min-h-[220px] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-4">
                  <HeartPulse className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">
                  No Surprises, Ever
                </h3>
                <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed">
                  You see exactly what you pay for upfront. No hidden charges,
                  no confusing math. Just honest service.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-navy-light p-6 sm:p-8 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/20 shadow-sm hover:shadow-md transition-shadow min-h-[220px] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-4">
                  <Layers className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Skilled Hands
                </h3>
                <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed">
                  We don’t use the same harsh process for everything. Each
                  fabric is treated with the right care, from starch levels to
                  ironing techniques.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-navy-light p-6 sm:p-8 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/20 shadow-sm hover:shadow-md transition-shadow min-h-[220px] flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-4">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold mb-2">
                  Made Just for You
                </h3>
                <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed">
                  Like a specific scent or folding style? Tell us once, and we
                  remember. Your preferences are saved for every future order.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05: COVERAGE – unchanged */}
      <section
        id="coverage"
        className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              We’re in Your Neighbourhood
            </h2>
            <p className="text-slate-blue dark:text-platinum mb-8 leading-relaxed">
              Currently serving top areas in Ibadan, and expanding fast. Check
              if we’re already at your doorstep.
            </p>

            <form
              onSubmit={handleZoneValidation}
              className="w-full flex gap-2 mb-6"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. Bodija, Jericho, Akobo"
                className="flex-1 px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-sm focus:outline-none focus:border-gold-polished focus:ring-1 focus:ring-gold-polished transition-all"
              />
              <button
                type="submit"
                className="px-5 py-3 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity"
              >
                Check
              </button>
            </form>

            {searchFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 text-xs font-medium rounded-lg liquid-glass-light dark:liquid-glass-dark border border-gold-polished/30 text-gold-polished dark:text-gold-pastel mb-6"
              >
                {searchFeedback}
              </motion.div>
            )}

            <div className="flex flex-col gap-2">
              <div className="p-4 rounded-xl liquid-glass-light dark:liquid-glass-dark border border-green-500/20 flex items-center justify-between text-sm">
                <span className="font-semibold">Active Service Zones</span>
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-green-500/10 text-green-500 rounded-full tracking-widest">
                  Live
                </span>
              </div>
              <div className="pl-4 text-xs text-slate-blue dark:text-platinum space-y-1.5 opacity-80">
                <p>• Bodija – Full pickup & delivery</p>
                <p>• Jericho – Drop off & valet service</p>
                <p>• Oluyole – Valet routes active</p>
                <p>• Akobo – Now serving</p>
              </div>
            </div>
          </div>

          {/* Map mockup */}
          <div className="lg:col-span-7 w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark p-4 flex items-center justify-center">
            <div className="absolute inset-0 opacity-40 dark:opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative text-center max-w-sm p-6 rounded-2xl border border-gold-metallic/20 bg-canvas-light/50 dark:bg-canvas-dark/50 shadow-md">
              <MapPin className="w-10 h-10 mx-auto text-gold-polished dark:text-gold-metallic mb-4 animate-bounce" />
              <h4 className="text-base font-bold mb-2">
                Interactive Coverage Map
              </h4>
              <p className="text-xs text-slate-blue dark:text-platinum leading-relaxed">
                See exactly where our riders can reach you. More areas added
                every month.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 06: CALL TO ACTION – unchanged */}
      <section
        id="scheduler"
        className="w-full py-28 relative overflow-hidden bg-gradient-to-tr from-gold-polished via-gold-metallic to-gold-pastel text-canvas-dark px-4 sm:px-6 lg:px-8 text-center"
      >
        <div className="absolute w-80 h-80 bg-white/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-80 h-80 bg-navy-deep/10 rounded-full blur-3xl -bottom-20 -right-20" />

        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6 text-navy-deep">
            Ready for Fresh, Clean Clothes?
          </h2>
          <p className="text-base sm:text-xl text-navy-deep/80 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Schedule your first pickup in under a minute. No commitment, just
            great service.
          </p>

          <button className="inline-flex items-center gap-4 px-10 py-5 bg-navy-deep text-white text-sm font-bold tracking-widest uppercase rounded-full shadow-2xl hover:bg-navy-light transform hover:-translate-y-1 hover:shadow-navy-deep/30 transition-all duration-300">
            Get Started Now
            <ArrowRight className="w-4 h-4 text-gold-metallic" />
          </button>
        </div>
      </section>
    </div>
  );
}
