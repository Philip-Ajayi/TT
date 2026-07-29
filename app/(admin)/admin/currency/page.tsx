//app/(admin)/admin/currency/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import {
  Coins,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Building,
  DollarSign,
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';

interface Currency {
  id: string;
  code: string;
  multiplier: number;
}

export default function AdminCurrencyPage() {
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal / Add Currency State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newMultiplier, setNewMultiplier] = useState<number | ''>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCode, setEditCode] = useState<string>('');
  const [editMultiplier, setEditMultiplier] = useState<number | ''>('');
  const [updating, setUpdating] = useState<boolean>(false);

  // Fetch all currencies
  const fetchCurrencies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/currency');
      if (!res.ok) throw new Error('Failed to fetch currencies.');
      const data = await res.json();
      setCurrencies(data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrencies();
  }, []);

  // Create new currency
  const handleCreateCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode || newMultiplier === '') {
      setActionError('Please fill in both currency code and multiplier.');
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);

      const res = await fetch('/api/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          multiplier: Number(newMultiplier),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create currency.');
      }

      resetModalForm();
      setIsModalOpen(false);
      fetchCurrencies();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Start inline editing
  const startEditing = (currency: Currency) => {
    setEditingId(currency.id);
    setEditCode(currency.code);
    setEditMultiplier(currency.multiplier);
  };

  // Cancel inline editing
  const cancelEditing = () => {
    setEditingId(null);
    setEditCode('');
    setEditMultiplier('');
  };

  // Save inline edit
  const handleUpdateCurrency = async (id: string) => {
    if (!editCode || editMultiplier === '') {
      alert('Code and Multiplier cannot be empty.');
      return;
    }

    try {
      setUpdating(true);
      const res = await fetch(`/api/currency/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editCode.trim().toUpperCase(),
          multiplier: Number(editMultiplier),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to update currency.');
      }

      // Local state optimistic updates
      setCurrencies((prev) =>
        prev.map((c) =>
          c.id === id
            ? { ...c, code: editCode.trim().toUpperCase(), multiplier: Number(editMultiplier) }
            : c
        )
      );
      cancelEditing();
    } catch (err: any) {
      alert(err.message || 'Failed to update currency.');
    } finally {
      setUpdating(false);
    }
  };

  // Delete currency
  const handleDeleteCurrency = async (id: string) => {
    if (!confirm('Are you sure you want to delete this currency multiplier profile?')) return;

    try {
      const res = await fetch(`/api/currency/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete currency.');
      }

      setCurrencies((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete.');
    }
  };

  const resetModalForm = () => {
    setNewCode('');
    setNewMultiplier('');
    setActionError(null);
  };

  return (
    <div className="w-full pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            Currency{' '}
            <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
              Settings
            </span>
          </h1>
          <p className="text-slate-blue dark:text-platinum text-sm max-w-xl">
            Configure conversion multiplier profiles relative to base exchange values.
          </p>
        </div>

        <button
          onClick={() => {
            resetModalForm();
            setIsModalOpen(true);
          }}
          className="px-6 py-3.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-gold-metallic/20 transform hover:-translate-y-0.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Currency Profile
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
                Fetching currency matrices...
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
                <h3 className="text-base font-bold mb-1">Failed to load currencies</h3>
                <p className="text-xs text-slate-blue dark:text-platinum mb-4 opacity-80">{error}</p>
                <button
                  onClick={fetchCurrencies}
                  className="px-5 py-2 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  Retry Query
                </button>
              </div>
            </motion.div>
          ) : currencies.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center liquid-glass-light dark:liquid-glass-dark rounded-3xl border border-dashed border-navy-deep/10 dark:border-white/10 p-12"
            >
              <Coins className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-bold mb-1 text-navy-deep dark:text-alabaster">
                No Currency Profiles Found
              </h3>
              <p className="text-xs text-slate-blue dark:text-platinum max-w-sm mx-auto opacity-70 mb-6">
                You haven't initialized any operational currency models yet.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Create Base Currency
              </button>
            </motion.div>
          ) : (
            <div className="w-full space-y-8">
              {/* DESKTOP DATA TABLE */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="hidden md:block w-full overflow-hidden rounded-3xl border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark shadow-2xl"
              >
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-navy-deep/10 dark:border-white/10 bg-navy-deep/[2%] dark:bg-white/[2%]">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Currency Code
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Multiplier Ratio
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Type Benchmark
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {currencies.map((item, idx) => {
                        const isEditing = editingId === item.id;
                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-b border-navy-deep/5 dark:border-white/5 last:border-0 hover:bg-navy-deep/[1%] dark:hover:bg-white/[1%] transition-colors"
                          >
                            {/* Code Column */}
                            <td className="px-6 py-4 text-xs font-mono font-bold text-navy-deep dark:text-alabaster">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editCode}
                                  onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                  className="w-24 px-3 py-1.5 rounded-lg border border-gold-polished bg-white dark:bg-navy-deep text-xs font-mono uppercase focus:outline-none"
                                />
                              ) : (
                                <span className="inline-flex items-center gap-2">
                                  <Coins className="w-3.5 h-3.5 text-gold-polished shrink-0" />
                                  {item.code}
                                </span>
                              )}
                            </td>

                            {/* Multiplier Column */}
                            <td className="px-6 py-4 text-xs font-mono text-slate-blue dark:text-platinum">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="any"
                                  value={editMultiplier}
                                  onChange={(e) =>
                                    setEditMultiplier(
                                      e.target.value ? parseFloat(e.target.value) : ''
                                    )
                                  }
                                  className="w-28 px-3 py-1.5 rounded-lg border border-gold-polished bg-white dark:bg-navy-deep text-xs font-mono focus:outline-none"
                                />
                              ) : (
                                <span>{item.multiplier}x</span>
                              )}
                            </td>

                            {/* Base Indicator Column */}
                            <td className="px-6 py-4 text-xs">
                              {item.multiplier === 1 ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-gold-polished/10 text-gold-polished border border-gold-polished/20">
                                  Base Currency
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                  Secondary Multiplier
                                </span>
                              )}
                            </td>

                            {/* Actions Column */}
                            <td className="px-6 py-4 text-right">
                              {isEditing ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleUpdateCurrency(item.id)}
                                    disabled={updating}
                                    className="p-2 rounded-xl border border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all disabled:opacity-50"
                                    title="Save Changes"
                                  >
                                    <Check className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="p-2 rounded-xl border border-slate-500/20 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-all"
                                    title="Cancel Edit"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => startEditing(item)}
                                    className="p-2 rounded-xl text-slate-blue dark:text-platinum hover:bg-gold-polished/10 hover:text-gold-polished transition-colors"
                                    title="Edit Inline"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteCurrency(item.id)}
                                    className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                    title="Delete Currency"
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

              {/* MOBILE SWIPER CAROUSEL */}
              <div className="block md:hidden w-full">
                <Swiper
                  modules={[Pagination]}
                  spaceBetween={16}
                  slidesPerView={1.1}
                  centeredSlides={false}
                  pagination={{ clickable: true, dynamicBullets: true }}
                  className="pb-12"
                >
                  {currencies.map((item) => {
                    const isEditing = editingId === item.id;
                    return (
                      <SwiperSlide key={item.id}>
                        <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-3xl border border-navy-deep/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[220px] shadow-lg">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              {item.multiplier === 1 ? (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-gold-polished/10 text-gold-polished border border-gold-polished/20">
                                  Base Currency
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20">
                                  Multiplier
                                </span>
                              )}

                              <div className="flex items-center gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleUpdateCurrency(item.id)}
                                      disabled={updating}
                                      className="p-2 rounded-xl border border-green-500/30 bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-all"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="p-2 rounded-xl border border-slate-500/20 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20 transition-all"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditing(item)}
                                      className="p-2 rounded-xl text-slate-blue dark:text-platinum hover:bg-gold-polished/10 transition-colors"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteCurrency(item.id)}
                                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Mobile Card Form or View */}
                            {isEditing ? (
                              <div className="space-y-3 my-2">
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                    Currency Code
                                  </label>
                                  <input
                                    type="text"
                                    value={editCode}
                                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                                    className="w-full px-3 py-2 rounded-xl border border-gold-polished bg-white dark:bg-navy-deep text-xs font-mono uppercase"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                                    Multiplier
                                  </label>
                                  <input
                                    type="number"
                                    step="any"
                                    value={editMultiplier}
                                    onChange={(e) =>
                                      setEditMultiplier(
                                        e.target.value ? parseFloat(e.target.value) : ''
                                      )
                                    }
                                    className="w-full px-3 py-2 rounded-xl border border-gold-polished bg-white dark:bg-navy-deep text-xs font-mono"
                                  />
                                </div>
                              </div>
                            ) : (
                              <div className="my-4">
                                <h3 className="text-2xl font-black text-navy-deep dark:text-alabaster font-mono">
                                  {item.code}
                                </h3>
                                <p className="text-xs text-slate-blue dark:text-platinum font-mono mt-1">
                                  Multiplier: <span className="font-bold">{item.multiplier}x</span>
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* ADD CURRENCY MODAL */}
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
              className="relative w-full max-w-lg rounded-3xl border border-navy-deep/10 dark:border-white/10 bg-white dark:bg-canvas-dark p-6 sm:p-8 shadow-2xl z-10 overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between pb-4 border-b border-navy-deep/10 dark:border-white/10 mb-6">
                <h3 className="text-lg font-black uppercase tracking-wide flex items-center gap-2">
                  <Coins className="w-5 h-5 text-gold-polished" /> Create Currency Profile
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="currency-form" onSubmit={handleCreateCurrency} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                    ISO Currency Code
                  </label>
                  <input
                    type="text"
                    value={newCode}
                    onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                    placeholder="e.g. USD, NGN, GBP, EUR"
                    className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono uppercase text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Conversion Multiplier (Relative to NGN)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={newMultiplier}
                    onChange={(e) =>
                      setNewMultiplier(e.target.value ? parseFloat(e.target.value) : '')
                    }
                    placeholder="e.g. 1.0 for Base or 0.00065"
                    className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                    required
                  />
                </div>

                {actionError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-medium flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {actionError}
                  </div>
                )}
              </form>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-navy-deep/10 dark:border-white/10 flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-semibold uppercase hover:bg-navy-deep/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="currency-form"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Currency
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}