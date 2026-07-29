////app/(admin)/admin/processing/page.tsx

'use client';

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import { 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  Percent, 
  SlidersHorizontal 
} from "lucide-react";

import "swiper/css";
import "swiper/css/pagination";

interface ProcessingRule {
  id: string;
  name: string;
  multiplier: number;
}

export default function ProcessingRulesPage() {
  const [rules, setRules] = useState<ProcessingRule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State for New Processing Rule
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [newMultiplier, setNewMultiplier] = useState<number | "">("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Inline Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [editMultiplier, setEditMultiplier] = useState<number | "">("");
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  // Fetch processing rules from API
  const fetchRules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/processing");
      if (!res.ok) throw new Error("Failed to fetch processing rules.");
      const data = await res.json();
      setRules(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Handle Add New Rule
  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || newMultiplier === "") {
      setActionError("Please provide both rule name and multiplier.");
      return;
    }

    try {
      setSubmitting(true);
      setActionError(null);

      const res = await fetch("/api/processing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName.trim(),
          multiplier: Number(newMultiplier),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create processing rule.");
      }

      resetModalForm();
      setIsModalOpen(false);
      fetchRules();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Start Inline Editing Mode
  const startEditing = (rule: ProcessingRule) => {
    setEditingId(rule.id);
    setEditName(rule.name);
    setEditMultiplier(rule.multiplier);
  };

  // Cancel Inline Editing Mode
  const cancelEditing = () => {
    setEditingId(null);
    setEditName("");
    setEditMultiplier("");
  };

  // Save Inline Edit (PUT request)
  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || editMultiplier === "") return;

    try {
      setSavingEdit(true);
      const res = await fetch(`/api/processing/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName.trim(),
          multiplier: Number(editMultiplier),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to update processing rule.");
      }

      // Optimistic state update
      setRules((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, name: editName.trim(), multiplier: Number(editMultiplier) }
            : r
        )
      );

      setEditingId(null);
    } catch (err: any) {
      alert(err.message || "Failed to update processing rule.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Handle Delete Processing Rule
  const handleDeleteRule = async (id: string) => {
    if (!confirm("Are you sure you want to delete this processing rule?")) return;

    try {
      const res = await fetch(`/api/processing/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete processing rule.");
      }

      setRules((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(err.message || "Failed to delete processing rule.");
    }
  };

  const resetModalForm = () => {
    setNewName("");
    setNewMultiplier("");
    setActionError(null);
  };

  return (
    <div className="w-full pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col">
      
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tight mb-2">
            Processing{" "}
            <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
              Rules
            </span>
          </h1>
          <p className="text-slate-blue dark:text-platinum text-sm max-w-xl">
            Configure processing speed tiers, surge multipliers, and urgency costs for turnarounds.
          </p>
        </div>

        <button
          onClick={() => {
            resetModalForm();
            setIsModalOpen(true);
          }}
          className="px-6 py-3.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg hover:shadow-gold-metallic/20 transform hover:-translate-y-0.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add Processing Rule
        </button>
      </div>

      {/* Main Content Container */}
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
                Fetching turnaround tiers...
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
                  onClick={fetchRules}
                  className="px-5 py-2 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
                >
                  Retry Query
                </button>
              </div>
            </motion.div>
          ) : rules.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center liquid-glass-light dark:liquid-glass-dark rounded-3xl border border-dashed border-navy-deep/10 dark:border-white/10 p-12"
            >
              <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4 opacity-60" />
              <h3 className="text-lg font-bold mb-1 text-navy-deep dark:text-alabaster">
                No Processing Rules Configured
              </h3>
              <p className="text-xs text-slate-blue dark:text-platinum max-w-sm mx-auto opacity-70 mb-6">
                You haven't defined any processing timelines or urgency rates yet.
              </p>
              <button
                onClick={() => setIsModalOpen(true)}
                className="px-6 py-3 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider shadow-md"
              >
                Create First Rule
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
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Rule Name / Urgency</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Multiplier Rate</th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map((item, idx) => {
                        const isEditing = editingId === item.id;
                        return (
                          <motion.tr
                            key={item.id}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className="border-b border-navy-deep/5 dark:border-white/5 last:border-0 hover:bg-navy-deep/[1%] dark:hover:bg-white/[1%] transition-colors"
                          >
                            {/* Rule Name Column */}
                            <td className="px-6 py-4 text-xs font-semibold text-navy-deep dark:text-alabaster">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="w-full max-w-xs px-3 py-1.5 rounded-lg border border-gold-polished dark:border-gold-metallic bg-white dark:bg-navy-deep focus:outline-none text-xs"
                                />
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Clock className="w-4 h-4 text-gold-polished shrink-0" />
                                  <span>{item.name}</span>
                                </div>
                              )}
                            </td>

                            {/* Multiplier Column */}
                            <td className="px-6 py-4 text-xs font-mono text-slate-blue dark:text-platinum">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editMultiplier}
                                  onChange={(e) =>
                                    setEditMultiplier(
                                      e.target.value ? parseFloat(e.target.value) : ""
                                    )
                                  }
                                  className="w-32 px-3 py-1.5 rounded-lg border border-gold-polished dark:border-gold-metallic bg-white dark:bg-navy-deep focus:outline-none text-xs"
                                />
                              ) : (
                                <span className="inline-flex items-center gap-1 font-bold">
                                  <Percent className="w-3 h-3 text-gold-polished" />
                                  {item.multiplier}x
                                </span>
                              )}
                            </td>

                            {/* Action Buttons Column */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveEdit(item.id)}
                                      disabled={savingEdit}
                                      className="p-2 rounded-xl bg-green-500/10 text-green-500 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                                      title="Save Modifications"
                                    >
                                      {savingEdit ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <Check className="w-4 h-4" />
                                      )}
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="p-2 rounded-xl bg-slate-500/10 text-slate-400 border border-slate-500/20 hover:bg-slate-500/20 transition-colors"
                                      title="Cancel Edit"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditing(item)}
                                      className="p-2 rounded-xl text-gold-polished hover:bg-gold-polished/10 transition-colors"
                                      title="Edit Processing Rule"
                                    >
                                      <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRule(item.id)}
                                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                      title="Delete Processing Rule"
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
                  {rules.map((item) => {
                    const isEditing = editingId === item.id;
                    return (
                      <SwiperSlide key={item.id}>
                        <div className="liquid-glass-light dark:liquid-glass-dark p-6 rounded-3xl border border-navy-deep/10 dark:border-white/10 flex flex-col justify-between h-full min-h-[220px] shadow-lg">
                          <div>
                            <div className="flex items-center justify-between mb-4">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-gold-polished/10 text-gold-polished dark:text-gold-metallic border border-gold-polished/20">
                                <SlidersHorizontal className="w-3.5 h-3.5" /> Urgency Tier
                              </span>

                              <div className="flex items-center gap-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveEdit(item.id)}
                                      disabled={savingEdit}
                                      className="p-2 rounded-xl bg-green-500/10 text-green-500 transition-colors"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={cancelEditing}
                                      className="p-2 rounded-xl bg-slate-500/10 text-slate-400 transition-colors"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => startEditing(item)}
                                      className="p-2 rounded-xl text-gold-polished hover:bg-gold-polished/10 transition-colors"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRule(item.id)}
                                      className="p-2 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>

                            {/* Name Edit or Display */}
                            {isEditing ? (
                              <div className="space-y-3 mb-4">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Rule Name"
                                  className="w-full px-3 py-2 rounded-xl border border-gold-polished text-xs bg-white dark:bg-canvas-dark text-navy-deep dark:text-alabaster"
                                />
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editMultiplier}
                                  onChange={(e) =>
                                    setEditMultiplier(
                                      e.target.value ? parseFloat(e.target.value) : ""
                                    )
                                  }
                                  placeholder="Multiplier"
                                  className="w-full px-3 py-2 rounded-xl border border-gold-polished text-xs bg-white dark:bg-canvas-dark text-navy-deep dark:text-alabaster"
                                />
                              </div>
                            ) : (
                              <div className="mb-4">
                                <h3 className="text-base font-bold text-navy-deep dark:text-alabaster mb-1">
                                  {item.name}
                                </h3>
                              </div>
                            )}
                          </div>

                          {!isEditing && (
                            <div className="pt-3 border-t border-navy-deep/5 dark:border-white/5 flex items-center justify-between text-xs font-mono">
                              <span className="text-slate-400">Rate Multiplier</span>
                              <span className="font-bold text-gold-polished dark:text-gold-metallic">
                                {item.multiplier}x
                              </span>
                            </div>
                          )}
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

      {/* ADD NEW RULE MODAL */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal Backdrop */}
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
                  <Clock className="w-5 h-5 text-gold-polished" /> Create Processing Rule
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form id="rule-form" onSubmit={handleCreateRule} className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Urgency Tier / Rule Name
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Express 24-Hour Turnaround"
                    className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs text-navy-deep dark:text-alabaster focus:outline-none focus:border-gold-polished transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">
                    Price Multiplier (e.g., 1.5 for +50%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newMultiplier}
                    onChange={(e) => setNewMultiplier(e.target.value ? parseFloat(e.target.value) : "")}
                    placeholder="1.5"
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

              {/* Actions Footer */}
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
                  form="rule-form"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                >
                  {submitting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Save Processing Rule
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}