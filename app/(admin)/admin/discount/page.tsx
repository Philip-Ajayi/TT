// app/(admin)/admin/discount/page.tsx
'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination } from 'swiper/modules';
import {
  Tag,
  Plus,
  Trash2,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  X,
  Edit2,
  Save,
  Power,
  Percent,
  DollarSign,
  Layers,
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';

// ---------- TYPES ----------
interface DiscountRule {
  id: string;
  code: string;
  type: string; // "cart", "services", "delivery"
  percentage: number;
  capNaira: number | null;
  active: boolean;
}

// Separate type for the inline edit form (all fields as strings)
interface InlineEditForm {
  code: string;
  type: string;
  percentage: string;
  capNaira: string; // empty string means "no cap"
}

export default function DiscountManagementPage() {
  const [discounts, setDiscounts] = useState<DiscountRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for New Discount Creation
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newCode, setNewCode] = useState<string>('');
  const [newType, setNewType] = useState<string>('cart');
  const [newPercentage, setNewPercentage] = useState<number | ''>('');
  const [newCapNaira, setNewCapNaira] = useState<number | ''>('');
  const [newActive, setNewActive] = useState<boolean>(true);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<InlineEditForm>({
    code: '',
    type: 'cart',
    percentage: '',
    capNaira: '',
  });

  // Form submitting / action states
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // ---------- FETCH ----------
  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/discounts');
      if (!res.ok) throw new Error('Failed to fetch discount rules.');
      const data = await res.json();
      setDiscounts(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading discounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscounts();
  }, []);

  // ---------- CREATE ----------
  const handleCreateDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || newPercentage === '') {
      setActionError('Code and percentage are required.');
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);

      const res = await fetch('/api/discounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: newCode.trim(),
          type: newType,
          percentage: Number(newPercentage),
          capNaira: newCapNaira !== '' ? Number(newCapNaira) : null,
          active: newActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create discount rule.');

      resetForm();
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- TOGGLE ACTIVE ----------
  const handleToggleActive = async (rule: DiscountRule) => {
    const updatedStatus = !rule.active;

    // Optimistic UI update
    setDiscounts((prev) =>
      prev.map((item) =>
        item.id === rule.id ? { ...item, active: updatedStatus } : item
      )
    );

    try {
      const res = await fetch(`/api/discounts/${rule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: updatedStatus }),
      });

      if (!res.ok) fetchDiscounts();
    } catch (err) {
      fetchDiscounts();
    }
  };

  // ---------- INLINE EDIT ----------
  const startEditing = (rule: DiscountRule) => {
    setEditingId(rule.id);
    setEditFormData({
      code: rule.code,
      type: rule.type,
      percentage: String(rule.percentage),
      capNaira: rule.capNaira !== null ? String(rule.capNaira) : '',
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditFormData({ code: '', type: 'cart', percentage: '', capNaira: '' });
  };

  const handleSaveInlineEdit = async (id: string) => {
    // Validate form
    if (!editFormData.code.trim() || editFormData.percentage === '') {
      alert('Code and percentage are required.');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        code: editFormData.code.trim(),
        type: editFormData.type,
        percentage: Number(editFormData.percentage),
        capNaira:
          editFormData.capNaira !== '' ? Number(editFormData.capNaira) : null,
      };

      const res = await fetch(`/api/discounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update rule.');

      setEditingId(null);
      fetchDiscounts();
    } catch (err: any) {
      alert(err.message || 'Error updating rule.');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- DELETE ----------
  const handleDeleteDiscount = async (id: string) => {
    if (!confirm('Are you sure you want to delete this discount rule?')) return;

    try {
      const res = await fetch(`/api/discounts/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Deletion failed.');

      setDiscounts((prev) => prev.filter((rule) => rule.id !== id));
    } catch (err: any) {
      alert(err.message || 'Failed to delete discount.');
    }
  };

  const resetForm = () => {
    setNewCode('');
    setNewType('cart');
    setNewPercentage('');
    setNewCapNaira('');
    setNewActive(true);
    setActionError(null);
  };

  // ---------- RENDER ----------
  return (
    <div className="w-full pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            Discount{' '}
            <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
              Rules
            </span>
          </h1>
          <p className="text-slate-blue dark:text-platinum text-sm max-w-xl">
            Manage your promo codes, inline updates, discount caps, and active strategy rules.
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="px-6 py-3.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-gold-metallic/20 transform hover:-translate-y-0.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Create Discount Code
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
                Fetching discount rules...
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
                <h3 className="text-base font-bold mb-1">Failed to load rules</h3>
                <p className="text-xs text-slate-blue dark:text-platinum mb-4 opacity-80">{error}</p>
                <button
                  onClick={fetchDiscounts}
                  className="px-5 py-2 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  Retry Query
                </button>
              </div>
            </motion.div>
          ) : discounts.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center liquid-glass-light dark:liquid-glass-dark rounded-3xl border border-dashed border-navy-deep/10 dark:border-white/10 p-12"
            >
              <Tag className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-bold mb-1 text-navy-deep dark:text-alabaster">
                No Discounts Configured
              </h3>
              <p className="text-xs text-slate-blue dark:text-platinum max-w-sm mx-auto opacity-70 mb-6">
                You haven't created any promotional campaigns yet. Click below to add your first discount.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Create Promo Code
              </button>
            </motion.div>
          ) : (
            <div className="w-full space-y-8">
              {/* DESKTOP DATA TABLE (Inline Editable) */}
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
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Code</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Type</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Percentage</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cap (₦)</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {discounts.map((item, idx) => {
                        const isEditing = editingId === item.id;

                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-b border-navy-deep/5 dark:border-white/5 last:border-0 hover:bg-navy-deep/[1%] dark:hover:bg-white/[1%] transition-colors"
                          >
                            {/* Toggleable Active Status */}
                            <td className="px-6 py-4">
                              <button
                                onClick={() => handleToggleActive(item)}
                                title="Click to toggle status"
                                className="group flex items-center focus:outline-none"
                              >
                                {item.active ? (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-green-500/10 text-green-500 border border-green-500/20 group-hover:bg-green-500/20 transition-all">
                                    <CheckCircle className="w-3.5 h-3.5" /> Active
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase bg-slate-500/10 text-slate-400 border border-slate-500/20 group-hover:bg-slate-500/20 transition-all">
                                    <XCircle className="w-3.5 h-3.5" /> Inactive
                                  </span>
                                )}
                              </button>
                            </td>

                            {/* Code Field (Inline Editing) */}
                            <td className="px-6 py-4 text-xs font-mono font-bold text-navy-deep dark:text-alabaster">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editFormData.code}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, code: e.target.value })
                                  }
                                  className="px-3 py-1.5 rounded-lg border border-gold-polished/40 bg-white dark:bg-navy-deep text-xs uppercase font-mono w-32 focus:outline-none"
                                />
                              ) : (
                                <span className="bg-gold-polished/10 px-2.5 py-1 rounded-md text-gold-polished dark:text-gold-metallic">
                                  {item.code}
                                </span>
                              )}
                            </td>

                            {/* Type Field (Inline Editing) */}
                            <td className="px-6 py-4 text-xs font-semibold text-slate-blue dark:text-platinum">
                              {isEditing ? (
                                <select
                                  value={editFormData.type}
                                  onChange={(e) =>
                                    setEditFormData({ ...editFormData, type: e.target.value })
                                  }
                                  className="px-2 py-1.5 rounded-lg border border-gold-polished/40 bg-white dark:bg-navy-deep text-xs focus:outline-none"
                                >
                                  <option value="cart">Cart</option>
                                  <option value="services">Services</option>
                                  <option value="delivery">Delivery</option>
                                </select>
                              ) : (
                                <span className="capitalize">{item.type}</span>
                              )}
                            </td>

                            {/* Percentage Field (Inline Editing) */}
                            <td className="px-6 py-4 text-xs font-semibold text-navy-deep dark:text-alabaster">
                              {isEditing ? (
                                <input
                                  type="number"
                                  value={editFormData.percentage}
                                  onChange={(e) =>
                                    setEditFormData({
                                      ...editFormData,
                                      percentage: e.target.value,
                                    })
                                  }
                                  className="px-2 py-1.5 rounded-lg border border-gold-polished/40 bg-white dark:bg-navy-deep text-xs w-20 focus:outline-none"
                                />
                              ) : (
                                `${item.percentage}%`
                              )}
                            </td>

                            {/* Cap Naira Field (Inline Editing) */}
                            <td className="px-6 py-4 text-xs font-mono text-slate-blue dark:text-platinum">
                              {isEditing ? (
                                <input
                                  type="number"
                                  placeholder="No Cap"
                                  value={editFormData.capNaira}
                                  onChange={(e) =>
                                    setEditFormData({
                                      ...editFormData,
                                      capNaira: e.target.value,
                                    })
                                  }
                                  className="px-2 py-1.5 rounded-lg border border-gold-polished/40 bg-white dark:bg-navy-deep text-xs w-24 focus:outline-none"
                                />
                              ) : item.capNaira ? (
                                `₦${item.capNaira.toLocaleString()}`
                              ) : (
                                <span className="text-slate-400 font-sans italic">None</span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveInlineEdit(item.id)}
                                      disabled={submitting}
                                      className="p-2 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-all"
                                      title="Save Changes"
                                    >
                                      <Save className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="p-2 rounded-xl border border-slate-500/20 text-slate-400 hover:bg-slate-500/10 transition-all"
                                      title="Cancel Edit"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditing(item)}
                                      className="p-2 rounded-xl border border-navy-deep/10 dark:border-white/10 hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-all"
                                      title="Inline Edit"
                                    >
                                      <Edit2 className="w-4 h-4 text-gold-polished" />
                                    </button>

                                    <button
                                      onClick={() => handleToggleActive(item)}
                                      className={`p-2 rounded-xl border transition-all ${
                                        item.active
                                          ? 'border-green-500/20 bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                          : 'border-slate-500/20 bg-slate-500/10 text-slate-400 hover:bg-slate-500/20'
                                      }`}
                                      title={item.active ? 'Deactivate' : 'Activate'}
                                    >
                                      <Power className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={() => handleDeleteDiscount(item.id)}
                                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                      title="Delete Rule"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* MOBILE SWIPER CAROUSEL VIEW */}
              <div className="block md:hidden w-full">
                <Swiper
                  modules={[Pagination]}
                  spaceBetween={16}
                  slidesPerView={1.1}
                  centeredSlides={false}
                  pagination={{ clickable: true, dynamicBullets: true }}
                  className="pb-12"
                >
                  {discounts.map((item) => (
                    <SwiperSlide key={item.id}>
                      <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-3xl border border-navy-deep/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[260px] shadow-lg">
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <button
                              onClick={() => handleToggleActive(item)}
                              className="focus:outline-none"
                            >
                              {item.active ? (
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
                              <button
                                onClick={() => handleToggleActive(item)}
                                className={`p-2 rounded-xl border transition-colors ${
                                  item.active
                                    ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                    : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
                                }`}
                              >
                                <Power className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleDeleteDiscount(item.id)}
                                className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="mb-4">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                              Promo Code
                            </span>
                            <p className="text-lg font-mono font-black text-gold-polished dark:text-gold-metallic">
                              {item.code}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Type</span>
                              <span className="font-semibold capitalize text-navy-deep dark:text-alabaster">
                                {item.type}
                              </span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block uppercase">Value</span>
                              <span className="font-bold text-navy-deep dark:text-alabaster">
                                {item.percentage}% Off
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 mt-4 border-t border-navy-deep/5 dark:border-white/5 flex items-center justify-between text-[11px] font-mono text-slate-blue dark:text-platinum">
                          <span>
                            Cap:{' '}
                            {item.capNaira
                              ? `₦${item.capNaira.toLocaleString()}`
                              : 'No Cap'}
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

      {/* CREATE DISCOUNT MODAL */}
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
                  <Tag className="w-5 h-5 text-gold-polished" /> Create Discount Strategy
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto flex-1 pr-1 space-y-6">
                <form id="discount-form" onSubmit={handleCreateDiscount} className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                      Discount Code
                    </label>
                    <input
                      type="text"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      placeholder="e.g. SUMMER2026"
                      className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono font-bold uppercase text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                      Target Discount Category
                    </label>
                    <div className="relative">
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all appearance-none"
                      >
                        <option value="cart">Cart Discount</option>
                        <option value="services">Services Discount</option>
                        <option value="delivery">Delivery Discount</option>
                      </select>
                      <Layers className="w-4 h-4 text-slate-400 absolute right-4 top-3.5 pointer-events-none" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                        <Percent className="w-3 h-3 text-gold-polished" /> Percentage Off
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={newPercentage}
                        onChange={(e) =>
                          setNewPercentage(e.target.value ? parseFloat(e.target.value) : '')
                        }
                        placeholder="15"
                        className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5 flex items-center gap-1">
                        <DollarSign className="w-3 h-3 text-gold-polished" /> Max Cap (₦ Optional)
                      </label>
                      <input
                        type="number"
                        value={newCapNaira}
                        onChange={(e) =>
                          setNewCapNaira(e.target.value ? parseFloat(e.target.value) : '')
                        }
                        placeholder="5000"
                        className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs font-mono text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="checkbox"
                      id="newActive"
                      checked={newActive}
                      onChange={(e) => setNewActive(e.target.checked)}
                      className="w-4 h-4 rounded border-navy-deep/20 text-gold-polished focus:ring-gold-polished"
                    />
                    <label
                      htmlFor="newActive"
                      className="text-xs font-semibold text-navy-deep dark:text-alabaster cursor-pointer"
                    >
                      Make Active Immediately Upon Creation
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
                  form="discount-form"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Strategy Rule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}