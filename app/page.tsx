"use client";

import { useState, useRef, useEffect } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import {
  Sparkles,
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
  // Parallax refs
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const textY = useTransform(heroScrollProgress, [0, 1], ["0%", "40%"]);
  const backgroundY = useTransform(heroScrollProgress, [0, 1], ["0%", "15%"]);

  // Mouse tracking for fluid droplets (optional, keep)
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

  // Route switcher (valet / walk in)
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
      setSearchFeedback(`✅ We are fully active in ${searchQuery}. Book with confidence.`);
    } else {
      setSearchFeedback(`📍 ${searchQuery} is not covered yet, but we are expanding quickly.`);
    }
  };

  // Ref to control the inactive Swiper's autoplay
  const swiperValetRef = useRef<any>(null);
  const swiperWalkinRef = useRef<any>(null);

  // Pause / resume autoplay of the hidden Swiper
  useEffect(() => {
    if (activeRoute === "valet") {
      swiperValetRef.current?.autoplay?.start();
      swiperWalkinRef.current?.autoplay?.stop();
    } else {
      swiperWalkinRef.current?.autoplay?.start();
      swiperValetRef.current?.autoplay?.stop();
    }
  }, [activeRoute]);

  const servicesData = [
    {
      title: "Washing & Deep Cleaning",
      desc: "Every load is treated with care. We sort by colour and fabric, use gentle yet effective soaks that lift dirt without damaging threads, and finish with a fresh scent. Your clothes come back feeling soft, clean, and truly renewed.",
      image: "https://images.unsplash.com/photo-1545173168-9f1907e8006e?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Ironing & Pressing",
      desc: "Crisp collars, sharp pleats, and perfectly smooth surfaces. Our pressers use professional steam equipment that relaxes fibres and sets them into shape. Whether it is a simple shirt or a full agbada, every piece gets the attention it deserves.",
      image: "https://images.unsplash.com/photo-1489274495757-95c7c837b101?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Stain Removal",
      desc: "Even stubborn stains like wine, oil, or old sweat marks don’t stand a chance. We use safe spot treatments that break down the stain without harming the fabric. Your clothes come back spotless, with colours intact.",
      image: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?q=80&w=600&auto=format&fit=crop",
    },
    {
      title: "Starching & Stiff Finish",
      desc: "For that crisp, structured look on native wear, uniforms, or formal shirts, we offer custom starch levels. Choose a light finish or a firm hold – we will tailor it exactly to your preference and keep the fabric looking sharp all day.",
      image: "https://images.unsplash.com/photo-1610555356070-d0efb6505f81?q=80&w=600&auto=format&fit=crop",
    },
  ];

  return (
    <div className="w-full pt-20">
      {/* SECTION 01: HERO */}
      <section
        id="home"
        ref={heroRef}
        className="relative w-full min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8 py-12"
      >
        {/* Abstract background shapes – keep for visual effect */}
        <motion.div
          style={{ y: backgroundY, willChange: "transform" }}
          className="absolute inset-0 pointer-events-none opacity-30 dark:opacity-20 flex items-center justify-center"
        >
          <div className="absolute w-[600px] h-[600px] bg-gold-metallic/10 dark:bg-cyan-500/5 rounded-full blur-3xl transform -translate-x-1/4" />
          <div className="absolute w-[400px] h-[400px] bg-gold-pastel/20 dark:bg-gold-metallic/5 rounded-full blur-3xl transform translate-x-1/3" />
        </motion.div>

        {/* Floating droplets – hidden on tablets to avoid interference */}
        <motion.div
          animate={{ x: mousePosition.x, y: mousePosition.y }}
          transition={{ type: "spring", damping: 15 }}
          className="absolute top-1/4 right-1/4 w-32 h-32 hidden lg:block border border-gold-metallic/30 bg-white/5 dark:bg-white/5 backdrop-blur-md animate-liquid-shape pointer-events-none z-10"
          style={{ willChange: "transform, border-radius" }}
        />
        <motion.div
          animate={{ x: -mousePosition.x, y: -mousePosition.y }}
          transition={{ type: "spring", damping: 20 }}
          className="absolute bottom-1/4 left-1/4 w-24 h-24 hidden lg:block border border-cyan-400/20 bg-white/5 dark:bg-white/5 backdrop-blur-md animate-liquid-shape pointer-events-none z-10"
          style={{ willChange: "transform, border-radius" }}
        />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-20">
          {/* Left text column */}
          <motion.div
            style={{ y: textY }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-7 flex flex-col justify-center text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold-polished/30 dark:border-gold-metallic/20 liquid-glass-light dark:liquid-glass-dark mb-6 w-fit">
              <Sparkles className="w-4 h-4 text-gold-polished dark:text-gold-metallic" />
              <span className="text-xs font-semibold tracking-wider uppercase text-gold-polished dark:text-gold-pastel">
                Ibadan’s trusted laundry — expanding across Nigeria
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
              The very best care{" "}
              <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
                for your clothes
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-blue dark:text-platinum max-w-xl mb-8 leading-relaxed">
              We pick up from your home, clean with methods that respect every fabric, and return everything fresh, neat, and ready to wear. No hidden charges, just great results.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <a
                href="#scheduler"
                className="px-8 py-4 rounded-xl text-sm font-bold tracking-wide uppercase bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark flex items-center justify-center gap-3 shadow-lg hover:shadow-gold-metallic/20 transform hover:-translate-y-0.5 transition-all"
              >
                Book a pickup
                <ArrowRight className="w-4 h-4" />
              </a>
              <a
                href="#services"
                className="px-8 py-4 rounded-xl text-sm font-bold tracking-wide uppercase border border-gold-polished/40 dark:border-gold-metallic/30 liquid-glass-light dark:liquid-glass-dark flex items-center justify-center gap-3 hover:bg-gold-metallic/5 transition-all"
              >
                See what we do
              </a>
            </div>
          </motion.div>

          {/* Right image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            className="lg:col-span-5 flex justify-center items-center"
          >
            <div className="relative w-full max-w-[400px] aspect-square group">
              <div className="absolute inset-0 bg-gradient-to-tr from-gold-metallic via-cyan-500 to-navy-light rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-500" />
              <div className="w-full h-full border border-gold-metallic/30 dark:border-gold-metallic/20 overflow-hidden shadow-2xl animate-liquid-shape relative liquid-glass-light dark:liquid-glass-dark p-3 will-change-[border-radius,transform]">
                <div
                  className="w-full h-full bg-cover bg-center animate-liquid-shape transform scale-105 group-hover:scale-110 transition-transform duration-700 will-change-transform"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600&auto=format&fit=crop')`,
                  }}
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 02: HOW IT WORKS */}
      <section
        id="how-it-works"
        className="w-full py-24 bg-white/20 dark:bg-navy-deep/20 border-y border-navy-deep/5 dark:border-white/5 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Two ways to get your laundry done
            </h2>
            <p className="text-slate-blue dark:text-platinum">
              You stay in control. Choose doorstep pickup or drop off at our shop — whichever works best for you.
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
                Pickup &amp; Delivery
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
                Drop Off at Our Shop
              </button>
            </div>
          </div>

          {/* Swiper with smooth crossfade – no unmounting */}
          <div className="relative w-full min-h-[360px]">
            {/* Valet Swiper */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                activeRoute === "valet"
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <Swiper
                onSwiper={(swiper) => (swiperValetRef.current = swiper)}
                modules={[Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                pagination={{ clickable: true, dynamicBullets: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                breakpoints={{
                  640: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                className="pb-14"
              >
                <SwiperSlide>
                  <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 h-full hover:scale-[1.03] transition-transform duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                      <MapPin className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">1. Schedule a Pickup</h3>
                    <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                      Tell us your address and a time that suits you. Our rider comes to your door – no stress, no extra charges.
                    </p>
                    <div
                      className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1563013544-824ae1d704d3?q=80&w=400&auto=format&fit=crop')` }}
                    />
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 h-full hover:scale-[1.03] transition-transform duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">2. We Handle With Care</h3>
                    <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                      Your clothes are checked, tagged, and cleaned by experts. We treat every piece like it is our own.
                    </p>
                    <div
                      className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=400&auto=format&fit=crop')` }}
                    />
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 h-full hover:scale-[1.03] transition-transform duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">3. Fresh Return</h3>
                    <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                      You get notified when everything is ready. We deliver back neatly hung or folded, exactly how you like it.
                    </p>
                    <div
                      className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=400&auto=format&fit=crop')` }}
                    />
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>

            {/* Walk‑in Swiper */}
            <div
              className={`absolute inset-0 transition-opacity duration-500 ${
                activeRoute === "walkin"
                  ? "opacity-100"
                  : "opacity-0 pointer-events-none"
              }`}
            >
              <Swiper
                onSwiper={(swiper) => (swiperWalkinRef.current = swiper)}
                modules={[Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                pagination={{ clickable: true, dynamicBullets: true }}
                autoplay={{ delay: 5000, disableOnInteraction: false }}
                breakpoints={{
                  640: { slidesPerView: 1 },
                  768: { slidesPerView: 2 },
                  1024: { slidesPerView: 3 },
                }}
                className="pb-14"
              >
                <SwiperSlide>
                  <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 h-full hover:scale-[1.03] transition-transform duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                      <Store className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">1. Visit Our Shop</h3>
                    <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                      Walk into any of our Ibadan locations. Hand over your clothes and get a receipt in seconds.
                    </p>
                    <div
                      className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1578575437130-527eed3abbec?q=80&w=400&auto=format&fit=crop')` }}
                    />
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-white/10 h-full hover:scale-[1.03] transition-transform duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                      <Layers className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">2. We Take Over</h3>
                    <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                      Your items enter our system and get processed by our team. You can track progress from your phone if you want.
                    </p>
                    <div
                      className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=400&auto=format&fit=crop')` }}
                    />
                  </div>
                </SwiperSlide>
                <SwiperSlide>
                  <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 h-full hover:scale-[1.03] transition-transform duration-300">
                    <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">3. Ready for Collection</h3>
                    <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed mb-4">
                      We send an alert when your order is complete. Swing by and pick up your fresh, crisp laundry, or we can deliver for a small fee.
                    </p>
                    <div
                      className="w-full h-36 bg-cover bg-center rounded-xl opacity-80"
                      style={{ backgroundImage: `url('https://images.unsplash.com/photo-1479064555552-3ef4979f8908?q=80&w=400&auto=format&fit=crop')` }}
                    />
                  </div>
                </SwiperSlide>
              </Swiper>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 03: SERVICES ACCORDION */}
      <section id="services" className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            What we do best
          </h2>
          <p className="text-slate-blue dark:text-platinum">
            Tap any service to see how we handle your clothes. You will see the full price only after you choose exactly what you need.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
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
                    <span className={isActive ? "text-gold-polished dark:text-gold-metallic" : ""}>
                      {service.title}
                    </span>
                    <ChevronDown
                      className={`w-5 h-5 transition-transform duration-300 ${
                        isActive ? "rotate-180 text-gold-polished dark:text-gold-metallic" : ""
                      }`}
                    />
                  </button>

                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
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

          <div className="lg:col-span-5 hidden lg:block sticky top-28">
            <div className="w-full aspect-square border border-navy-deep/10 dark:border-white/10 rounded-3xl overflow-hidden shadow-2xl relative bg-navy-deep">
              <motion.div
                key={openAccordion ?? "empty"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
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
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 04: WHY CHOOSE US */}
      <section
        id="why-tt"
        className="w-full py-24 bg-gradient-to-b from-transparent to-navy-deep/5 dark:to-navy-deep/40 px-4 sm:px-6 lg:px-8"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Why people trust us
            </h2>
            <p className="text-slate-blue dark:text-platinum">
              We do not cut corners. Here is what makes our service different from ordinary laundries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="liquid-glass-light dark:liquid-glass-dark p-8 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 hover:border-gold-polished/50 dark:hover:border-gold-metallic/50 transition-colors duration-300">
              <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Safe for every fabric</h3>
              <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed">
                Before we clean, we inspect each garment closely. That way we use the right method for delicate lace, thick denim, or traditional aso oke. Your clothes stay in perfect shape.
              </p>
            </div>

            <div className="liquid-glass-light dark:liquid-glass-dark p-8 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 hover:border-gold-polished/50 dark:hover:border-gold-metallic/50 transition-colors duration-300">
              <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                <HeartPulse className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">No hidden fees</h3>
              <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed">
                You see exactly what you will pay before you confirm. No surprise charges, no confusing price lists. Just honest, upfront costs.
              </p>
            </div>

            <div className="liquid-glass-light dark:liquid-glass-dark p-8 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 hover:border-gold-polished/50 dark:hover:border-gold-metallic/50 transition-colors duration-300">
              <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Skilled hands, not machines only</h3>
              <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed">
                We don’t rely on push‑button washing. Our team understands fabrics. They decide the best wash cycle, the right temperature, and whether an item needs hand treatment.
              </p>
            </div>

            <div className="liquid-glass-light dark:liquid-glass-dark p-8 rounded-2xl border border-navy-deep/10 dark:border-gold-metallic/15 hover:border-gold-polished/50 dark:hover:border-gold-metallic/50 transition-colors duration-300">
              <div className="w-12 h-12 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic mb-6">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold mb-3">Personal preferences saved</h3>
              <p className="text-sm text-slate-blue dark:text-platinum leading-relaxed">
                Like a light starch? Prefer a particular folding style? Tell us once and we’ll remember. Every order will match your taste automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 05: COVERAGE AREAS */}
      <section
        id="coverage"
        className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              We are in Ibadan <br /> and growing fast
            </h2>
            <p className="text-slate-blue dark:text-platinum mb-8 leading-relaxed">
              We currently serve these neighbourhoods. Type yours to see if we are already there, or if you will be among the first when we expand.
            </p>

            <form onSubmit={handleZoneValidation} className="w-full flex gap-2 mb-6">
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
                <span className="font-semibold">Active pickup zones</span>
                <span className="px-2.5 py-1 text-[10px] font-bold uppercase bg-green-500/10 text-green-500 rounded-full tracking-widest">
                  Live
                </span>
              </div>
              <div className="pl-4 text-xs text-slate-blue dark:text-platinum space-y-1.5 opacity-80">
                <p>• Bodija – full delivery &amp; pickup</p>
                <p>• Jericho – shop + pickup service</p>
                <p>• Oluyole – pickup available</p>
                <p>• Akobo – pickup available</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 w-full aspect-[4/3] rounded-3xl overflow-hidden shadow-2xl relative border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark p-4 flex items-center justify-center">
            <div className="absolute inset-0 opacity-40 dark:opacity-20 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:16px_16px]" />
            <div className="relative text-center max-w-sm p-6 rounded-2xl border border-gold-metallic/20 bg-canvas-light/50 dark:bg-canvas-dark/50 shadow-md">
              <MapPin className="w-10 h-10 mx-auto text-gold-polished dark:text-gold-metallic mb-4 animate-bounce" />
              <h4 className="text-base font-bold mb-2">Map preview</h4>
              <p className="text-xs text-slate-blue dark:text-platinum leading-relaxed">
                Our full interactive map will show exact neighbourhoods where our vans operate. Coming soon to this space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 06: CALL TO ACTION */}
      <section
        id="scheduler"
        className="w-full py-28 relative overflow-hidden bg-gradient-to-tr from-gold-polished via-gold-metallic to-gold-pastel text-canvas-dark px-4 sm:px-6 lg:px-8 text-center"
      >
        <div className="absolute w-80 h-80 bg-white/20 rounded-full blur-3xl -top-20 -left-20 animate-pulse" />
        <div className="absolute w-80 h-80 bg-navy-deep/10 rounded-full blur-3xl -bottom-20 -right-20" />

        <div className="max-w-4xl mx-auto relative z-10">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-6 text-navy-deep">
            Ready for fresh, clean clothes?
          </h2>
          <p className="text-base sm:text-xl text-navy-deep/80 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">
            Book a pickup or drop off today. No stress, just perfectly washed laundry delivered back to you.
          </p>

          <button className="inline-flex items-center gap-4 px-10 py-5 bg-navy-deep text-white text-sm font-bold tracking-widest uppercase rounded-full shadow-2xl hover:bg-navy-light transform hover:-translate-y-1 hover:shadow-navy-deep/30 transition-all duration-300">
            Start a laundry order
            <ArrowRight className="w-4 h-4 text-gold-metallic" />
          </button>
        </div>
      </section>
    </div>
  );
}
