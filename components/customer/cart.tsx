// components/customer/cart.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, ShoppingBag, Trash2, Copy, Edit3, Sparkles, 
  ArrowRight, AlertCircle, MapPin, ChevronDown, CheckSquare, Square, Trash
} from 'lucide-react';
import { useCart, CartItem, DeliveryMode } from '@/context/cart-context';
import Link from 'next/link';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const {
    items,
    currency,
    discountCode,
    totals,
    stack,
    errors,
    isValid,
    removeItem,
    updateItem,
    duplicateItem,
    setDiscountCode,
    setPhone,
    phone,
    clearCart,
    fetchStack,
    stackLoading,
  } = useCart();

  // Lazy fetch the stack when the drawer opens for the first time
  useEffect(() => {
    if (isOpen && !stack && !stackLoading) {
      fetchStack();
    }
  }, [isOpen, stack, stackLoading, fetchStack]);

  const [discountInput, setDiscountInput] = useState(discountCode || '');
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showDeliveryBreakdown, setShowDeliveryBreakdown] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Bulk options states
  const [bulkProcessing, setBulkProcessing] = useState('');
  const [bulkDelivery, setBulkDelivery] = useState<DeliveryMode | ''>('');
  const [bulkPickAddr, setBulkPickAddr] = useState('');
  const [bulkReturnAddr, setBulkReturnAddr] = useState('');

  const allSelected = items.length > 0 && selectedItemIds.length === items.length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedItemIds([]);
    } else {
      setSelectedItemIds(items.map(i => i.id));
    }
  };

  const toggleSelectItem = (id: string) => {
    setSelectedItemIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleApplyBulk = () => {
    if (selectedItemIds.length === 0) return;
    selectedItemIds.forEach(id => {
      const updates: any = {};
      if (bulkProcessing) updates.processingRuleId = bulkProcessing;
      if (bulkDelivery) {
        updates.deliveryMode = bulkDelivery as DeliveryMode;
        // When delivery mode is 'none', clear any previously set addresses
        if (bulkDelivery === 'none') {
          updates.pickAddressId = undefined;
          updates.returnAddressId = undefined;
        }
      }
      if (bulkPickAddr && bulkDelivery !== 'none') {
        // only set pick address if mode includes pick
        if (bulkDelivery === 'pick' || bulkDelivery === 'both') {
          updates.pickAddressId = bulkPickAddr;
        }
      }
      if (bulkReturnAddr && bulkDelivery !== 'none') {
        if (bulkDelivery === 'return' || bulkDelivery === 'both') {
          updates.returnAddressId = bulkReturnAddr;
        }
      }
      updateItem(id, updates);
    });
  };

  // Name display is now fully determined by item.name, already constructed in service page
  const getFormattedName = (item: CartItem) => item.name;

  const formatPrice = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) return 'Price computed later';
    return `${currency?.code || 'NGN'} ${amount.toFixed(2)}`;
  };

  const handleCheckout = async () => {
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      
      // Phone and currency are already validated via isValid, but we double-check
      if (!phone || !currency) {
        throw new Error('Missing phone or currency');
      }
      
      const payload = {
        phoneNumber: phone,
        currencyId: currency?.id,
        discountRuleCode: discountCode || undefined,
        cartItems: items.map(item => {
          const base = {
            processingRuleId: item.processingRuleId,
            quantity: item.quantity,
            deliveryMode: item.deliveryMode,
            pickAddressId: item.pickAddressId,
            returnAddressId: item.returnAddressId,
            name: item.name,
          };
          // Only include the ID that matches the item type
          switch (item.type) {
            case 'cloth':
              return { ...base, type: item.type, clothId: item.clothId };
            case 'variant':
              return { ...base, type: item.type, variantId: item.variantId };
            case 'clothPartialService':
              return { ...base, type: item.type, clothPartialServiceId: item.clothPartialServiceId };
            case 'variantPartialService':
              return { ...base, type: item.type, variantPartialServiceId: item.variantPartialServiceId };
            default:
              throw new Error(`Unknown item type: ${item.type}`);
          }
        }),
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Could not place order. Please try again.');
      
      // Order submitted successfully → clear the cart
      clearCart();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || 'Something went wrong. Give it another try.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Blur Layer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-navy-deep/40 backdrop-blur-sm"
          />

          {/* Drawer Panel Container */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 z-50 h-screen w-full md:w-[50vw] bg-white dark:bg-canvas-dark border-l border-navy-deep/10 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden text-slate-blue dark:text-platinum"
          >
            {/* Header section */}
            <div className="p-6 border-b border-navy-deep/10 dark:border-white/10 flex items-center justify-between bg-white/50 dark:bg-canvas-dark/50 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <ShoppingBag className="w-5 h-5 text-gold-polished dark:text-gold-metallic" />
                <h2 className="text-xl font-black uppercase tracking-wider text-navy-deep dark:text-white">Your Laundry Cart</h2>
                <span className="text-xs px-2.5 py-1 bg-gold-metallic/10 text-gold-polished font-bold rounded-full">{items.length} items</span>
              </div>
              <div className="flex items-center gap-2">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="p-2 rounded-xl hover:bg-red-500/10 text-red-500 transition-all"
                    title="Empty cart"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                )}
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-navy-deep/5 dark:hover:bg-white/5 transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Empty Cart */}
            {items.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <ShoppingBag className="w-16 h-16 text-slate-300 dark:text-white/10 stroke-[1] mb-4" />
                <p className="text-sm font-medium opacity-60">Your cart is empty. Add some clothes to get started.</p>
                <button onClick={onClose} className="mt-4 text-xs font-bold uppercase tracking-wider text-gold-polished hover:underline">Continue shopping</button>
              </div>
            ) : (
              <>
                {/* Scrollable Item Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  
                  {/* Bulk edit controls */}
                  <div className="p-4 rounded-2xl border border-navy-deep/5 dark:border-white/5 bg-navy-deep/[2%] space-y-3">
                    <div className="flex items-center justify-between">
                      <button onClick={toggleSelectAll} className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-navy-deep dark:text-alabaster">
                        {allSelected ? <CheckSquare className="w-4 h-4 text-gold-polished" /> : <Square className="w-4 h-4" />}
                        Select all
                      </button>
                      <span className="text-[11px] font-semibold text-slate-400">{selectedItemIds.length} selected</span>
                    </div>

                    {selectedItemIds.length > 0 && (
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-navy-deep/5 dark:border-white/5">
                        <select value={bulkProcessing} onChange={(e) => setBulkProcessing(e.target.value)} className="p-2 text-xs rounded-xl bg-white dark:bg-canvas-dark border border-navy-deep/10 dark:border-white/10">
                          <option value="">Cleaning service</option>
                          {stack?.processingRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <select value={bulkDelivery} onChange={(e) => setBulkDelivery(e.target.value as DeliveryMode)} className="p-2 text-xs rounded-xl bg-white dark:bg-canvas-dark border border-navy-deep/10 dark:border-white/10">
                          <option value="">Delivery</option>
                          <option value="none">Self (I drop off & pick up)</option>
                          <option value="pick">Pick up from me</option>
                          <option value="return">Deliver back to me</option>
                          <option value="both">Pick up and deliver back</option>
                        </select>
                        {(bulkDelivery === 'pick' || bulkDelivery === 'both') && (
                          <select value={bulkPickAddr} onChange={(e) => setBulkPickAddr(e.target.value)} className="col-span-2 p-2 text-xs rounded-xl bg-white dark:bg-canvas-dark border border-navy-deep/10 dark:border-white/10">
                            <option value="">Pickup address</option>
                            {stack?.customerAddresses.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                          </select>
                        )}
                        {(bulkDelivery === 'return' || bulkDelivery === 'both') && (
                          <select value={bulkReturnAddr} onChange={(e) => setBulkReturnAddr(e.target.value)} className="col-span-2 p-2 text-xs rounded-xl bg-white dark:bg-canvas-dark border border-navy-deep/10 dark:border-white/10">
                            <option value="">Delivery address</option>
                            {stack?.customerAddresses.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                          </select>
                        )}
                        <button onClick={handleApplyBulk} className="col-span-2 py-2 text-xs font-bold uppercase bg-gold-polished dark:bg-gold-metallic text-white dark:text-canvas-dark rounded-xl tracking-wider">
                          Update selected
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Individual item cards */}
                  {items.map((item) => {
                    const hasPickError = (item.deliveryMode === 'pick' || item.deliveryMode === 'both') && !item.pickAddressId;
                    const hasReturnError = (item.deliveryMode === 'return' || item.deliveryMode === 'both') && !item.returnAddressId;
                    const hasRuleError = !item.processingRuleId;
                    const hasDeliveryError = !item.deliveryMode;

                    return (
                      <div key={item.id} className="p-4 rounded-2xl border border-navy-deep/10 dark:border-white/10 bg-white/50 dark:bg-canvas-dark/50 space-y-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-3">
                            <button onClick={() => toggleSelectItem(item.id)} className="mt-1">
                              {selectedItemIds.includes(item.id) ? <CheckSquare className="w-4 h-4 text-gold-polished" /> : <Square className="w-4 h-4" />}
                            </button>
                            <div>
                              <h4 className="text-sm font-bold text-navy-deep dark:text-white leading-tight">{getFormattedName(item)}</h4>
                              <p className="text-xs text-gold-polished font-black mt-1">{formatPrice(item.finalPrice)}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button onClick={() => duplicateItem(item.id)} className="p-1.5 rounded-lg hover:bg-navy-deep/5 dark:hover:bg-white/5" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={() => removeItem(item.id)} className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>

                        {/* Options for each item */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Cleaning method</label>
                            <select
                              value={item.processingRuleId}
                              onChange={(e) => updateItem(item.id, { processingRuleId: e.target.value })}
                              className={`w-full p-2 rounded-xl bg-white dark:bg-canvas-dark border ${hasRuleError ? 'border-red-500' : 'border-navy-deep/10 dark:border-white/10'}`}
                            >
                              <option value="">Choose one</option>
                              {stack?.processingRules.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Delivery option</label>
                            <select
                              value={item.deliveryMode || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                const updates: any = { 
                                  deliveryMode: value ? (value as DeliveryMode) : null 
                                };
                                if (value === 'none') {
                                  updates.pickAddressId = undefined;
                                  updates.returnAddressId = undefined;
                                } else if (value === 'pick') {
                                  updates.returnAddressId = undefined;
                                } else if (value === 'return') {
                                  updates.pickAddressId = undefined;
                                }
                                updateItem(item.id, updates);
                              }}
                              className={`w-full p-2 rounded-xl bg-white dark:bg-canvas-dark border ${hasDeliveryError ? 'border-red-500' : 'border-navy-deep/10 dark:border-white/10'}`}
                            >
                              <option value="">Choose one</option>
                              <option value="none">Self (I drop off & pick up)</option>
                              <option value="pick">Pick up from me</option>
                              <option value="return">Deliver back to me</option>
                              <option value="both">Pick up and deliver back</option>
                            </select>
                          </div>

                          {/* Address selectors */}
                          {(item.deliveryMode === 'pick' || item.deliveryMode === 'both') && (
                            <div className="col-span-2">
                              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Pickup address</label>
                              <select
                                value={item.pickAddressId || ''}
                                onChange={(e) => updateItem(item.id, { pickAddressId: e.target.value })}
                                className={`w-full p-2 rounded-xl bg-white dark:bg-canvas-dark border ${hasPickError ? 'border-red-500' : 'border-navy-deep/10 dark:border-white/10'}`}
                              >
                                <option value="">Select your pickup address</option>
                                {stack?.customerAddresses.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                              </select>
                            </div>
                          )}

                          {(item.deliveryMode === 'return' || item.deliveryMode === 'both') && (
                            <div className="col-span-2">
                              <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Delivery address</label>
                              <select
                                value={item.returnAddressId || ''}
                                onChange={(e) => updateItem(item.id, { returnAddressId: e.target.value })}
                                className={`w-full p-2 rounded-xl bg-white dark:bg-canvas-dark border ${hasReturnError ? 'border-red-500' : 'border-navy-deep/10 dark:border-white/10'}`}
                              >
                                <option value="">Select your delivery address</option>
                                {stack?.customerAddresses.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Address missing warning */}
                        {(hasPickError || hasReturnError) && (
                          <div className="p-2 text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl flex items-center gap-2">
                            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                            <span>Missing address? Add one in your <Link href="/profile" className="underline font-bold">Profile</Link>.</span>
                          </div>
                        )}

                        {/* Quantity control */}
                        <div className="flex items-center justify-between border-t border-navy-deep/5 dark:border-white/5 pt-3">
                          <span className="text-xs font-semibold text-slate-400">Quantity</span>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => updateItem(item.id, { quantity: Math.max(1, item.quantity - 1) })}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-navy-deep/5 dark:bg-white/5 font-black text-sm"
                            >-</button>
                            <span className="text-xs font-bold px-2">{item.quantity}</span>
                            <button 
                              onClick={() => updateItem(item.id, { quantity: item.quantity + 1 })}
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-navy-deep/5 dark:bg-white/5 font-black text-sm"
                            >+</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Checkout section */}
                <div className="p-6 border-t border-navy-deep/10 dark:border-white/10 bg-white dark:bg-canvas-dark space-y-4">
                  
                  {/* Phone number – mandatory */}
                  <div>
                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Phone number <span className="text-red-500">*</span></label>
                    <input
                      type="tel"
                      value={phone || ''}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="e.g. +2348000000000"
                      className={`w-full px-4 py-2.5 rounded-xl border ${errors.phone ? 'border-red-500' : 'border-navy-deep/10 dark:border-white/10'} bg-white/40 dark:bg-navy-deep/40 text-xs focus:outline-none`}
                    />
                    {errors.phone && (
                      <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>
                    )}
                  </div>

                  {/* Discount code */}
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={discountInput}
                      onChange={(e) => setDiscountInput(e.target.value)}
                      placeholder="Got a promo code?"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-navy-deep/10 dark:border-white/10 bg-white/40 dark:bg-navy-deep/40 text-xs focus:outline-none"
                    />
                    <button 
                      onClick={() => setDiscountCode(discountInput || null)}
                      className="px-4 py-2.5 bg-navy-deep dark:bg-white/10 text-white text-xs font-bold rounded-xl tracking-wider uppercase"
                    >Apply</button>
                  </div>

                  {/* Totals */}
                  <div className="space-y-2 text-xs font-semibold">
                    <div className="flex justify-between">
                      <span>Cleaning total</span>
                      <span>{formatPrice(totals?.totalserviceamount)}</span>
                    </div>

                    <div className="space-y-1">
                      <button 
                        onClick={() => setShowDeliveryBreakdown(!showDeliveryBreakdown)}
                        className="w-full flex items-center justify-between hover:text-gold-polished transition-colors"
                      >
                        <span className="flex items-center gap-1">Delivery fee <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showDeliveryBreakdown ? 'rotate-180' : ''}`} /></span>
                        <span>{formatPrice(totals?.totalDeliveryFee)}</span>
                      </button>

                      <AnimatePresence>
                        {showDeliveryBreakdown && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 0.7 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="pl-4 space-y-1 text-[11px] overflow-hidden"
                          >
                            <div className="flex justify-between"><span>• Pickup fee</span><span>{formatPrice(totals?.totalpickdeliveryfee)}</span></div>
                            <div className="flex justify-between"><span>• Return delivery fee</span><span>{formatPrice(totals?.totalreturndeliveryfee)}</span></div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {totals && totals.discountAmount > 0 && (
                      <div className="flex justify-between text-green-500">
                        <span>Promo discount</span>
                        <span>-{formatPrice(totals.discountAmount)}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-navy-deep/10 dark:border-white/10 flex justify-between text-sm font-black text-navy-deep dark:text-white">
                      <span>Total</span>
                      <div className="text-right">
                        {totals && totals.discountAmount > 0 && (
                          <span className="block text-xs text-slate-400 line-through mr-1 font-medium">
                            {formatPrice((totals.totalserviceamount || 0) + totals.totalDeliveryFee + totals.discountAmount)}
                          </span>
                        )}
                        <span className="text-gold-polished dark:text-gold-metallic">{formatPrice(totals?.netamount)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Error alert */}
                  {submitError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  {/* Place order button */}
                  <button
                    onClick={handleCheckout}
                    disabled={!isValid || isSubmitting}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-gold-polished via-gold-metallic to-gold-pastel text-white dark:text-canvas-dark text-sm font-black uppercase tracking-widest shadow-xl hover:opacity-90 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Placing your order...' : 'Place order'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}