//app/(admin)/admin/delivery/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import {
  Truck,
  Layers,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Milestone,
  PackageCheck
} from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";

// ✅ Updated interfaces: miles & quantity are strings (range strings from API)
interface DeliverySetup1 {
  id: string;
  miles: string;        // e.g. "1-5"
  pricePerMile: string | number;  // API returns string, but we'll treat as number
}

interface DeliverySetup2 {
  id: string;
  quantity: string;     // e.g. "1-3"
  multiplier: string | number;    // API returns string
}

// Helper to safely format decimal strings/numbers
const formatDecimal = (val: string | number) => Number(val).toFixed(2);

export default function DeliverySetupPage() {
  const [activeTab, setActiveTab] = useState<'setup1' | 'setup2'>('setup1');

  const [setups1, setSetups1] = useState<DeliverySetup1[]>([]);
  const [setups2, setSetups2] = useState<DeliverySetup2[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inline Edit States
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ field1: string; field2: string }>({
    field1: '',
    field2: '',
  });
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Add Modal States
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalType, setModalType] = useState<'setup1' | 'setup2'>('setup1');
  const [newVal1, setNewVal1] = useState<string>('');
  const [newVal2, setNewVal2] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Fetch Delivery Setups
  const fetchSetups = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/delivery");
      if (!res.ok) throw new Error("Failed to fetch delivery matrix settings.");
      const data = await res.json();

      if (data.setup1 && data.setup2) {
        // Normalize: ensure pricePerMile/multiplier are strings (they are from API)
        setSetups1(data.setup1);
        setSetups2(data.setup2);
      } else if (Array.isArray(data)) {
        if (activeTab === 'setup1') setSetups1(data);
        else setSetups2(data);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred while fetching delivery setups.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSetups();
  }, []);

  // Handle Inline Edit Start
  const startEditing = (id: string, f1: string, f2: string) => {
    setEditingId(id);
    setEditValues({ field1: f1, field2: String(f2) }); // ensure string
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ field1: '', field2: '' });
  };

  // Submit Inline Edit (PUT)
  const handleSaveInlineEdit = async (id: string, type: 'setup1' | 'setup2') => {
    if (editValues.field1 === '' || editValues.field2 === '') return;

    try {
      setSavingEdit(true);
      const payload = type === 'setup1'
        ? { type: 'setup1', miles: editValues.field1, pricePerMile: Number(editValues.field2) }
        : { type: 'setup2', quantity: editValues.field1, multiplier: Number(editValues.field2) };

      const res = await fetch(`/api/delivery/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update record.');

      // Optimistic state update
      if (type === 'setup1') {
        setSetups1((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, miles: editValues.field1, pricePerMile: editValues.field2 }
              : item
          )
        );
      } else {
        setSetups2((prev) =>
          prev.map((item) =>
            item.id === id
              ? { ...item, quantity: editValues.field1, multiplier: editValues.field2 }
              : item
          )
        );
      }

      cancelEditing();
    } catch (err: any) {
      alert(err.message || 'Error updating record');
    } finally {
      setSavingEdit(false);
    }
  };

  // Submit Delete Request
  const handleDelete = async (id: string, type: 'setup1' | 'setup2') => {
    if (!confirm(`Are you sure you want to delete this entry?`)) return;

    try {
      const res = await fetch(`/api/delivery/${id}?type=${type}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete record.');

      if (type === 'setup1') {
        setSetups1((prev) => prev.filter((item) => item.id !== id));
      } else {
        setSetups2((prev) => prev.filter((item) => item.id !== id));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete');
    }
  };

  // Submit Create New Record (POST)
  const handleCreateSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newVal1 === '' || newVal2 === '') {
      setActionError('Please fill in all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);

      const payload = modalType === 'setup1'
        ? { type: 'setup1', miles: newVal1, pricePerMile: Number(newVal2) }
        : { type: 'setup2', quantity: newVal1, multiplier: Number(newVal2) };

      const res = await fetch('/api/delivery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create entry.');

      resetModalForm();
      setIsModalOpen(false);
      fetchSetups();
    } catch (err: any) {
      setActionError(err.message || 'Execution error');
    } finally {
      setSubmitting(false);
    }
  };

  const resetModalForm = () => {
    setNewVal1('');
    setNewVal2('');
    setActionError(null);
  };

  const openAddModal = (type: 'setup1' | 'setup2') => {
    setModalType(type);
    resetModalForm();
    setIsModalOpen(true);
  };

  return (
    <div className="w-full pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            Delivery{" "}
            <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
              Setups
            </span>
          </h1>
          <p className="text-slate-blue dark:text-platinum text-sm max-w-xl">
            Configure logistics matrices for distance-based mileage tiers and volume multipliers.
          </p>
        </div>

        <button
          onClick={() => openAddModal(activeTab)}
          className="px-6 py-3.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-gold-metallic/20 transform hover:-translate-y-0.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add {activeTab === 'setup1' ? 'Miles Tier' : 'Quantity Matrix'}
        </button>
      </div>

      {/* Navigation Tab Pills */}
      <div className="flex items-center gap-3 mb-8 border-b border-navy-deep/10 dark:border-white/10 pb-4">
        <button
          onClick={() => {
            setActiveTab('setup1');
            cancelEditing();
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'setup1'
              ? 'bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark shadow-md'
              : 'liquid-glass-light dark:liquid-glass-dark text-slate-blue dark:text-platinum hover:bg-gold-metallic/5'
          }`}
        >
          <Milestone className="w-4 h-4" /> Setup 1: Miles Pricing ({setups1.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('setup2');
            cancelEditing();
          }}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
            activeTab === 'setup2'
              ? 'bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark shadow-md'
              : 'liquid-glass-light dark:liquid-glass-dark text-slate-blue dark:text-platinum hover:bg-gold-metallic/5'
          }`}
        >
          <PackageCheck className="w-4 h-4" /> Setup 2: Quantity Multiplier ({setups2.length})
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
                Fetching delivery configurations...
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
                <h3 className="text-base font-bold mb-1">Failed to load setups</h3>
                <p className="text-xs text-slate-blue dark:text-platinum mb-4 opacity-80">{error}</p>
                <button
                  onClick={fetchSetups}
                  className="px-5 py-2 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  Retry Query
                </button>
              </div>
            </motion.div>
          ) : (activeTab === 'setup1' ? setups1.length === 0 : setups2.length === 0) ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center liquid-glass-light dark:liquid-glass-dark rounded-3xl border border-dashed border-navy-deep/10 dark:border-white/10 p-12"
            >
              <Truck className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-bold mb-1 text-navy-deep dark:text-alabaster">
                No Delivery Rules Configured
              </h3>
              <p className="text-xs text-slate-blue dark:text-platinum max-w-sm mx-auto opacity-70 mb-6">
                {activeTab === 'setup1'
                  ? "You haven't defined any mileage pricing tiers yet."
                  : "You haven't configured any quantity multipliers yet."}
              </p>
              <button
                onClick={() => openAddModal(activeTab)}
                className="px-6 py-3 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Add First Entry
              </button>
            </motion.div>
          ) : (
            <div className="w-full space-y-8">
              {/* DESKTOP DATA TABLE (Visible md and up) */}
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:block w-full overflow-hidden rounded-3xl border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark shadow-2xl"
              >
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[650px]">
                    <thead>
                      <tr className="border-b border-navy-deep/10 dark:border-white/10 bg-navy-deep/[2%] dark:bg-white/[2%]">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {activeTab === 'setup1' ? 'Miles Distance' : 'Quantity threshold'}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {activeTab === 'setup1' ? 'Price Per Mile' : 'Multiplier Rate'}
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTab === 'setup1'
                        ? setups1.map((item, idx) => {
                            const isEditing = editingId === item.id;
                            return (
                              <motion.tr
                                key={item.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="border-b border-navy-deep/5 dark:border-white/5 last:border-0 hover:bg-navy-deep/[1%] dark:hover:bg-white/[1%] transition-colors"
                              >
                                <td className="px-6 py-4 text-xs font-mono font-semibold text-navy-deep dark:text-alabaster">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editValues.field1}
                                      onChange={(e) => setEditValues({ ...editValues, field1: e.target.value })}
                                      className="px-3 py-1.5 rounded-lg border border-gold-polished/50 bg-white/80 dark:bg-navy-deep/80 text-xs w-32 focus:outline-none"
                                    />
                                  ) : (
                                    `${item.miles} miles`
                                  )}
                                </td>

                                <td className="px-6 py-4 text-xs font-mono text-slate-blue dark:text-platinum">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="any"
                                      value={editValues.field2}
                                      onChange={(e) => setEditValues({ ...editValues, field2: e.target.value })}
                                      className="px-3 py-1.5 rounded-lg border border-gold-polished/50 bg-white/80 dark:bg-navy-deep/80 text-xs w-32 focus:outline-none"
                                    />
                                  ) : (
                                    `$${formatDecimal(item.pricePerMile)} / mile`
                                  )}
                                </td>

                                <td className="px-6 py-4 text-right">
                                  {isEditing ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleSaveInlineEdit(item.id, 'setup1')}
                                        disabled={savingEdit}
                                        className="p-2 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-all"
                                        title="Save Changes"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={cancelEditing}
                                        className="p-2 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-all"
                                        title="Cancel"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => startEditing(item.id, item.miles, String(item.pricePerMile))}
                                        className="p-2 rounded-xl text-slate-blue dark:text-platinum hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-colors"
                                        title="Edit Entry"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(item.id, 'setup1')}
                                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                        title="Delete Entry"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </motion.tr>
                            );
                          })
                        : setups2.map((item, idx) => {
                            const isEditing = editingId === item.id;
                            return (
                              <motion.tr
                                key={item.id}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.02 }}
                                className="border-b border-navy-deep/5 dark:border-white/5 last:border-0 hover:bg-navy-deep/[1%] dark:hover:bg-white/[1%] transition-colors"
                              >
                                <td className="px-6 py-4 text-xs font-mono font-semibold text-navy-deep dark:text-alabaster">
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editValues.field1}
                                      onChange={(e) => setEditValues({ ...editValues, field1: e.target.value })}
                                      className="px-3 py-1.5 rounded-lg border border-gold-polished/50 bg-white/80 dark:bg-navy-deep/80 text-xs w-32 focus:outline-none"
                                    />
                                  ) : (
                                    `${item.quantity} items`
                                  )}
                                </td>

                                <td className="px-6 py-4 text-xs font-mono text-slate-blue dark:text-platinum">
                                  {isEditing ? (
                                    <input
                                      type="number"
                                      step="any"
                                      value={editValues.field2}
                                      onChange={(e) => setEditValues({ ...editValues, field2: e.target.value })}
                                      className="px-3 py-1.5 rounded-lg border border-gold-polished/50 bg-white/80 dark:bg-navy-deep/80 text-xs w-32 focus:outline-none"
                                    />
                                  ) : (
                                    `${item.multiplier}x Multiplier`
                                  )}
                                </td>

                                <td className="px-6 py-4 text-right">
                                  {isEditing ? (
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => handleSaveInlineEdit(item.id, 'setup2')}
                                        disabled={savingEdit}
                                        className="p-2 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-all"
                                        title="Save Changes"
                                      >
                                        <Check className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={cancelEditing}
                                        className="p-2 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-all"
                                        title="Cancel"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-end gap-2">
                                      <button
                                        onClick={() => startEditing(item.id, item.quantity, String(item.multiplier))}
                                        className="p-2 rounded-xl text-slate-blue dark:text-platinum hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-colors"
                                        title="Edit Entry"
                                      >
                                        <Edit3 className="w-4 h-4" />
                                      </button>
                                      <button
                                        onClick={() => handleDelete(item.id, 'setup2')}
                                        className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                        title="Delete Entry"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </motion.tr>
                            );
                          })}
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
                  {activeTab === 'setup1'
                    ? setups1.map((item) => (
                        <SwiperSlide key={item.id}>
                          <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-3xl border border-navy-deep/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[180px] shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-mono font-bold uppercase text-gold-polished dark:text-gold-metallic">
                                Tier Miles
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => startEditing(item.id, item.miles, String(item.pricePerMile))}
                                  className="p-2 rounded-xl text-slate-blue dark:text-platinum border border-navy-deep/10 dark:border-white/10"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id, 'setup1')}
                                  className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 border border-red-500/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xl font-black text-navy-deep dark:text-alabaster font-mono">
                                {item.miles} miles
                              </p>
                              <p className="text-xs text-slate-blue dark:text-platinum font-mono">
                                Price: ${formatDecimal(item.pricePerMile)} / mile
                              </p>
                            </div>
                          </div>
                        </SwiperSlide>
                      ))
                    : setups2.map((item) => (
                        <SwiperSlide key={item.id}>
                          <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-3xl border border-navy-deep/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[180px] shadow-lg">
                            <div className="flex items-center justify-between mb-4">
                              <span className="text-xs font-mono font-bold uppercase text-gold-polished dark:text-gold-metallic">
                                Quantity Threshold
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => startEditing(item.id, item.quantity, String(item.multiplier))}
                                  className="p-2 rounded-xl text-slate-blue dark:text-platinum border border-navy-deep/10 dark:border-white/10"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDelete(item.id, 'setup2')}
                                  className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 border border-red-500/20"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <p className="text-xl font-black text-navy-deep dark:text-alabaster font-mono">
                                {item.quantity} units
                              </p>
                              <p className="text-xs text-slate-blue dark:text-platinum font-mono">
                                Multiplier: {item.multiplier}x
                              </p>
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

      {/* CREATE SETUP ENTRY MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-navy-deep/60 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg rounded-3xl border border-navy-deep/10 dark:border-white/10 bg-white dark:bg-canvas-dark p-6 sm:p-8 shadow-2xl z-10 overflow-hidden"
            >
              <div className="flex items-center justify-between pb-4 border-b border-navy-deep/10 dark:border-white/10 mb-6">
                <h3 className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                  <Truck className="w-5 h-5 text-gold-polished" />
                  Add {modalType === 'setup1' ? 'Setup 1 (Miles)' : 'Setup 2 (Quantity)'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSetup} className="space-y-4">
                {modalType === 'setup1' ? (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Distance (Miles)
                      </label>
                      <input
                        type="text"
                        value={newVal1}
                        onChange={(e) => setNewVal1(e.target.value)}
                        placeholder="e.g. 10 or 1-5"
                        className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Price Per Mile ($)
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={newVal2}
                        onChange={(e) => setNewVal2(e.target.value)}
                        placeholder="e.g. 2.50"
                        className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                        required
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Quantity Threshold
                      </label>
                      <input
                        type="text"
                        value={newVal1}
                        onChange={(e) => setNewVal1(e.target.value)}
                        placeholder="e.g. 5 or 1-3"
                        className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                        Multiplier Rate
                      </label>
                      <input
                        type="number"
                        step="any"
                        value={newVal2}
                        onChange={(e) => setNewVal2(e.target.value)}
                        placeholder="e.g. 1.25"
                        className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                        required
                      />
                    </div>
                  </>
                )}

                {actionError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {actionError}
                  </div>
                )}

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
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                  >
                    {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}