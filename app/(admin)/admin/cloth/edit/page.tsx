//app/(admin)/cloth/edit/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Navigation } from 'swiper/modules';
import {
  Trash2,
  Edit3,
  Plus,
  X,
  Check,
  Shirt,
  DollarSign,
  AlertCircle,
  RefreshCw,
  Layers,
  Sparkles,
  Ban,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';

import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

// Data Interfaces according to GET API endpoint
interface VariantPartialService {
  id: string;
  name: string;
  price: number | null;
}

interface Variant {
  id: string;
  name: string;
  price: number | null;
  isPriceNull: boolean;
  variantPartialServices: VariantPartialService[];
}

interface ClothPartialService {
  id: string;
  name: string;
  price: number | null;
}

interface Cloth {
  id: string;
  name: string;
  price: number | null;
  isPriceNull: boolean;
  imageUrl?: string;
  description?: string;
  clothPartialServices: ClothPartialService[];
  variants: Variant[];
}

export default function ClothEditPage() {
  const [cloths, setCloths] = useState<Cloth[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Cloth Carousel Selection
  const [selectedClothId, setSelectedClothId] = useState<string | null>(null);

  // Modals state
  const [addClothSubModalOpen, setAddClothSubModalOpen] = useState(false);
  const [addVariantServiceModalOpen, setAddVariantServiceModalOpen] = useState<string | null>(null); // Variant ID
  const [editClothModalOpen, setEditClothModalOpen] = useState(false);

  // Inline editing state: { type: 'v'|'cps'|'vps', id: string }
  const [editingItem, setEditingItem] = useState<{
    type: 'v' | 'cps' | 'vps';
    id: string;
    name: string;
    price: string; // numeric string, or 'SPECIAL', or 'PRICENULL' (for variants)
  } | null>(null);

  // Form States for Modals
  // 1. Add Cloth Sub-Item Form
  const [clothSubCategory, setClothSubCategory] = useState<'variant' | 'cps'>('cps');
  // Dynamic fields array for Variant creation
  const [variantsToAdd, setVariantsToAdd] = useState<
    Array<{
      name: string;
      price: string;
      services: Array<{ name: string; price: string }>;
    }>
  >([{ name: '', price: '', services: [] }]);
  // Dynamic fields array for Cloth Partial Service creation
  const [cpsToAdd, setCpsToAdd] = useState<Array<{ name: string; price: string }>>([
    { name: '', price: '' },
  ]);

  // 2. Add Variant Partial Service Form
  const [vpsToAdd, setVpsToAdd] = useState<{ name: string; price: string }>({
    name: '',
    price: '',
  });

  // 3. Edit Cloth Form
  const [editClothForm, setEditClothForm] = useState({
    name: '',
    imageUrl: '',
    description: '',
    price: '',
    isPriceNull: false,
    isSpecialOrder: false,
  });

  // Fetch Cloth Data
  const fetchClothData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/stack/cloth');
      if (!res.ok) throw new Error('Failed to fetch cloth details');
      const data: Cloth[] = await res.json();
      setCloths(data);
      if (data.length > 0 && !selectedClothId) {
        setSelectedClothId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred fetching cloth records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClothData();
  }, []);

  const activeCloth = useMemo(
    () => cloths.find((c) => c.id === selectedClothId) || cloths[0],
    [cloths, selectedClothId]
  );

  // Pre-fill Edit Cloth Modal when opened
  useEffect(() => {
    if (activeCloth && editClothModalOpen) {
      setEditClothForm({
        name: activeCloth.name || '',
        imageUrl: activeCloth.imageUrl || '',
        description: activeCloth.description || '',
        price: activeCloth.price !== null ? String(activeCloth.price) : '',
        isPriceNull: activeCloth.isPriceNull,
        isSpecialOrder: !activeCloth.isPriceNull && activeCloth.price === null,
      });
    }
  }, [editClothModalOpen, activeCloth]);

  // Adjust modal locked-in options for Rule #5a
  useEffect(() => {
    if (activeCloth) {
      if (activeCloth.variants && activeCloth.variants.length > 0) {
        setClothSubCategory('variant');
      } else if (
        activeCloth.clothPartialServices.length > 0 ||
        (activeCloth.price !== null && activeCloth.price > 0)
      ) {
        setClothSubCategory('cps');
      }
    }
  }, [addClothSubModalOpen, activeCloth]);

  // Handlers for Deletion
  const handleDelete = async (type: 'c' | 'v' | 'cps' | 'vps', id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    try {
      const res = await fetch(`/api/stack/cloth/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Deletion failed');
      }
      await fetchClothData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handlers for Inline Editing Save
  const handleInlineSave = async () => {
    if (!editingItem) return;
    try {
      const body: any = {
        type: editingItem.type,
        name: editingItem.name,
      };

      if (editingItem.price === 'SPECIAL') {
        body.toggletospecial = true;
      } else if (editingItem.price === 'PRICENULL') {
        body.toggletopricenull = true;
      } else if (editingItem.price !== '') {
        body.price = parseFloat(editingItem.price);
      }

      const res = await fetch(`/api/stack/cloth/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Update failed');
      }

      setEditingItem(null);
      await fetchClothData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler for Submitting Cloth Add Modal (#5)
  const handleAddClothSubItems = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCloth) return;

    try {
      let body: any = { type: 'c' };

      if (clothSubCategory === 'cps') {
        body.clothPartialServices = cpsToAdd
          .filter((i) => i.name.trim() !== '')
          .map((i) => ({
            name: i.name,
            price: i.price !== '' ? parseFloat(i.price) : 0,
          }));
      } else {
        body.variants = variantsToAdd
          .filter((v) => v.name.trim() !== '')
          .map((v) => ({
            name: v.name,
            price: v.price !== '' ? parseFloat(v.price) : undefined,
            variantPartialServices: v.services
              .filter((s) => s.name.trim() !== '')
              .map((s) => ({
                name: s.name,
                price: s.price !== '' ? parseFloat(s.price) : 0,
              })),
          }));
      }

      const res = await fetch(`/api/stack/cloth/${activeCloth.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Creation failed');
      }

      setAddClothSubModalOpen(false);
      // Reset forms
      setCpsToAdd([{ name: '', price: '' }]);
      setVariantsToAdd([{ name: '', price: '', services: [] }]);
      await fetchClothData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler for Variant Partial Service Add (#4)
  const handleAddVariantService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addVariantServiceModalOpen) return;

    try {
      const body = {
        type: 'v',
        name: vpsToAdd.name,
        price: vpsToAdd.price !== '' ? parseFloat(vpsToAdd.price) : 0,
      };

      const res = await fetch(`/api/stack/cloth/${addVariantServiceModalOpen}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Creation failed');
      }

      setAddVariantServiceModalOpen(null);
      setVpsToAdd({ name: '', price: '' });
      await fetchClothData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler for Editing Parent Cloth (#6)
  const handleSaveClothEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCloth) return;

    try {
      const body: any = {
        type: 'c',
        name: editClothForm.name,
        image: editClothForm.imageUrl,
        description: editClothForm.description,
      };

      if (editClothForm.isPriceNull) {
        body.toggletopricenull = true;
      } else if (editClothForm.isSpecialOrder) {
        body.toggletospecial = true;
      } else if (editClothForm.price !== '') {
        body.price = parseFloat(editClothForm.price);
      }

      const res = await fetch(`/api/stack/cloth/${activeCloth.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Cloth update failed');
      }

      setEditClothModalOpen(false);
      await fetchClothData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="w-full pt-32 pb-24 flex items-center justify-center flex-col gap-3">
        <RefreshCw className="w-8 h-8 text-gold-polished dark:text-gold-metallic animate-spin" />
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Loading Cloth Hierarchy...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full pt-32 pb-24 flex justify-center px-4">
        <div className="liquid-glass-light dark:liquid-glass-dark border border-red-500/30 p-8 rounded-3xl text-center max-w-md">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <h3 className="text-base font-bold mb-1">Error Loading Configuration</h3>
          <p className="text-xs text-slate-blue dark:text-platinum mb-4">{error}</p>
          <button
            onClick={fetchClothData}
            className="px-5 py-2 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-28 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto flex-1 flex flex-col">
      {/* Header Bar */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight">
            Cloth Hierarchy{' '}
            <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
              Manager
            </span>
          </h1>
          <p className="text-slate-blue dark:text-platinum text-xs">
            Manage items, pricing, cloth types, and individual services.
          </p>
        </div>
      </div>

      {/* Swiper Selector for Parent Cloths */}
      {cloths.length > 0 && (
        <div className="mb-10">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
            Select Cloth
          </p>
          <Swiper
            modules={[Pagination, Navigation]}
            spaceBetween={16}
            slidesPerView={1.2}
            navigation
            breakpoints={{
              640: { slidesPerView: 2.5 },
              1024: { slidesPerView: 4 },
            }}
            className="pb-4"
          >
            {cloths.map((cloth) => {
              const isSelected = activeCloth?.id === cloth.id;
              return (
                <SwiperSlide key={cloth.id}>
                  <div
                    onClick={() => setSelectedClothId(cloth.id)}
                    className={`cursor-pointer p-4 rounded-2xl border transition-all duration-300 flex items-center gap-3 ${
                      isSelected
                        ? 'liquid-glass-light dark:liquid-glass-dark border-gold-polished dark:border-gold-metallic ring-2 ring-gold-polished/20 shadow-xl'
                        : 'bg-white/40 dark:bg-navy-deep/40 border-navy-deep/10 dark:border-white/10 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-gold-polished/10 dark:bg-gold-metallic/10 flex items-center justify-center text-gold-polished dark:text-gold-metallic shrink-0">
                      <Shirt className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <h4 className="text-sm font-bold truncate text-navy-deep dark:text-alabaster">
                        {cloth.name}
                      </h4>
                      <p className="text-[10px] font-semibold text-slate-400">
                        {cloth.isPriceNull
                          ? 'Type Pricing'
                          : cloth.price != null
                          ? `₦${Number(cloth.price).toFixed(2)}`
                          : 'Special Order'}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>
      )}

      {/* Main Hierarchy Tree View */}
      {activeCloth && (
        <motion.div
          key={activeCloth.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full rounded-3xl border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark p-6 shadow-2xl space-y-6"
        >
          {/* LEVEL 1: ROOT CLOTH ITEM */}
          <div className="p-5 rounded-2xl bg-navy-deep/5 dark:bg-white/5 border border-navy-deep/10 dark:border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gold-polished/20 dark:bg-gold-metallic/20 flex items-center justify-center text-gold-polished dark:text-gold-metallic">
                <Shirt className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-black text-navy-deep dark:text-alabaster uppercase">
                    {activeCloth.name}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider bg-gold-polished/10 text-gold-polished dark:text-gold-metallic border border-gold-polished/20">
                    Parent Cloth
                  </span>
                </div>
                <p className="text-xs text-slate-blue dark:text-platinum mt-1">
                  Price Status:{' '}
                  <b className="text-navy-deep dark:text-alabaster">
                    {activeCloth.isPriceNull
                      ? 'Priced by Type (Not a service)'
                      : activeCloth.price != null
                      ? `₦${Number(activeCloth.price).toFixed(2)}`
                      : 'Special Order (Empty Price)'}
                  </b>
                </p>
              </div>
            </div>

            {/* Level 1 Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAddClothSubModalOpen(true)}
                title="Add Type or Individual Service"
                className="p-2.5 rounded-xl border border-gold-polished/30 text-gold-polished dark:text-gold-metallic hover:bg-gold-metallic/10 transition-colors flex items-center gap-1.5 text-xs font-bold uppercase"
              >
                <Plus className="w-4 h-4" /> Add Sub-Item
              </button>
              <button
                onClick={() => setEditClothModalOpen(true)}
                title="Edit Cloth Details"
                className="p-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-slate-blue dark:text-platinum hover:bg-navy-deep/5 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete('c', activeCloth.id)}
                title="Delete Cloth"
                className="p-2.5 rounded-xl border border-red-500/20 text-red-500 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* LEVEL 2: BRANCHES (Types or Individual Services) */}
          <div className="pl-4 md:pl-8 border-l-2 border-dashed border-navy-deep/10 dark:border-white/10 space-y-6">
            {/* Individual Services Branch */}
            {activeCloth.clothPartialServices.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Layers className="w-4 h-4 text-gold-polished" /> Individual Services
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {activeCloth.clothPartialServices.map((cps) => (
                    <div
                      key={cps.id}
                      className="p-3.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/50 flex items-center justify-between gap-2"
                    >
                      {editingItem?.id === cps.id ? (
                        <div className="flex items-center gap-2 w-full flex-wrap">
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, name: e.target.value })
                            }
                            className="px-2 py-1 text-xs rounded border border-gold-polished/40 bg-white/80 dark:bg-navy-deep/80 text-navy-deep dark:text-alabaster w-1/3"
                          />
                          <select
                            value={editingItem.price === 'SPECIAL' ? 'SPECIAL' : 'NUMERIC'}
                            onChange={(e) => {
                              if (e.target.value === 'SPECIAL') {
                                setEditingItem({ ...editingItem, price: 'SPECIAL' });
                              } else {
                                setEditingItem({ ...editingItem, price: '' });
                              }
                            }}
                            className="px-2 py-1 text-xs rounded border border-gold-polished/40 bg-white/80 dark:bg-navy-deep/80 text-navy-deep dark:text-alabaster"
                          >
                            <option value="NUMERIC">Numeric Price</option>
                            <option value="SPECIAL">Special Order</option>
                          </select>
                          {editingItem.price !== 'SPECIAL' && (
                            <input
                              type="number"
                              placeholder="Price"
                              value={editingItem.price}
                              onChange={(e) =>
                                setEditingItem({ ...editingItem, price: e.target.value })
                              }
                              className="px-2 py-1 text-xs rounded border border-gold-polished/40 bg-white/80 dark:bg-navy-deep/80 text-navy-deep dark:text-alabaster w-20"
                            />
                          )}
                          <button
                            onClick={handleInlineSave}
                            className="p-1 rounded bg-green-500 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="p-1 rounded bg-slate-400 text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <p className="text-xs font-bold text-navy-deep dark:text-alabaster">
                              {cps.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {cps.price != null
                                ? `₦${Number(cps.price).toFixed(2)}`
                                : 'Special Order'}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setEditingItem({
                                  type: 'cps',
                                  id: cps.id,
                                  name: cps.name,
                                  price: cps.price !== null ? String(cps.price) : 'SPECIAL',
                                })
                              }
                              className="p-1.5 rounded-lg hover:bg-navy-deep/5 dark:hover:bg-white/5 text-slate-blue dark:text-platinum"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete('cps', cps.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Types Branch (formerly Variants) */}
            {activeCloth.variants.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                  <Sparkles className="w-4 h-4 text-gold-polished" /> Cloth Types
                </div>

                {activeCloth.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="p-4 rounded-2xl border border-navy-deep/10 dark:border-white/10 bg-white/30 dark:bg-navy-deep/30 space-y-4"
                  >
                    {/* Level 2: Type Header */}
                    <div className="flex items-center justify-between gap-3">
                      {editingItem?.id === variant.id ? (
                        <div className="flex items-center gap-2 w-full flex-wrap">
                          <input
                            type="text"
                            value={editingItem.name}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, name: e.target.value })
                            }
                            className="px-2 py-1 text-xs rounded border border-gold-polished/40 bg-white/80 dark:bg-navy-deep/80 text-navy-deep dark:text-alabaster"
                          />
                          <select
                            value={editingItem.price}
                            onChange={(e) =>
                              setEditingItem({ ...editingItem, price: e.target.value })
                            }
                            className="px-2 py-1 text-xs rounded border border-gold-polished/40 bg-white/80 dark:bg-navy-deep/80 text-navy-deep dark:text-alabaster"
                          >
                            <option value="">Numeric Price...</option>
                            <option value="SPECIAL">Special Order (Null Price)</option>
                            <option value="PRICENULL">Not a Service (Price Null Flag)</option>
                          </select>
                          {editingItem.price !== 'SPECIAL' &&
                            editingItem.price !== 'PRICENULL' && (
                              <input
                                type="number"
                                placeholder="Price"
                                value={editingItem.price}
                                onChange={(e) =>
                                  setEditingItem({ ...editingItem, price: e.target.value })
                                }
                                className="px-2 py-1 text-xs rounded border border-gold-polished/40 bg-white/80 dark:bg-navy-deep/80 text-navy-deep dark:text-alabaster w-20"
                              />
                            )}
                          <button
                            onClick={handleInlineSave}
                            className="p-1 rounded bg-green-500 text-white"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="p-1 rounded bg-slate-400 text-white"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <div>
                            <h3 className="text-sm font-bold text-navy-deep dark:text-alabaster flex items-center gap-2">
                              {variant.name}
                              {variant.isPriceNull && (
                                <span className="text-[9px] px-2 py-0.2 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                  Price Null
                                </span>
                              )}
                            </h3>
                            <p className="text-[11px] font-semibold text-slate-400">
                              {variant.isPriceNull
                                ? 'Not Direct Service'
                                : variant.price != null
                                ? `₦${Number(variant.price).toFixed(2)}`
                                : 'Special Order'}
                            </p>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => setAddVariantServiceModalOpen(variant.id)}
                              title="Add Type Service"
                              className="p-1.5 rounded-lg border border-gold-polished/30 text-gold-polished dark:text-gold-metallic text-xs font-bold flex items-center gap-1"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add Service
                            </button>
                            <button
                              onClick={() =>
                                setEditingItem({
                                  type: 'v',
                                  id: variant.id,
                                  name: variant.name,
                                  price: variant.price !== null ? String(variant.price) : '',
                                })
                              }
                              className="p-1.5 rounded-lg hover:bg-navy-deep/5 dark:hover:bg-white/5 text-slate-blue dark:text-platinum"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete('v', variant.id)}
                              className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>

                    {/* LEVEL 3: TYPE SERVICES BRANCH (formerly Variant Partial Services) */}
                    {variant.variantPartialServices.length > 0 && (
                      <div className="pl-4 border-l-2 border-navy-deep/10 dark:border-white/10 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Type Services
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {variant.variantPartialServices.map((vps) => (
                            <div
                              key={vps.id}
                              className="p-2.5 rounded-lg border border-navy-deep/5 dark:border-white/5 bg-white/60 dark:bg-navy-deep/60 flex items-center justify-between"
                            >
                              {editingItem?.id === vps.id ? (
                                <div className="flex items-center gap-2 w-full flex-wrap">
                                  <input
                                    type="text"
                                    value={editingItem.name}
                                    onChange={(e) =>
                                      setEditingItem({ ...editingItem, name: e.target.value })
                                    }
                                    className="px-2 py-0.5 text-xs rounded border border-gold-polished/40 bg-white/80 dark:bg-navy-deep/80 text-navy-deep dark:text-alabaster w-1/3"
                                  />
                                  <select
                                    value={editingItem.price === 'SPECIAL' ? 'SPECIAL' : 'NUMERIC'}
                                    onChange={(e) => {
                                      if (e.target.value === 'SPECIAL') {
                                        setEditingItem({ ...editingItem, price: 'SPECIAL' });
                                      } else {
                                        setEditingItem({ ...editingItem, price: '' });
                                      }
                                    }}
                                    className="px-2 py-0.5 text-xs rounded border border-gold-polished/40 bg-white/80 dark:bg-navy-deep/80 text-navy-deep dark:text-alabaster"
                                  >
                                    <option value="NUMERIC">Numeric Price</option>
                                    <option value="SPECIAL">Special Order</option>
                                  </select>
                                  {editingItem.price !== 'SPECIAL' && (
                                    <input
                                      type="number"
                                      placeholder="Price"
                                      value={editingItem.price}
                                      onChange={(e) =>
                                        setEditingItem({ ...editingItem, price: e.target.value })
                                      }
                                      className="px-2 py-0.5 text-xs rounded border border-gold-polished/40 bg-white/80 dark:bg-navy-deep/80 text-navy-deep dark:text-alabaster w-16"
                                    />
                                  )}
                                  <button
                                    onClick={handleInlineSave}
                                    className="p-1 rounded bg-green-500 text-white"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setEditingItem(null)}
                                    className="p-1 rounded bg-slate-400 text-white"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <p className="text-xs font-semibold text-navy-deep dark:text-alabaster">
                                      {vps.name}
                                    </p>
                                    <p className="text-[10px] text-slate-400">
                                      {vps.price != null
                                        ? `₦${Number(vps.price).toFixed(2)}`
                                        : 'Special Order'}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() =>
                                        setEditingItem({
                                          type: 'vps',
                                          id: vps.id,
                                          name: vps.name,
                                          price: vps.price !== null ? String(vps.price) : 'SPECIAL',
                                        })
                                      }
                                      className="p-1 rounded hover:bg-navy-deep/5 dark:hover:bg-white/5 text-slate-blue dark:text-platinum"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                    </button>
                                    <button
                                      onClick={() => handleDelete('vps', vps.id)}
                                      className="p-1 rounded hover:bg-red-500/10 text-red-500"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* MODAL 1: ADD CLOTH SUB-ITEM MULTI-FORM (#5) */}
      <AnimatePresence>
        {addClothSubModalOpen && activeCloth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-xl rounded-3xl border border-navy-deep/10 dark:border-white/10 bg-white dark:bg-canvas-dark p-6 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase text-navy-deep dark:text-alabaster">
                  Add Sub-Item to {activeCloth.name}
                </h3>
                <button
                  onClick={() => setAddClothSubModalOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-navy-deep dark:hover:text-alabaster"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddClothSubItems} className="space-y-6">
                {/* Rule #5a Toggle Category */}
                <div className="flex rounded-xl p-1 bg-navy-deep/5 dark:bg-white/5 border border-navy-deep/10 dark:border-white/10">
                  <button
                    type="button"
                    disabled={activeCloth.variants.length > 0}
                    onClick={() => setClothSubCategory('cps')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                      clothSubCategory === 'cps'
                        ? 'bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark shadow-md'
                        : 'text-slate-400 opacity-70'
                    } ${
                      activeCloth.variants.length > 0
                        ? 'cursor-not-allowed opacity-30'
                        : ''
                    }`}
                  >
                    Individual Service
                  </button>
                  <button
                    type="button"
                    disabled={
                      activeCloth.clothPartialServices.length > 0 ||
                      (activeCloth.price !== null && activeCloth.price > 0)
                    }
                    onClick={() => setClothSubCategory('variant')}
                    className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all ${
                      clothSubCategory === 'variant'
                        ? 'bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark shadow-md'
                        : 'text-slate-400 opacity-70'
                    } ${
                      activeCloth.clothPartialServices.length > 0 ||
                      (activeCloth.price !== null && activeCloth.price > 0)
                        ? 'cursor-not-allowed opacity-30'
                        : ''
                    }`}
                  >
                    Type(s)
                  </button>
                </div>

                {/* Sub-form for Individual Services */}
                {clothSubCategory === 'cps' && (
                  <div className="space-y-4">
                    <p className="text-xs font-semibold text-slate-blue dark:text-platinum">
                      Enter individual service details for this cloth:
                    </p>
                    {cpsToAdd.map((cps, index) => (
                      <div key={index} className="flex gap-2 items-center">
                        <input
                          type="text"
                          required
                          placeholder="Service Name (e.g., Stain Removal)"
                          value={cps.name}
                          onChange={(e) => {
                            const updated = [...cpsToAdd];
                            updated[index].name = e.target.value;
                            setCpsToAdd(updated);
                          }}
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 focus:outline-none"
                        />
                        <input
                          type="number"
                          placeholder="Price (Optional)"
                          value={cps.price}
                          onChange={(e) => {
                            const updated = [...cpsToAdd];
                            updated[index].price = e.target.value;
                            setCpsToAdd(updated);
                          }}
                          className="w-28 px-3 py-2 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 focus:outline-none"
                        />
                        {cpsToAdd.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setCpsToAdd(cpsToAdd.filter((_, i) => i !== index))
                            }
                            className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setCpsToAdd([...cpsToAdd, { name: '', price: '' }])}
                      className="text-xs font-bold text-gold-polished dark:text-gold-metallic flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Another Individual Service
                    </button>
                  </div>
                )}

                {/* Sub-form for Types (Variants) (#5b) */}
                {clothSubCategory === 'variant' && (
                  <div className="space-y-6">
                    {variantsToAdd.map((v, vIndex) => (
                      <div
                        key={vIndex}
                        className="p-4 rounded-2xl border border-navy-deep/10 dark:border-white/10 bg-navy-deep/5 dark:bg-white/5 space-y-3"
                      >
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-gold-polished uppercase">
                            Type #{vIndex + 1}
                          </span>
                          {variantsToAdd.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setVariantsToAdd(
                                  variantsToAdd.filter((_, i) => i !== vIndex)
                                )
                              }
                              className="text-red-500 p-1"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            required
                            placeholder="Type Name (e.g. Silk, Extra Large)"
                            value={v.name}
                            onChange={(e) => {
                              const updated = [...variantsToAdd];
                              updated[vIndex].name = e.target.value;
                              setVariantsToAdd(updated);
                            }}
                            className="px-3 py-2 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 focus:outline-none"
                          />
                          <input
                            type="number"
                            placeholder="Type Base Price (Optional)"
                            value={v.price}
                            onChange={(e) => {
                              const updated = [...variantsToAdd];
                              updated[vIndex].price = e.target.value;
                              setVariantsToAdd(updated);
                            }}
                            className="px-3 py-2 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 focus:outline-none"
                          />
                        </div>

                        {/* Nested Type Services */}
                        <div className="pl-3 border-l-2 border-gold-polished/30 space-y-2">
                          <p className="text-[10px] font-bold uppercase text-slate-400">
                            Nested Services for this Type
                          </p>
                          {v.services.map((s, sIndex) => (
                            <div key={sIndex} className="flex gap-2 items-center">
                              <input
                                type="text"
                                placeholder="Service Name"
                                value={s.name}
                                onChange={(e) => {
                                  const updated = [...variantsToAdd];
                                  updated[vIndex].services[sIndex].name = e.target.value;
                                  setVariantsToAdd(updated);
                                }}
                                className="flex-1 px-2 py-1 text-xs rounded-lg border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/50"
                              />
                              <input
                                type="number"
                                placeholder="Price"
                                value={s.price}
                                onChange={(e) => {
                                  const updated = [...variantsToAdd];
                                  updated[vIndex].services[sIndex].price = e.target.value;
                                  setVariantsToAdd(updated);
                                }}
                                className="w-20 px-2 py-1 text-xs rounded-lg border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/50"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...variantsToAdd];
                              updated[vIndex].services.push({ name: '', price: '' });
                              setVariantsToAdd(updated);
                            }}
                            className="text-[10px] font-bold text-gold-polished dark:text-gold-metallic flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" /> Add Type Service
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() =>
                        setVariantsToAdd([
                          ...variantsToAdd,
                          { name: '', price: '', services: [] },
                        ])
                      }
                      className="text-xs font-bold text-gold-polished dark:text-gold-metallic flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Another Type
                    </button>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4 border-t border-navy-deep/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setAddClothSubModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase shadow-md"
                  >
                    Save Sub-Items
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: ADD TYPE SERVICE (#4) */}
      <AnimatePresence>
        {addVariantServiceModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl border border-navy-deep/10 dark:border-white/10 bg-white dark:bg-canvas-dark p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black uppercase text-navy-deep dark:text-alabaster">
                  Add Type Service
                </h3>
                <button
                  onClick={() => setAddVariantServiceModalOpen(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-navy-deep dark:hover:text-alabaster"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddVariantService} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Service Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Deep Wash"
                    value={vpsToAdd.name}
                    onChange={(e) => setVpsToAdd({ ...vpsToAdd, name: e.target.value })}
                    className="px-3 py-2.5 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Service Price
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 15.00"
                    value={vpsToAdd.price}
                    onChange={(e) => setVpsToAdd({ ...vpsToAdd, price: e.target.value })}
                    className="px-3 py-2.5 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setAddVariantServiceModalOpen(null)}
                    className="px-4 py-2 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase shadow-md"
                  >
                    Add Service
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: EDIT PARENT CLOTH (#6) */}
      <AnimatePresence>
        {editClothModalOpen && activeCloth && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-deep/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl border border-navy-deep/10 dark:border-white/10 bg-white dark:bg-canvas-dark p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black uppercase text-navy-deep dark:text-alabaster">
                  Edit Cloth Configuration
                </h3>
                <button
                  onClick={() => setEditClothModalOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-navy-deep dark:hover:text-alabaster"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveClothEdit} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Cloth Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editClothForm.name}
                    onChange={(e) =>
                      setEditClothForm({ ...editClothForm, name: e.target.value })
                    }
                    className="px-3 py-2.5 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Image URL
                  </label>
                  <input
                    type="text"
                    value={editClothForm.imageUrl}
                    onChange={(e) =>
                      setEditClothForm({ ...editClothForm, imageUrl: e.target.value })
                    }
                    className="px-3 py-2.5 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Description
                  </label>
                  <textarea
                    rows={2}
                    value={editClothForm.description}
                    onChange={(e) =>
                      setEditClothForm({
                        ...editClothForm,
                        description: e.target.value,
                      })
                    }
                    className="px-3 py-2 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 focus:outline-none"
                  />
                </div>

                {/* Base Price Controls (Conditional on types) */}
                {activeCloth.variants.length === 0 ? (
                  <div className="space-y-3 pt-2 border-t border-navy-deep/10 dark:border-white/10">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">
                      Pricing Mode
                    </p>
                    <div className="flex flex-col gap-2">
                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editClothForm.isSpecialOrder}
                          onChange={(e) =>
                            setEditClothForm({
                              ...editClothForm,
                              isSpecialOrder: e.target.checked,
                              isPriceNull: false,
                              price: e.target.checked ? '' : editClothForm.price,
                            })
                          }
                          className="rounded text-gold-polished"
                        />
                        Toggle Special Order (Empty Price Field)
                      </label>

                      <label className="flex items-center gap-2 text-xs cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editClothForm.isPriceNull}
                          onChange={(e) =>
                            setEditClothForm({
                              ...editClothForm,
                              isPriceNull: e.target.checked,
                              isSpecialOrder: false,
                              price: e.target.checked ? '' : editClothForm.price,
                            })
                          }
                          className="rounded text-gold-polished"
                        />
                        Toggle Price Null (Not a Direct Service)
                      </label>
                    </div>

                    {!editClothForm.isSpecialOrder && !editClothForm.isPriceNull && (
                      <div className="flex flex-col gap-1 pt-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Base Price
                        </label>
                        <input
                          type="number"
                          value={editClothForm.price}
                          onChange={(e) =>
                            setEditClothForm({
                              ...editClothForm,
                              price: e.target.value,
                            })
                          }
                          className="px-3 py-2 text-xs rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs">
                    Base price editing is disabled because this cloth has types.
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setEditClothModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-bold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase shadow-md"
                  >
                    Save Changes
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