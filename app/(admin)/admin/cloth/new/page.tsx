//app/(admin)/admin/cloth/new/page.tsx
'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Swiper as SwiperClass } from 'swiper';
import {
  Shirt,
  Tag,
  DollarSign,
  Sparkles,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  AlertCircle,
  HelpCircle,
  Layers,
  Wrench,
  Image as ImageIcon,
  UploadCloud,
} from 'lucide-react';

import 'swiper/css';

// TypeScript Interfaces
interface VariantPartialServiceInput {
  name: string;
  price: number | '';
  isSpecialOrder: boolean;
}

interface VariantInput {
  name: string;
  price: number | '';
  isPriceNull: boolean;
  partialServices: VariantPartialServiceInput[];
}

interface ClothPartialServiceInput {
  name: string;
  price: number | '';
  isSpecialOrder: boolean;
}

export default function CreateClothPage() {
  const router = useRouter();
  const [swiper, setSwiper] = useState<SwiperClass | null>(null);
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // --- Step 1: Basic Item Details ---
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>(''); // fallback URL input
  const [imageFile, setImageFile] = useState<File | null>(null); // file upload
  const [imagePreview, setImagePreview] = useState<string | null>(null); // preview
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pricingMode, setPricingMode] = useState<'standard' | 'special' | 'noservice'>('standard');
  const [basePrice, setBasePrice] = useState<number | ''>('');

  // --- Step 2: Path Choice ---
  const [chosenPath, setChosenPath] = useState<'submit' | 'variant' | 'partial'>('submit');

  // --- Step 3: Variants ---
  const [variants, setVariants] = useState<VariantInput[]>([]);

  // --- Step 4: Individual Services ---
  const [clothPartialServices, setClothPartialServices] = useState<ClothPartialServiceInput[]>([]);

  const hasBasePriceInStep1 = pricingMode === 'standard' && basePrice !== '' && Number(basePrice) > 0;

  const goToStep = (index: number) => {
    if (swiper) {
      swiper.slideTo(index);
      setActiveStep(index);
    }
  };

  // --- Image File Handler ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImageUrl(''); // clear URL fallback
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- Step 1 Validation & Next ---
  const handleStep1Next = () => {
    setErrorMessage(null);
    if (!name.trim()) {
      setErrorMessage('Please enter a name for the laundry item.');
      return;
    }
    if (pricingMode === 'standard' && (basePrice === '' || Number(basePrice) <= 0)) {
      setErrorMessage('Please enter a valid standard price or choose a different pricing option.');
      return;
    }

    if (hasBasePriceInStep1) {
      setChosenPath('partial');
    }

    goToStep(1);
  };

  // --- Step 2 Decision ---
  const handleStep2Next = () => {
    setErrorMessage(null);
    if (chosenPath === 'submit') {
      handleSubmit();
    } else if (chosenPath === 'variant') {
      if (variants.length === 0) addVariant();
      goToStep(2);
    } else if (chosenPath === 'partial') {
      if (clothPartialServices.length === 0) addClothPartialService();
      goToStep(3);
    }
  };

  // --- Variant Handlers ---
  const addVariant = () => {
    setVariants((prev) => [...prev, { name: '', price: '', isPriceNull: false, partialServices: [] }]);
  };
  const removeVariant = (index: number) => setVariants((prev) => prev.filter((_, i) => i !== index));
  const updateVariant = (index: number, field: keyof VariantInput, value: any) =>
    setVariants((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  const addVariantPartialService = (variantIndex: number) =>
    setVariants((prev) => {
      const updated = [...prev];
      updated[variantIndex].partialServices.push({ name: '', price: '', isSpecialOrder: false });
      return updated;
    });
  const removeVariantPartialService = (variantIndex: number, vpsIndex: number) =>
    setVariants((prev) => {
      const updated = [...prev];
      updated[variantIndex].partialServices = updated[variantIndex].partialServices.filter((_, i) => i !== vpsIndex);
      return updated;
    });
  const updateVariantPartialService = (variantIndex: number, vpsIndex: number, field: keyof VariantPartialServiceInput, value: any) =>
    setVariants((prev) => {
      const updated = [...prev];
      updated[variantIndex].partialServices[vpsIndex] = {
        ...updated[variantIndex].partialServices[vpsIndex],
        [field]: value,
      };
      return updated;
    });

  // --- Cloth Partial Service Handlers ---
  const addClothPartialService = () =>
    setClothPartialServices((prev) => [...prev, { name: '', price: '', isSpecialOrder: false }]);
  const removeClothPartialService = (index: number) => setClothPartialServices((prev) => prev.filter((_, i) => i !== index));
  const updateClothPartialService = (index: number, field: keyof ClothPartialServiceInput, value: any) =>
    setClothPartialServices((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });

  // --- Final Submit Handler (multipart or JSON) ---
  const handleSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        basePrice: pricingMode === 'standard' ? Number(basePrice) : null,
        isPriceNull: pricingMode !== 'standard',
        variants: chosenPath === 'variant' ? variants : [],
        partialServices: chosenPath === 'partial' ? clothPartialServices : [],
      };

      // Validate complex structures before sending
      if (chosenPath === 'variant') {
        if (variants.length === 0) throw new Error('Please add at least one type option.');
        for (const v of variants) {
          if (!v.name.trim()) throw new Error('All type options must have a name.');
          if (!v.isPriceNull && (v.price === '' || v.price === null))
            throw new Error(`The type "${v.name}" needs a price unless marked as custom quote.`);
          for (const vps of v.partialServices) {
            if (!vps.name.trim()) throw new Error('Each extra service under a type must have a name.');
            if (!vps.isSpecialOrder && (vps.price === '' || vps.price === null))
              throw new Error(`Extra service "${vps.name}" under type "${v.name}" requires a price.`);
          }
        }
      } else if (chosenPath === 'partial') {
        if (clothPartialServices.length === 0) throw new Error('Please add at least one individual service.');
        for (const s of clothPartialServices) {
          if (!s.name.trim()) throw new Error('Each individual service must have a name.');
          if (!s.isSpecialOrder && (s.price === '' || s.price === null))
            throw new Error(`Individual service "${s.name}" needs a price.`);
        }
      }

      let res: Response;

      if (imageFile) {
        // ----- Multipart upload -----
        const formData = new FormData();
        formData.append('name', payload.name);
        if (payload.description) formData.append('description', payload.description);
        formData.append('basePrice', String(payload.basePrice ?? ''));
        formData.append('isPriceNull', String(payload.isPriceNull));
        formData.append('variants', JSON.stringify(payload.variants.map(v => ({
          name: v.name.trim(),
          price: v.isPriceNull ? null : Number(v.price),
          isPriceNull: v.isPriceNull,
          partialServices: v.partialServices.map(vps => ({
            name: vps.name.trim(),
            price: vps.isSpecialOrder ? null : Number(vps.price),
          })),
        }))));
        formData.append('partialServices', JSON.stringify(payload.partialServices.map(s => ({
          name: s.name.trim(),
          price: s.isSpecialOrder ? null : Number(s.price),
        }))));
        formData.append('image', imageFile);

        res = await fetch('/api/cloth', {
          method: 'POST',
          body: formData, // no Content-Type header – browser sets it
        });
      } else {
        // ----- JSON fallback (with optional imageUrl) -----
        const body: any = {
          name: payload.name,
          description: payload.description,
          imageUrl: imageUrl.trim() || undefined,
          basePrice: payload.basePrice,
          isPriceNull: payload.isPriceNull,
          variants: payload.variants.map(v => ({
            name: v.name.trim(),
            price: v.isPriceNull ? null : Number(v.price),
            isPriceNull: v.isPriceNull,
            partialServices: v.partialServices.map(vps => ({
              name: vps.name.trim(),
              price: vps.isSpecialOrder ? null : Number(vps.price),
            })),
          })),
          partialServices: payload.partialServices.map(s => ({
            name: s.name.trim(),
            price: s.isSpecialOrder ? null : Number(s.price),
          })),
        };

        res = await fetch('/api/cloth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create laundry service.');

      router.push('/service');
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full pt-28 pb-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto flex-1 flex flex-col justify-center">
      {/* Title */}
      <div className="text-center mb-10">
        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-gold-polished/10 dark:bg-gold-metallic/10 text-gold-polished dark:text-gold-metallic rounded-full border border-gold-polished/20 mb-3 inline-block">
          Add New Item
        </span>
        <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight">
          Create New Laundry{' '}
          <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
            Item
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-blue dark:text-platinum mt-2 max-w-lg mx-auto">
          Set up fabric items, define types, and add individual cleaning services.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mb-8 w-full max-w-xl mx-auto flex items-center justify-between relative px-4">
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-navy-deep/10 dark:bg-white/10 -translate-y-1/2 z-0" />
        {[
          { label: 'Item Info', icon: Shirt },
          { label: 'Pricing Plan', icon: Layers },
          { label: 'Types & Extras', icon: Wrench },
        ].map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === idx || (activeStep === 3 && idx === 2);
          const isDone = activeStep > idx;
          return (
            <div key={idx} className="relative z-10 flex flex-col items-center gap-1.5">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                  isActive
                    ? 'bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark shadow-lg shadow-gold-metallic/20 scale-110'
                    : isDone
                    ? 'bg-green-500 text-white'
                    : 'bg-white dark:bg-canvas-dark border border-navy-deep/10 dark:border-white/10 text-slate-400'
                }`}
              >
                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-gold-polished dark:text-gold-metallic' : 'text-slate-400'}`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Error Alert */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-500 text-xs font-semibold flex items-center gap-3 max-w-3xl mx-auto w-full"
          >
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form Container */}
      <div className="w-full rounded-3xl border border-navy-deep/10 dark:border-white/10 liquid-glass-light dark:liquid-glass-dark p-6 sm:p-10 shadow-2xl relative overflow-hidden">
        <Swiper onSwiper={setSwiper} allowTouchMove={false} spaceBetween={40} slidesPerView={1} className="w-full">
          {/* ====== STEP 1: ITEM DETAILS ====== */}
          <SwiperSlide>
            <div className="flex flex-col gap-6">
              <div className="border-b border-navy-deep/10 dark:border-white/10 pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Shirt className="w-5 h-5 text-gold-polished dark:text-gold-metallic" />
                  Step 1: Item Details & Pricing Setup
                </h2>
                <p className="text-xs text-slate-blue dark:text-platinum opacity-80 mt-1">
                  Provide the basic information for this laundry item and decide how pricing works.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Name */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Item Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Traditional Agbada 3-Piece, Tuxedo Suit, Silk Dress"
                    className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/40 text-sm focus:outline-none focus:border-gold-polished transition-all"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Description (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Special care notes, handling instructions..."
                    className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/40 text-sm focus:outline-none focus:border-gold-polished transition-all resize-none"
                  />
                </div>

                {/* Image Section */}
                <div className="flex flex-col gap-2 sm:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5 text-gold-polished" /> Item Image (Optional)
                  </label>
                  
                  <div className="flex flex-col sm:flex-row gap-4">
                    {/* Upload Box */}
                    <div
                      className={`relative flex-1 border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all ${
                        imageFile
                          ? 'border-green-500 bg-green-50/20'
                          : 'border-navy-deep/20 dark:border-white/20 hover:border-gold-polished hover:bg-navy-deep/5 dark:hover:bg-white/5'
                      }`}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {imagePreview ? (
                        <div className="relative w-full">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full max-h-32 object-contain rounded-lg"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearFile();
                            }}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white hover:bg-red-600 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-8 h-8 text-slate-400 mb-2" />
                          <p className="text-xs font-medium text-slate-400">
                            Drop your image here or <span className="text-gold-polished underline">browse</span>
                          </p>
                          <p className="text-[10px] text-slate-400 opacity-70 mt-1">
                            PNG, JPG, WEBP (max 5MB)
                          </p>
                        </>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </div>

                    {/* URL Fallback */}
                    {!imageFile && (
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[10px] font-semibold text-slate-400 uppercase">
                          Or paste an image URL
                        </label>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/photo-..."
                          className="w-full px-4 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/40 text-xs focus:outline-none focus:border-gold-polished transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Pricing Mode */}
                <div className="flex flex-col gap-2 sm:col-span-2 mt-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Pricing Type
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setPricingMode('standard')}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        pricingMode === 'standard'
                          ? 'border-gold-polished dark:border-gold-metallic bg-gold-polished/10 dark:bg-gold-metallic/10 shadow-md'
                          : 'border-navy-deep/10 dark:border-white/10 hover:bg-navy-deep/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <DollarSign className="w-5 h-5 text-gold-polished dark:text-gold-metallic mb-2" />
                      <div>
                        <p className="text-xs font-bold">Standard Price</p>
                        <p className="text-[10px] text-slate-400">Fixed price for this item</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPricingMode('special');
                        setBasePrice('');
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        pricingMode === 'special'
                          ? 'border-gold-polished dark:border-gold-metallic bg-gold-polished/10 dark:bg-gold-metallic/10 shadow-md'
                          : 'border-navy-deep/10 dark:border-white/10 hover:bg-navy-deep/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Sparkles className="w-5 h-5 text-gold-polished dark:text-gold-metallic mb-2" />
                      <div>
                        <p className="text-xs font-bold">Custom Quote</p>
                        <p className="text-[10px] text-slate-400">Price given after inspection</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setPricingMode('noservice');
                        setBasePrice('');
                      }}
                      className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                        pricingMode === 'noservice'
                          ? 'border-gold-polished dark:border-gold-metallic bg-gold-polished/10 dark:bg-gold-metallic/10 shadow-md'
                          : 'border-navy-deep/10 dark:border-white/10 hover:bg-navy-deep/5 dark:hover:bg-white/5'
                      }`}
                    >
                      <Tag className="w-5 h-5 text-gold-polished dark:text-gold-metallic mb-2" />
                      <div>
                        <p className="text-xs font-bold">Priced by Type</p>
                        <p className="text-[10px] text-slate-400">Not a standalone service</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Base Price Input */}
                {pricingMode === 'standard' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="flex flex-col gap-1.5 sm:col-span-2"
                  >
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Standard Price (₦) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 2500"
                      className="w-full px-4 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-navy-deep/40 text-sm font-bold focus:outline-none focus:border-gold-polished transition-all"
                    />
                  </motion.div>
                )}
              </div>

              <div className="flex justify-end pt-4 border-t border-navy-deep/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={handleStep1Next}
                  className="px-8 py-3.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
                >
                  Continue to Pricing Plan <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </SwiperSlide>

          {/* ====== STEP 2: PATHWAY SELECTION ====== */}
          <SwiperSlide>
            <div className="flex flex-col gap-6">
              <div className="border-b border-navy-deep/10 dark:border-white/10 pb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Layers className="w-5 h-5 text-gold-polished dark:text-gold-metallic" />
                  Step 2: Pricing & Options Setup
                </h2>
                <p className="text-xs text-slate-blue dark:text-platinum opacity-80 mt-1">
                  Choose how customers will order this item — with types, extra services, or as is.
                </p>
              </div>

              {hasBasePriceInStep1 && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Because you entered a <b>standard price</b> earlier, this item can only have individual extra services. Types are not available.
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Submit Now */}
                <button
                  type="button"
                  onClick={() => setChosenPath('submit')}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    chosenPath === 'submit'
                      ? 'border-gold-polished dark:border-gold-metallic bg-gold-polished/10 dark:bg-gold-metallic/10 shadow-lg scale-[1.02]'
                      : 'border-navy-deep/10 dark:border-white/10 hover:bg-navy-deep/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-gold-polished/20 flex items-center justify-center text-gold-polished mb-3">
                      <Check className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">Regular Item</h3>
                    <p className="text-[11px] text-slate-blue dark:text-platinum opacity-70 leading-relaxed">
                      No extra types or services needed. Ready to publish.
                    </p>
                  </div>
                  <span className="mt-4 text-[10px] font-black uppercase text-gold-polished dark:text-gold-metallic">
                    Save Now
                  </span>
                </button>

                {/* Variants */}
                <button
                  type="button"
                  disabled={hasBasePriceInStep1}
                  onClick={() => setChosenPath('variant')}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    hasBasePriceInStep1
                      ? 'opacity-40 cursor-not-allowed border-dashed border-slate-300'
                      : chosenPath === 'variant'
                      ? 'border-gold-polished dark:border-gold-metallic bg-gold-polished/10 dark:bg-gold-metallic/10 shadow-lg scale-[1.02]'
                      : 'border-navy-deep/10 dark:border-white/10 hover:bg-navy-deep/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-purple-400 mb-3">
                      <Layers className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">Has Different Types</h3>
                    <p className="text-[11px] text-slate-blue dark:text-platinum opacity-70 leading-relaxed">
                      Add options like Short Sleeve, Long Sleeve, Heavy Fabric, etc.
                    </p>
                  </div>
                  <span className="mt-4 text-[10px] font-black uppercase text-purple-400">
                    Setup Types
                  </span>
                </button>

                {/* Partial Services */}
                <button
                  type="button"
                  onClick={() => setChosenPath('partial')}
                  className={`p-5 rounded-2xl border text-left flex flex-col justify-between transition-all ${
                    chosenPath === 'partial'
                      ? 'border-gold-polished dark:border-gold-metallic bg-gold-polished/10 dark:bg-gold-metallic/10 shadow-lg scale-[1.02]'
                      : 'border-navy-deep/10 dark:border-white/10 hover:bg-navy-deep/5 dark:hover:bg-white/5'
                  }`}
                >
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 mb-3">
                      <Wrench className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold mb-1">Individual Services</h3>
                    <p className="text-[11px] text-slate-blue dark:text-platinum opacity-70 leading-relaxed">
                      Add extra services like Pressing Only, Stain Removal.
                    </p>
                  </div>
                  <span className="mt-4 text-[10px] font-black uppercase text-blue-400">
                    Setup Services
                  </span>
                </button>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-navy-deep/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => goToStep(0)}
                  className="px-6 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleStep2Next}
                  className="px-8 py-3.5 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {chosenPath === 'submit' ? (
                    isSubmitting ? 'Saving...' : 'Finish & Save Item'
                  ) : (
                    <>Continue to Next Step <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </div>
            </div>
          </SwiperSlide>

          {/* ====== STEP 3: TYPES BUILDER ====== */}
          <SwiperSlide>
            <div className="flex flex-col gap-6">
              <div className="border-b border-navy-deep/10 dark:border-white/10 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Layers className="w-5 h-5 text-purple-400" />
                    Step 3: Define Types & Their Services
                  </h2>
                  <p className="text-xs text-slate-blue dark:text-platinum opacity-80 mt-1">
                    Add each type with its own pricing, plus optional extra services under that type.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addVariant}
                  className="px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Type
                </button>
              </div>

              <div className="flex flex-col gap-6 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {variants.map((variant, vIdx) => (
                  <div
                    key={vIdx}
                    className="p-5 rounded-2xl border border-navy-deep/10 dark:border-white/10 bg-white/30 dark:bg-navy-deep/30 flex flex-col gap-4 relative group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">
                        Type #{vIdx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeVariant(vIdx)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">
                          Type Name *
                        </label>
                        <input
                          type="text"
                          value={variant.name}
                          onChange={(e) => updateVariant(vIdx, 'name', e.target.value)}
                          placeholder="e.g. Silk Material, Heavy Cotton, Short Sleeve"
                          className="w-full px-4 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/60 dark:bg-navy-deep/60 text-xs font-medium focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-400 uppercase">
                            Price (₦) *
                          </label>
                          <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={variant.isPriceNull}
                              onChange={(e) => updateVariant(vIdx, 'isPriceNull', e.target.checked)}
                              className="rounded border-navy-deep/20 text-purple-500 focus:ring-purple-400"
                            />
                            Custom Quote
                          </label>
                        </div>
                        <input
                          type="number"
                          disabled={variant.isPriceNull}
                          value={variant.isPriceNull ? '' : variant.price}
                          onChange={(e) =>
                            updateVariant(vIdx, 'price', e.target.value === '' ? '' : Number(e.target.value))
                          }
                          placeholder={variant.isPriceNull ? 'Price after inspection' : 'e.g. 1500'}
                          className="w-full px-4 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/60 dark:bg-navy-deep/60 text-xs font-medium focus:outline-none focus:border-purple-400 disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {/* Extra services for this variant */}
                    <div className="mt-2 border-t border-navy-deep/10 dark:border-white/10 pt-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Extra Services for this Type (Optional)
                        </span>
                        <button
                          type="button"
                          onClick={() => addVariantPartialService(vIdx)}
                          className="text-[10px] font-bold uppercase text-purple-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Add Service
                        </button>
                      </div>
                      <div className="flex flex-col gap-2">
                        {variant.partialServices.map((vps, vpsIdx) => (
                          <div
                            key={vpsIdx}
                            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white/40 dark:bg-navy-deep/40 p-2.5 rounded-xl border border-navy-deep/5 dark:border-white/5"
                          >
                            <input
                              type="text"
                              value={vps.name}
                              onChange={(e) => updateVariantPartialService(vIdx, vpsIdx, 'name', e.target.value)}
                              placeholder="Service name (e.g. Ironing only)"
                              className="sm:col-span-6 px-3 py-1.5 rounded-lg border border-navy-deep/10 dark:border-white/10 bg-transparent text-xs focus:outline-none focus:border-purple-400"
                            />
                            <input
                              type="number"
                              disabled={vps.isSpecialOrder}
                              value={vps.isSpecialOrder ? '' : vps.price}
                              onChange={(e) =>
                                updateVariantPartialService(vIdx, vpsIdx, 'price', e.target.value === '' ? '' : Number(e.target.value))
                              }
                              placeholder={vps.isSpecialOrder ? 'Custom Quote' : 'Price'}
                              className="sm:col-span-3 px-3 py-1.5 rounded-lg border border-navy-deep/10 dark:border-white/10 bg-transparent text-xs focus:outline-none focus:border-purple-400 disabled:opacity-50"
                            />
                            <label className="sm:col-span-2 flex items-center gap-1 text-[9px] font-semibold text-slate-400 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={vps.isSpecialOrder}
                                onChange={(e) => updateVariantPartialService(vIdx, vpsIdx, 'isSpecialOrder', e.target.checked)}
                                className="rounded text-purple-500 text-[10px]"
                              />
                              Quote
                            </label>
                            <button
                              type="button"
                              onClick={() => removeVariantPartialService(vIdx, vpsIdx)}
                              className="sm:col-span-1 text-slate-400 hover:text-red-500 justify-self-end p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-navy-deep/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-6 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="px-8 py-3.5 rounded-xl bg-purple-500 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Item...' : 'Finish & Save Item'}
                </button>
              </div>
            </div>
          </SwiperSlide>

          {/* ====== STEP 4: INDIVIDUAL SERVICES BUILDER ====== */}
          <SwiperSlide>
            <div className="flex flex-col gap-6">
              <div className="border-b border-navy-deep/10 dark:border-white/10 pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Wrench className="w-5 h-5 text-blue-400" />
                    Step 4: Individual Services
                  </h2>
                  <p className="text-xs text-slate-blue dark:text-platinum opacity-80 mt-1">
                    Add standalone extra services available for this item, like washing only or stain removal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addClothPartialService}
                  className="px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Service
                </button>
              </div>

              <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                {clothPartialServices.map((service, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-4 rounded-2xl border border-navy-deep/10 dark:border-white/10 bg-white/30 dark:bg-navy-deep/30 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center"
                  >
                    <div className="sm:col-span-5 flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Service Name *
                      </label>
                      <input
                        type="text"
                        value={service.name}
                        onChange={(e) => updateClothPartialService(sIdx, 'name', e.target.value)}
                        placeholder="e.g. Ironing Only, Stain Removal"
                        className="w-full px-3.5 py-2 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/60 dark:bg-navy-deep/60 text-xs focus:outline-none focus:border-blue-400"
                      />
                    </div>
                    <div className="sm:col-span-4 flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        Price (₦) *
                      </label>
                      <input
                        type="number"
                        disabled={service.isSpecialOrder}
                        value={service.isSpecialOrder ? '' : service.price}
                        onChange={(e) =>
                          updateClothPartialService(sIdx, 'price', e.target.value === '' ? '' : Number(e.target.value))
                        }
                        placeholder={service.isSpecialOrder ? 'Custom Quote' : 'e.g. 800'}
                        className="w-full px-3.5 py-2 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/60 dark:bg-navy-deep/60 text-xs focus:outline-none focus:border-blue-400 disabled:opacity-50"
                      />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-1.5 pt-4 sm:pt-0">
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={service.isSpecialOrder}
                          onChange={(e) => updateClothPartialService(sIdx, 'isSpecialOrder', e.target.checked)}
                          className="rounded text-blue-500 focus:ring-blue-400"
                        />
                        Custom Quote
                      </label>
                    </div>
                    <div className="sm:col-span-1 flex justify-end pt-4 sm:pt-0">
                      <button
                        type="button"
                        onClick={() => removeClothPartialService(sIdx)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-navy-deep/10 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="px-6 py-3 rounded-xl border border-navy-deep/10 dark:border-white/10 text-xs font-bold uppercase tracking-wider hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="px-8 py-3.5 rounded-xl bg-blue-500 text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving Item...' : 'Finish & Save Item'}
                </button>
              </div>
            </div>
          </SwiperSlide>
        </Swiper>
      </div>
    </div>
  );
}