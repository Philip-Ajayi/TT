// app/(customer)/service/page.tsx
'use client';

import React, { useEffect, useState } from "react";
import { useCatalog, CatalogItem } from "@/context/cart-context";
import { useCart } from "@/context/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, CheckCircle, HelpCircle } from "lucide-react";
import ServiceCatalogLoading from "@/app/loading";

export default function ServicesPage() {
  const fetchCatalog = useCatalog();
  const { addItem, currency, stack } = useCart();
  
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Track which cloth type is selected for each item
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  // --- Fallback currency code for display ---
  const displayCurrency = currency?.code || 'NGN';

  useEffect(() => {
    let active = true;
    async function loadCatalogData() {
      try {
        setLoading(true);
        const data = await fetchCatalog();
        if (active) {
          setCatalog(data);
          
          // Preselect the first cloth type for each item that has types
          const defaults: Record<string, string> = {};
          data.forEach((item) => {
            if (item.variants && item.variants.length > 0) {
              defaults[item.id] = item.variants[0].id;
            }
          });
          setSelectedVariants(defaults);
        }
      } catch (err: any) {
        if (active) setError(err.message || "Could not load services. Please try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadCatalogData();
    return () => { active = false; };
  }, [fetchCatalog, currency]);

  const handleVariantRadioChange = (clothId: string, variantId: string) => {
    setSelectedVariants((prev) => ({ ...prev, [clothId]: variantId }));
  };

  // Helper to add an item with correct display name
  const triggerAddToCart = (
    item: any, 
    type: 'cloth' | 'variant' | 'clothPartialService' | 'variantPartialService',
    context: {
      clothId?: string;
      variantId?: string;
      clothPartialServiceId?: string;
      variantPartialServiceId?: string;
      clothName?: string;
      variantName?: string;
    }
  ) => {
    let displayName = item.name;
    if (type === 'variant') {
      displayName = `${item.name} (${context.clothName || ''})`;
    } else if (type === 'clothPartialService') {
      displayName = `${item.name} (${context.clothName || ''})`;
    } else if (type === 'variantPartialService') {
      displayName = `${item.name} (${context.clothName || ''}, ${context.variantName || ''})`;
    }
    
    addItem({
      id: `${type}_${item.id}_${Date.now()}`,
      type,
      name: displayName,
      processingRuleId: '',
      quantity: 1,
      deliveryMode: null,
      basePriceNgn: item.price || null,
      finalPrice: item.price || null,
      isSpecial: !!item.isspecial || !item.price,
      clothId: context.clothId,
      variantId: context.variantId,
      clothPartialServiceId: context.clothPartialServiceId,
      variantPartialServiceId: context.variantPartialServiceId,
    });
  };

  if (loading) return <ServiceCatalogLoading />;

  if (error) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-4 pt-28">
        <div className="liquid-glass-light dark:liquid-glass-dark border border-red-500/30 p-8 rounded-3xl max-w-md">
          <HelpCircle className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
          <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
          <p className="text-sm text-slate-blue dark:text-platinum mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2.5 rounded-xl bg-gold-polished text-white text-xs font-bold uppercase tracking-wider">Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pt-32 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Title Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-4xl font-black uppercase tracking-tight mb-4">
          Laundry Service{" "}
          <span className="bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel bg-clip-text text-transparent">
            Menu
          </span>
        </h1>
        <p className="text-slate-blue dark:text-platinum text-sm">
          Choose how you want your clothes cleaned. Prices update based on your selections.
        </p>
      </div>

      {/* Grid Wrapper */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start">
        {catalog.map((cloth) => {
          const activeVariantId = selectedVariants[cloth.id];
          const activeVariant = cloth.variants?.find((v) => v.id === activeVariantId);

          const basePriceVisible = cloth.price !== undefined || cloth.isspecial;

          return (
            <motion.div
              layout
              key={cloth.id}
              className="rounded-3xl border border-navy-deep/10 dark:border-white/10 overflow-hidden liquid-glass-light dark:liquid-glass-dark hover:border-gold-polished/40 dark:hover:border-gold-metallic/30 shadow-xl transition-all duration-300 flex flex-col h-full"
            >
              {/* Image Section */}
              <div className="relative w-full h-48 bg-navy-deep overflow-hidden">
                {cloth.img ? (
                  <img
                    src={cloth.img}
                    alt={cloth.name}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-navy-deep to-canvas-dark flex items-center justify-center text-[10px] font-black tracking-widest uppercase text-gold-metallic/40">
                    Quality Fabric Care
                  </div>
                )}
              </div>

              {/* Core Content Box */}
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h2 className="text-xl font-bold tracking-tight text-navy-deep dark:text-alabaster">
                      {cloth.name}
                    </h2>
                    
                    {basePriceVisible && (
                      <button
                        onClick={() => triggerAddToCart(cloth, 'cloth', { clothId: cloth.id })}
                        className="p-2 rounded-xl bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark flex items-center gap-1.5 text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
                        title="Add this item to cart"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span className="text-[11px]">
                          {cloth.price ? `${displayCurrency} ${cloth.price.toFixed(2)}` : "Special"}
                        </span>
                      </button>
                    )}
                  </div>

                  {cloth.description && (
                    <p className="text-xs text-slate-blue dark:text-platinum leading-relaxed mb-6 opacity-80">
                      {cloth.description}
                    </p>
                  )}

                  {/* SECTION A: Cloth type selection */}
                  {cloth.variants && cloth.variants.length > 0 && (
                    <div className="mb-6 border-t border-navy-deep/5 dark:border-white/5 pt-4">
                      <h3 className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-3">
                        Choose Cloth Type
                      </h3>
                      
                      <div className="flex flex-wrap gap-2 mb-4">
                        {cloth.variants.map((variant) => {
                          const isSelected = activeVariantId === variant.id;
                          const variantPriceVisible = variant.price !== undefined || variant.isspecial;

                          return (
                            <label
                              key={variant.id}
                              className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer border transition-all ${
                                isSelected
                                  ? "bg-navy-deep/5 dark:bg-white/5 border-gold-polished dark:border-gold-metallic"
                                  : "border-transparent bg-navy-deep-[5%]"
                              }`}
                            >
                              <input
                                type="radio"
                                name={`variant_group_${cloth.id}`}
                                checked={isSelected}
                                onChange={() => handleVariantRadioChange(cloth.id, variant.id)}
                                className="sr-only"
                              />
                              <div className={`w-3 h-3 rounded-full border flex items-center justify-center transition-colors ${isSelected ? 'border-gold-polished dark:border-gold-metallic' : 'border-slate-400'}`}>
                                {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-gold-polished dark:bg-gold-metallic" />}
                              </div>
                              <span className="text-xs font-bold">{variant.name}</span>

                              {variantPriceVisible && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    triggerAddToCart(variant, 'variant', { 
                                      clothId: cloth.id, 
                                      variantId: variant.id,
                                      clothName: cloth.name,
                                    });
                                  }}
                                  className="ml-1 p-1 rounded-lg bg-gold-polished/20 text-gold-polished dark:text-gold-pastel flex items-center gap-1 hover:bg-gold-polished/30"
                                >
                                  <ShoppingCart className="w-2.5 h-2.5" />
                                  <span className="text-[9px] font-black">
                                    {variant.price ? `${displayCurrency} ${variant.price.toFixed(2)}` : "Special"}
                                  </span>
                                </button>
                              )}
                            </label>
                          );
                        })}
                      </div>

                      {/* Extra services available only for the selected cloth type */}
                      <AnimatePresence mode="wait">
                        {activeVariant && activeVariant.variantPartialServices && (
                          <motion.div
                            key={activeVariant.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 5 }}
                            className="pl-3 border-l-2 border-gold-polished/30 dark:border-gold-metallic/20 space-y-2 mt-2"
                          >
                            <p className="text-[9px] font-black uppercase text-slate-400 tracking-wider mb-1">
                              Options for {activeVariant.name}
                            </p>
                            {activeVariant.variantPartialServices.map((vps) => (
                              <div key={vps.id} className="flex items-center justify-between text-xs py-1 group">
                                <span className="text-slate-700 dark:text-platinum font-medium">{vps.name}</span>
                                
                                <button
                                  onClick={() => triggerAddToCart(vps, 'variantPartialService', { 
                                    clothId: cloth.id, 
                                    variantId: activeVariant.id, 
                                    variantPartialServiceId: vps.id,
                                    clothName: cloth.name,
                                    variantName: activeVariant.name,
                                  })}
                                  className="px-2 py-1 rounded-lg bg-white/50 dark:bg-canvas-dark border border-navy-deep/10 dark:border-white/10 group-hover:border-gold-polished dark:group-hover:border-gold-metallic flex items-center gap-1.5 text-[10px] font-bold transition-all"
                                >
                                  <ShoppingCart className="w-2.5 h-2.5 text-gold-polished dark:text-gold-metallic" />
                                  <span>
                                    {vps.price ? `${displayCurrency} ${vps.price.toFixed(2)}` : "Special"}
                                  </span>
                                </button>
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* SECTION B: Extra services that apply to the whole cloth item */}
                  {cloth.clothPartialServices && cloth.clothPartialServices.length > 0 && (
                    <div className="border-t border-navy-deep/5 dark:border-white/5 pt-4 mt-4">
                      <h3 className="text-[11px] font-black tracking-widest text-slate-400 uppercase mb-2">
                        Extra Services
                      </h3>
                      <div className="space-y-2">
                        {cloth.clothPartialServices.map((cps) => {
                          const hasPrice = cps.price !== undefined;
                          return (
                            <div key={cps.id} className="flex items-center justify-between text-xs py-1 group">
                              <span className="text-slate-700 dark:text-platinum font-medium">{cps.name}</span>
                              
                              <button
                                onClick={() => triggerAddToCart(cps, 'clothPartialService', { 
                                  clothId: cloth.id, 
                                  clothPartialServiceId: cps.id,
                                  clothName: cloth.name,
                                })}
                                className="px-2 py-1 rounded-lg bg-white/50 dark:bg-canvas-dark border border-navy-deep/10 dark:border-white/10 group-hover:border-gold-polished dark:group-hover:border-gold-metallic flex items-center gap-1.5 text-[10px] font-bold transition-all"
                              >
                                <ShoppingCart className="w-2.5 h-2.5 text-gold-polished dark:text-gold-metallic" />
                                <span>
                                  {hasPrice ? `${displayCurrency} ${cps.price.toFixed(2)}` : "Special"}
                                </span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
