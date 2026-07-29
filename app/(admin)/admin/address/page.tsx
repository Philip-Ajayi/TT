//app/(admin)/admin/address/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { 
  MapPin, 
  Search, 
  Plus, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  AlertCircle, 
  Globe, 
  Compass, 
  X,
  Building,
  Power
} from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";

interface CompanyAddress {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  isActive: boolean;
  createdAt: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export default function CompanyAddressesPage() {
  const [addresses, setAddresses] = useState<CompanyAddress[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Add Address Modal & Nominatim States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [nominatimResults, setNominatimResults] = useState<NominatimResult[]>([]);
  const [searchingLocation, setSearchingLocation] = useState<boolean>(false);
  
  // Form State
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [latitude, setLatitude] = useState<number | "">("");
  const [longitude, setLongitude] = useState<number | "">("");
  const [isActive, setIsActive] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch addresses
  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/address");
      if (!res.ok) throw new Error("Failed to fetch addresses.");
      const data = await res.json();
      setAddresses(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Frontend Lookup using OpenStreetMap Nominatim API
  const handleNominatimSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setSearchingLocation(true);
      setActionError(null);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery
        )}`
      );
      if (!res.ok) throw new Error("Location lookup failed.");
      const data: NominatimResult[] = await res.json();
      setNominatimResults(data);
      if (data.length === 0) {
        setActionError("No locations found for this query.");
      }
    } catch (err: any) {
      setActionError("Error connecting to OpenStreetMap service.");
    } finally {
      setSearchingLocation(false);
    }
  };

  const selectNominatimResult = (item: NominatimResult) => {
    setSelectedAddress(item.display_name);
    setLatitude(parseFloat(item.lat));
    setLongitude(parseFloat(item.lon));
    setNominatimResults([]);
  };

  // Submit new address to API
  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAddress || latitude === "" || longitude === "") {
      setActionError("Please select a location with valid coordinates.");
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);

      const res = await fetch("/api/address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: selectedAddress,
          latitude: Number(latitude),
          longitude: Number(longitude),
          isActive,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to add address.");
      }

      resetForm();
      setIsModalOpen(false);
      fetchAddresses();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle Active/Inactive Status
  const handleToggleActive = async (targetAddress: CompanyAddress) => {
    const newActiveState = !targetAddress.isActive;

    try {
      // Optimistic Update
      setAddresses((prev) =>
        prev.map((addr) => {
          if (addr.id === targetAddress.id) {
            return { ...addr, isActive: newActiveState };
          }
          // If making this address active, set others to inactive
          if (newActiveState) {
            return { ...addr, isActive: false };
          }
          return addr;
        })
      );

      const res = await fetch(`/api/address/${targetAddress.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActiveState }),
      });

      if (!res.ok) {
        // Revert on error
        fetchAddresses();
      }
    } catch (err) {
      fetchAddresses();
    }
  };

  // Delete address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this company address?")) return;

    try {
      const res = await fetch(`/api/address/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete address.");
      }

      setAddresses((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete.");
    }
  };

  const resetForm = () => {
    setSearchQuery("");
    setNominatimResults([]);
    setSelectedAddress("");
    setLatitude("");
    setLongitude("");
    setIsActive(true);
    setActionError(null);
  };

  return (
    <div className="w-full pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            Company{" "}
            <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
              Addresses
            </span>
          </h1>
          <p className="text-slate-blue dark:text-platinum text-sm max-w-xl">
            Manage your physical company locations, operational hubs, and toggle active status.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-6 py-3.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-gold-metallic/20 transform hover:-translate-y-0.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Location
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full">
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-24 flex items-center justify-center flex-col gap-3"
            >
              <RefreshCw className="w-8 h-8 text-gold-polished dark:text-gold-metallic animate-spin" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Fetching locations...
              </p>
            </motion.div>
          ) : error ? (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 flex justify-center text-center max-w-md mx-auto"
            >
              <div className="liquid-glass-light dark:liquid-glass-dark border border-red-500/30 p-8 rounded-3xl shadow-xl w-full">
                <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
                <h3 className="text-base font-bold mb-1">Failed to load addresses</h3>
                <p className="text-xs text-slate-blue dark:text-platinum mb-4 opacity-80">{error}</p>
                <button
                  onClick={fetchAddresses}
                  className="px-5 py-2 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  Retry Query
                </button>
              </div>
            </motion.div>
          ) : addresses.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center liquid-glass-light dark:liquid-glass-dark rounded-3xl border border-dashed border-navy-deep/10 dark:border-white/10 p-12"
            >
              <Building className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-bold mb-1 text-navy-deep dark:text-alabaster">
                No Addresses Configured
              </h3>
              <p className="text-xs text-slate-blue dark:text-platinum max-w-sm mx-auto opacity-70 mb-6">
                You haven't added any company locations yet. Add one using the OpenStreetMap lookup tool.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Add First Address
              </button>
            </motion.div>
          ) : (
            <div className="w-full space-y-8">
              
              {/* DESKTOP DATA TABLE (Visible md and up) */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:block w-full overflow-hidden rounded-3xl border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark shadow-2xl"
              >
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="border-b border-navy-deep/10 dark:border-white/10 bg-navy-deep/[2%] dark:bg-white/[2%]">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Status</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Address</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Coordinates</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Created</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {addresses.map((item, idx) => (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.03 }}
                          className="border-b border-navy-deep/5 dark:border-white/5 last:border-0 hover:bg-navy-deep/[1%] dark:hover:bg-white/[1%] transition-colors"
                        >
                          {/* Toggleable Status Badge */}
                          <td className="px-6 py-4">
                            <button
                              onClick={() => handleToggleActive(item)}
                              title="Click to toggle status"
                              className="group flex items-center focus:outline-none"
                            >
                              {item.isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20 group-hover:bg-green-500/20 transition-all">
                                  <CheckCircle className="w-3.5 h-3.5" /> Active Hub
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20 group-hover:bg-slate-500/20 transition-all">
                                  <XCircle className="w-3.5 h-3.5" /> Inactive
                                </span>
                              )}
                            </button>
                          </td>

                          <td className="px-6 py-4 text-xs font-semibold text-navy-deep dark:text-alabaster max-w-xs truncate">
                            {item.address}
                          </td>

                          <td className="px-6 py-4 text-xs font-mono text-slate-blue dark:text-platinum">
                            <span className="flex items-center gap-1">
                              <Compass className="w-3.5 h-3.5 text-gold-polished shrink-0" />
                              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                            </span>
                          </td>

                          <td className="px-6 py-4 text-xs text-slate-blue dark:text-platinum">
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </td>

                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Power Button for Status Toggle */}
                              <button
                                onClick={() => handleToggleActive(item)}
                                className={`p-2 rounded-xl border transition-all ${
                                  item.isActive
                                    ? "border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20"
                                    : "border-slate-500/20 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20"
                                }`}
                                title={item.isActive ? "Deactivate Address" : "Set as Active Address"}
                              >
                                <Power className="w-4 h-4" />
                              </button>

                              {/* Delete Button */}
                              <button
                                onClick={() => handleDeleteAddress(item.id)}
                                className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                title="Delete Address"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* MOBILE SWIPER CAROUSEL (Visible on smaller screens) */}
              <div className="block md:hidden w-full">
                <Swiper
                  modules={[Pagination]}
                  spaceBetween={16}
                  slidesPerView={1.1}
                  centeredSlides={false}
                  pagination={{ clickable: true, dynamicBullets: true }}
                  className="pb-12"
                >
                  {addresses.map((item) => (
                    <SwiperSlide key={item.id}>
                      <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-3xl border border-navy-deep/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[240px] shadow-lg">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            {/* Toggleable Badge */}
                            <button
                              onClick={() => handleToggleActive(item)}
                              className="focus:outline-none"
                            >
                              {item.isActive ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20">
                                  <CheckCircle className="w-3.5 h-3.5" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                  <XCircle className="w-3.5 h-3.5" /> Inactive
                                </span>
                              )}
                            </button>

                            <div className="flex items-center gap-2">
                              {/* Quick Power Toggle */}
                              <button
                                onClick={() => handleToggleActive(item)}
                                className={`p-2 rounded-xl border transition-colors ${
                                  item.isActive
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete Address */}
                              <button
                                onClick={() => handleDeleteAddress(item.id)}
                                className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-start gap-2 mb-4">
                            <MapPin className="w-4 h-4 text-gold-polished shrink-0 mt-0.5" />
                            <p className="text-xs font-semibold text-navy-deep dark:text-alabaster leading-relaxed">
                              {item.address}
                            </p>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-navy-deep/5 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-blue dark:text-platinum">
                          <span>
                            {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                          </span>
                          <span className="text-[10px] font-sans opacity-70">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ADD ADDRESS MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-navy-deep/60 backdrop-blur-md"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-xl rounded-3xl border border-navy-deep/10 dark:border-white/10 bg-white dark:bg-canvas-dark p-6 sm:p-8 shadow-2xl z-10 overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-navy-deep/10 dark:border-white/10 mb-6">
                <h3 className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                  <Globe className="w-5 h-5 text-gold-polished" /> Lookup & Add Address
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-1 space-y-6">
                
                {/* OpenStreetMap Nominatim Lookup */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
                    Search Location (OpenStreetMap)
                  </label>
                  <form onSubmit={handleNominatimSearch} className="flex gap-2">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="e.g. Bodija Market, Ibadan or 12 Commercial Avenue"
                      className="flex-1 px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                    />
                    <button
                      type="submit"
                      disabled={searchingLocation}
                      className="px-5 py-3 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider flex items-center gap-2 disabled:opacity-50"
                    >
                      {searchingLocation ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      Lookup
                    </button>
                  </form>
                </div>

                {/* Nominatim Search Results List */}
                {nominatimResults.length > 0 && (
                  <div className="rounded-2xl border border-gold-polished/30 bg-gold-polished/5 p-3 space-y-2 max-h-48 overflow-y-auto">
                    <p className="text-[10px] font-bold text-gold-polished uppercase tracking-wider">
                      Select matched location:
                    </p>
                    {nominatimResults.map((res) => (
                      <button
                        key={res.place_id}
                        type="button"
                        onClick={() => selectNominatimResult(res)}
                        className="w-full text-left p-2.5 rounded-xl text-xs bg-white/60 dark:bg-canvas-dark/60 hover:bg-gold-polished hover:text-white transition-all duration-200 border border-navy-deep/5 flex items-start gap-2"
                      >
                        <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span className="leading-tight">{res.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Location Form Details */}
                <form id="address-form" onSubmit={handleCreateAddress} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                      Selected Display Address
                    </label>
                    <textarea
                      rows={2}
                      value={selectedAddress}
                      onChange={(e) => setSelectedAddress(e.target.value)}
                      placeholder="Address will populate here after lookup or enter manually..."
                      className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Latitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : "")}
                        placeholder="7.4019"
                        className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Longitude
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : "")}
                        placeholder="3.9173"
                        className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded border-navy-deep/20 text-gold-polished focus:ring-gold-polished"
                    />
                    <label htmlFor="isActive" className="text-xs font-semibold text-navy-deep dark:text-alabaster cursor-pointer">
                      Set as Primary Active Company Address
                    </label>
                  </div>

                  {actionError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {actionError}
                    </div>
                  )}
                </form>
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-navy-deep/10 dark:border-white/10 flex items-center justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-semibold uppercase hover:bg-navy-deep/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="address-form"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Location
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}