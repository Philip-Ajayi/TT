"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

export default function HomePage() {
  const [activeRoute, setActiveRoute] = useState<"valet" | "walkin">("valet");
  const [openAccordion, setOpenAccordion] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const activeZones = ["bodija", "jericho", "oluyole", "akobo"];

  const handleZoneValidation = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;
    setSearchFeedback(
      activeZones.includes(query)
        ? `✅ ${searchQuery} is active`
        : `⏳ ${searchQuery} coming soon`
    );
  };

  const servicesData = [
    { title: "Washing", desc: "Gentle deep cleaning for all fabrics." },
    { title: "Ironing", desc: "Crisp, neat finishing every time." },
    { title: "Stain Removal", desc: "Targeted treatment for stubborn marks." },
    { title: "Starching", desc: "Custom crispness for any outfit." },
  ];

  return (
    <div className="w-full pt-20">
      {/* HERO */}
      <section className="relative w-full min-h-[80vh] flex items-center px-4 sm:px-6 lg:px-8 py-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
          <div className="lg:col-span-7">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] mb-6">
              Laundry Done Right
            </h1>
            <p className="text-base sm:text-lg max-w-xl mb-8">
              Pickup, clean, return—simple and stress-free.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <button className="px-8 py-4 rounded-xl font-bold uppercase flex items-center gap-3 bg-black dark:bg-white text-white dark:text-black">
                Schedule <ArrowRight className="w-4 h-4" />
              </button>
              <button className="px-8 py-4 rounded-xl font-bold uppercase border">
                Services
              </button>
            </div>
          </div>
          <div className="lg:col-span-5">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-3xl" />
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 border-y">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How It Works</h2>
            <div className="inline-flex p-1 rounded-full border">
              <button
                onClick={() => setActiveRoute("valet")}
                className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase flex items-center gap-2 ${
                  activeRoute === "valet" ? "bg-black dark:bg-white text-white dark:text-black" : ""
                }`}
              >
                <Truck className="w-3.5 h-3.5" /> Valet
              </button>
              <button
                onClick={() => setActiveRoute("walkin")}
                className={`px-6 py-2.5 rounded-full text-xs font-bold uppercase flex items-center gap-2 ${
                  activeRoute === "walkin" ? "bg-black dark:bg-white text-white dark:text-black" : ""
                }`}
              >
                <Store className="w-3.5 h-3.5" /> Walk-in
              </button>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeRoute}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Swiper
                modules={[Pagination, Autoplay]}
                spaceBetween={30}
                slidesPerView={1}
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000 }}
                breakpoints={{ 640: { slidesPerView: 1.5 }, 1024: { slidesPerView: 3 } }}
                className="pb-14"
              >
                {activeRoute === "valet" ? (
                  <>
                    <SwiperSlide>
                      <div className="p-6 border rounded-2xl">
                        <MapPin className="w-8 h-8 mb-4" />
                        <h3 className="font-bold mb-2">1. Request</h3>
                        <p className="text-sm">Tell us when & where.</p>
                      </div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="p-6 border rounded-2xl">
                        <ShieldCheck className="w-8 h-8 mb-4" />
                        <h3 className="font-bold mb-2">2. Collect</h3>
                        <p className="text-sm">We pick up your laundry.</p>
                      </div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="p-6 border rounded-2xl">
                        <ArrowRight className="w-8 h-8 mb-4" />
                        <h3 className="font-bold mb-2">3. Deliver</h3>
                        <p className="text-sm">Fresh clothes returned.</p>
                      </div>
                    </SwiperSlide>
                  </>
                ) : (
                  <>
                    <SwiperSlide>
                      <div className="p-6 border rounded-2xl">
                        <Store className="w-8 h-8 mb-4" />
                        <h3 className="font-bold mb-2">1. Drop Off</h3>
                        <p className="text-sm">Visit our store.</p>
                      </div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="p-6 border rounded-2xl">
                        <Layers className="w-8 h-8 mb-4" />
                        <h3 className="font-bold mb-2">2. Process</h3>
                        <p className="text-sm">We clean & press.</p>
                      </div>
                    </SwiperSlide>
                    <SwiperSlide>
                      <div className="p-6 border rounded-2xl">
                        <ArrowRight className="w-8 h-8 mb-4" />
                        <h3 className="font-bold mb-2">3. Collect</h3>
                        <p className="text-sm">Pick up or delivery.</p>
                      </div>
                    </SwiperSlide>
                  </>
                )}
              </Swiper>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* SERVICES */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">What We Offer</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7 flex flex-col gap-4">
            {servicesData.map((service, index) => {
              const isActive = openAccordion === index;
              return (
                <div key={index} className={`border rounded-2xl overflow-hidden ${isActive ? "shadow-lg" : ""}`}>
                  <button
                    onClick={() => setOpenAccordion(isActive ? null : index)}
                    className="w-full p-6 text-left flex items-center justify-between font-bold"
                  >
                    <span>{service.title}</span>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isActive ? "rotate-180" : ""}`} />
                  </button>
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: isActive ? "auto" : 0, opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <div className="p-6 pt-0 text-sm">{service.desc}</div>
                  </motion.div>
                </div>
              );
            })}
          </div>
          <div className="lg:col-span-5 hidden lg:block">
            <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-3xl" />
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why Choose Us</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 sm:p-8 border rounded-2xl min-h-[180px]">
              <ShieldCheck className="w-8 h-8 mb-4" />
              <h3 className="font-bold mb-2">Fabric Safety</h3>
              <p className="text-sm">Gentle care for every fabric type.</p>
            </div>
            <div className="p-6 sm:p-8 border rounded-2xl min-h-[180px]">
              <HeartPulse className="w-8 h-8 mb-4" />
              <h3 className="font-bold mb-2">No Surprises</h3>
              <p className="text-sm">Transparent pricing, always.</p>
            </div>
            <div className="p-6 sm:p-8 border rounded-2xl min-h-[180px]">
              <Layers className="w-8 h-8 mb-4" />
              <h3 className="font-bold mb-2">Skilled Hands</h3>
              <p className="text-sm">Expert care for your clothes.</p>
            </div>
            <div className="p-6 sm:p-8 border rounded-2xl min-h-[180px]">
              <HelpCircle className="w-8 h-8 mb-4" />
              <h3 className="font-bold mb-2">Personalized</h3>
              <p className="text-sm">We remember your preferences.</p>
            </div>
          </div>
        </div>
      </section>

      {/* COVERAGE */}
      <section className="w-full py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Coverage</h2>
            <p className="mb-8">Check if we're in your area.</p>

            <form onSubmit={handleZoneValidation} className="flex gap-2 mb-6">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter your area"
                className="flex-1 px-4 py-3 border rounded-xl text-sm"
              />
              <button type="submit" className="px-5 py-3 bg-black dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase">
                Check
              </button>
            </form>

            {searchFeedback && (
              <div className="p-3 border rounded-lg text-sm mb-6">{searchFeedback}</div>
            )}

            <div className="p-4 border rounded-xl">
              <span className="font-semibold">Active Zones</span>
              <div className="mt-2 text-sm space-y-1">
                <p>• Bodija</p>
                <p>• Jericho</p>
                <p>• Oluyole</p>
                <p>• Akobo</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="aspect-[4/3] bg-gray-200 dark:bg-gray-700 rounded-3xl border flex items-center justify-center">
              <MapPin className="w-10 h-10" />
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full py-28 px-4 sm:px-6 lg:px-8 text-center bg-black dark:bg-white text-white dark:text-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl sm:text-5xl font-black mb-6">Get Started</h2>
          <p className="text-base sm:text-xl max-w-2xl mx-auto mb-10">Book your first pickup now.</p>
          <button className="inline-flex items-center gap-4 px-10 py-5 bg-white dark:bg-black text-black dark:text-white rounded-full font-bold uppercase">
            Book Now <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>
    </div>
  );
}
