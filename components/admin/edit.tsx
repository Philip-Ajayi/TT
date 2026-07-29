// components/admin/edit.tsx
'use client';

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, ChevronRight } from 'lucide-react';
import { calculateMilesDistance } from '@/lib/utils/geo';
import { determineSubOrderPrice, determineDeliveryFee, applyDiscountRule } from '@/lib/utils/order-helpers';

// ── TYPES ──────────────────────────────────────────────────────
interface ClothListItem {
  id: string;
  name: string;
  price?: number;
  isspecial?: boolean;
  disabled?: boolean;
  variants?: VariantItem[];
  clothPartialServices?: PartialServiceItem[];
}

interface VariantItem {
  id: string;
  name: string;
  price?: number;
  isspecial?: boolean;
  disabled?: boolean;
  variantPartialServices?: PartialServiceItem[];
}

interface PartialServiceItem {
  id: string;
  name: string;
  price?: number;
  isspecial?: boolean;
}

interface CustomerAddress {
  id: string;
  label: string;
  address?: string;   // may include combined address
  longitude: number;
  latitude: number;
  isDefault: boolean;
}

interface ProcessingRule {
  id: string;
  name: string;
  multiplier: number;
}

interface DiscountRule {
  id: string;
  code: string;
  type: string;
  percentage: number;
  capNaira: number | null;
}

interface Currency {
  id: string;
  code: string;
  multiplier: number;
}

interface DeliverySetup1 { miles: string; pricePerMile: number; }
interface DeliverySetup2 { quantity: string; multiplier: number; }

interface SubOrderEdit {
  id?: string;
  clothId?: string | null;
  variantId?: string | null;
  clothPartialServiceId?: string | null;
  variantPartialServiceId?: string | null;
  name: string;
  quantity: number;
  finalPrice: number | null;   // null means not set yet
  priceFromProduct?: number | null;
  isSpecial?: boolean;
}

interface DeliveryGroupEdit {
  id?: string;
  processingRuleId: string;
  processingRuleName?: string;
  deliveryMode: string;
  pickAddressId: string | null;
  returnAddressId: string | null;
  subOrders: SubOrderEdit[];
  pickdeliveryfee: number;
  returndeliveryfee: number;
}

interface OrderEditState {
  currencyCode: string;
  discountRuleCode: string | null;
  discountAmount: number;
  discountRuleId?: string | null;
  deliveryGroups: DeliveryGroupEdit[];
  totalserviceamount: number;
  totalpickdeliveryfee: number;
  totalreturndeliveryfee: number;
  totalamount: number;
  netamount: number;
}

interface EditModalProps {
  orderId: string;
  onClose: () => void;
  onUpdate: () => void;
}

export default function OrderEditModal({ orderId, onClose, onUpdate }: EditModalProps) {
  // ── DATA FROM API ────────────────────────────────────────────
  const [clothList, setClothList] = useState<ClothListItem[]>([]);
  const [processingRules, setProcessingRules] = useState<ProcessingRule[]>([]);
  const [discountRules, setDiscountRules] = useState<DiscountRule[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [customerAddresses, setCustomerAddresses] = useState<CustomerAddress[]>([]);
  const [companyAddress, setCompanyAddress] = useState<{
    address: string;
    longitude: number;
    latitude: number;
  } | null>(null);
  const [deliverySetup1, setDeliverySetup1] = useState<DeliverySetup1[]>([]);
  const [deliverySetup2, setDeliverySetup2] = useState<DeliverySetup2[]>([]);
  
  // ── EDIT STATE ───────────────────────────────────────────────
  const [order, setOrder] = useState<OrderEditState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [discountMode, setDiscountMode] = useState<'code' | 'amount'>('code');

  // ── CASCADING MENU STATE ─────────────────────────────────────
  const [addMenuGroupIdx, setAddMenuGroupIdx] = useState<number | null>(null);
  const [menuStage, setMenuStage] = useState(1);
  const [selectedCloth, setSelectedCloth] = useState<ClothListItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<VariantItem | null>(null);
  const [selectedPartialService, setSelectedPartialService] = useState<PartialServiceItem | null>(null);

  const groupsEndRef = useRef<HTMLDivElement>(null);

  // ── FETCH INITIAL DATA ───────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const stackRes = await fetch(`/api/stack/order-edit/${orderId}`);
      if (!stackRes.ok) throw new Error('Failed to load order data');
      const stackData = await stackRes.json();
      
      const clothRes = await fetch('/api/stack/edit-cloth');
      if (!clothRes.ok) throw new Error('Failed to load cloths');
      const clothData = await clothRes.json();
      
      setClothList(clothData);
      setProcessingRules(stackData.processingRules);
      setDiscountRules(stackData.discountRules);
      setCurrencies(stackData.currencies);
      setCustomerAddresses(stackData.customerAddresses);
      setCompanyAddress(stackData.companyAddresses[0] || null);
      setDeliverySetup1(stackData.deliverySetup1);
      setDeliverySetup2(stackData.deliverySetup2);
      
      const orderData = stackData.order;
      const groups: DeliveryGroupEdit[] = orderData.deliveryGroups.map((dg: any) => ({
        id: dg.id,
        processingRuleId: dg.processingRuleId,
        processingRuleName: dg.processingRuleName,
        deliveryMode: dg.deliveryMode,
        pickAddressId: dg.pickAddressId || null,
        returnAddressId: dg.returnAddressId || null,
        pickdeliveryfee: dg.pickdeliveryfee,
        returndeliveryfee: dg.returndeliveryfee,
        subOrders: dg.subOrders.map((so: any) => ({
          id: so.id,
          clothId: so.clothId,
          variantId: so.variantId,
          clothPartialServiceId: so.clothPartialServiceId,
          variantPartialServiceId: so.variantPartialServiceId,
          name: so.name,
          quantity: so.quantity,
          finalPrice: so.finalPrice,
        })),
      }));
      
      setOrder({
        currencyCode: orderData.currencyCode,
        discountRuleCode: orderData.discountRuleCode || null,
        discountAmount: orderData.discountAmount || 0,
        discountRuleId: orderData.discountRuleId || null,
        deliveryGroups: groups,
        totalserviceamount: orderData.totalserviceamount,
        totalpickdeliveryfee: orderData.totalpickdeliveryfee,
        totalreturndeliveryfee: orderData.totalreturndeliveryfee,
        totalamount: orderData.totalserviceamount + orderData.totalpickdeliveryfee + orderData.totalreturndeliveryfee,
        netamount: orderData.netamount,
      });
      
      if (orderData.discountRuleCode) setDiscountMode('code');
      else setDiscountMode('amount');
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── RECALCULATION HELPERS ────────────────────────────────────
  const computeDeliveryFeeForGroup = useCallback(
    (mode: string, pickAddrId: string | null, returnAddrId: string | null, quantity: number): { pick: number; return: number } => {
      if (!companyAddress) return { pick: 0, return: 0 };
      let pickFee = 0;
      let returnFee = 0;
      
      const currMult = currencies.find(c => c.code === order?.currencyCode)?.multiplier || 1;
      
      if (mode === 'both' || mode === 'pick') {
        if (pickAddrId) {
          const addr = customerAddresses.find(a => a.id === pickAddrId);
          if (addr) {
            const miles = calculateMilesDistance(
              companyAddress.latitude, companyAddress.longitude,
              addr.latitude, addr.longitude
            );
            pickFee = determineDeliveryFee({
              miles,
              totalQuantity: quantity,
              deliverySetups1: deliverySetup1,
              deliverySetups2: deliverySetup2,
              currencyMultiplier: currMult,
            });
          }
        }
      }
      if (mode === 'both' || mode === 'return') {
        if (returnAddrId) {
          const addr = customerAddresses.find(a => a.id === returnAddrId);
          if (addr) {
            const miles = calculateMilesDistance(
              companyAddress.latitude, companyAddress.longitude,
              addr.latitude, addr.longitude
            );
            returnFee = determineDeliveryFee({
              miles,
              totalQuantity: quantity,
              deliverySetups1: deliverySetup1,
              deliverySetups2: deliverySetup2,
              currencyMultiplier: currMult,
            });
          }
        }
      }
      return { pick: pickFee, return: returnFee };
    },
    [companyAddress, customerAddresses, deliverySetup1, deliverySetup2, currencies, order?.currencyCode]
  );

  const recomputeAll = useCallback(
    (groups: DeliveryGroupEdit[]) => {
      const newGroups = groups.map(g => {
        const totalQty = g.subOrders.reduce((sum, so) => sum + so.quantity, 0);
        const { pick, return: ret } = computeDeliveryFeeForGroup(g.deliveryMode, g.pickAddressId, g.returnAddressId, totalQty);
        return { ...g, pickdeliveryfee: pick, returndeliveryfee: ret };
      });
      
      const totalService = newGroups.reduce(
        (sum, g) => sum + g.subOrders.reduce((s, so) => s + (so.finalPrice ?? 0), 0), 0
      );
      const totalPick = newGroups.reduce((sum, g) => sum + g.pickdeliveryfee, 0);
      const totalReturn = newGroups.reduce((sum, g) => sum + g.returndeliveryfee, 0);
      const totalAmount = totalService + totalPick + totalReturn;
      
      return { newGroups, totalService, totalPick, totalReturn, totalAmount };
    },
    [computeDeliveryFeeForGroup]
  );

  const updateOrderState = useCallback(
    (newGroups: DeliveryGroupEdit[], discountInfo?: { mode: 'code' | 'amount'; code?: string; amount?: number }) => {
      if (!order) return;
      const { newGroups: recalcGroups, totalService, totalPick, totalReturn, totalAmount } = recomputeAll(newGroups);
      
      let discountAmount = order.discountAmount;
      let discountRuleId = order.discountRuleId;
      let discountRuleCode = order.discountRuleCode;
      
      if (discountInfo) {
        if (discountInfo.mode === 'amount' && discountInfo.amount !== undefined) {
          discountAmount = discountInfo.amount;
          discountRuleId = null;
          discountRuleCode = null;
        } else if (discountInfo.mode === 'code' && discountInfo.code) {
          const rule = discountRules.find(r => r.code === discountInfo.code);
          if (rule) {
            const currMult = currencies.find(c => c.code === order.currencyCode)?.multiplier || 1;
            const deduction = applyDiscountRule({
              discountType: rule.type,
              percentage: rule.percentage,
              capInNgn: rule.capNaira,
              currencyMultiplier: currMult,
              currentServicesTotal: totalService,
              currentPickDeliveryTotal: totalPick,
              currentReturnDeliveryTotal: totalReturn,
            });
            discountAmount = deduction.servicesDiscount + deduction.pickDeliveryDiscount + deduction.returnDeliveryDiscount;
            discountRuleId = rule.id;
            discountRuleCode = rule.code;
          }
        }
      } else {
        if (order.discountRuleId) {
          const rule = discountRules.find(r => r.id === order.discountRuleId);
          if (rule) {
            const currMult = currencies.find(c => c.code === order.currencyCode)?.multiplier || 1;
            const deduction = applyDiscountRule({
              discountType: rule.type,
              percentage: rule.percentage,
              capInNgn: rule.capNaira,
              currencyMultiplier: currMult,
              currentServicesTotal: totalService,
              currentPickDeliveryTotal: totalPick,
              currentReturnDeliveryTotal: totalReturn,
            });
            discountAmount = deduction.servicesDiscount + deduction.pickDeliveryDiscount + deduction.returnDeliveryDiscount;
            discountRuleId = rule.id;
            discountRuleCode = rule.code;
          }
        } else if (discountMode === 'code' && order.discountRuleCode) {
          const rule = discountRules.find(r => r.code === order.discountRuleCode);
          if (rule) {
            const currMult = currencies.find(c => c.code === order.currencyCode)?.multiplier || 1;
            const deduction = applyDiscountRule({
              discountType: rule.type,
              percentage: rule.percentage,
              capInNgn: rule.capNaira,
              currencyMultiplier: currMult,
              currentServicesTotal: totalService,
              currentPickDeliveryTotal: totalPick,
              currentReturnDeliveryTotal: totalReturn,
            });
            discountAmount = deduction.servicesDiscount + deduction.pickDeliveryDiscount + deduction.returnDeliveryDiscount;
            discountRuleId = rule.id;
            discountRuleCode = rule.code;
          }
        }
      }
      
      const netAmount = totalAmount - discountAmount;
      
      setOrder(prev => prev ? {
        ...prev,
        deliveryGroups: recalcGroups,
        totalserviceamount: totalService,
        totalpickdeliveryfee: totalPick,
        totalreturndeliveryfee: totalReturn,
        totalamount: totalAmount,
        discountAmount,
        discountRuleId,
        discountRuleCode,
        netamount: netAmount,
      } : null);
    },
    [order, recomputeAll, discountRules, currencies, discountMode]
  );

  // ── GROUP / SUBORDER HANDLERS ────────────────────────────────
  const handleGroupChange = (groupIdx: number, field: keyof DeliveryGroupEdit, value: any) => {
    if (!order) return;
    const newGroups = [...order.deliveryGroups];
    (newGroups[groupIdx] as any)[field] = value;
    if (field === 'processingRuleId') {
      const rule = processingRules.find(r => r.id === value);
      newGroups[groupIdx].processingRuleName = rule?.name || '';
    }
    updateOrderState(newGroups);
  };

  const handleSubOrderChange = (groupIdx: number, subIdx: number, field: keyof SubOrderEdit, value: any) => {
    if (!order) return;
    const newGroups = [...order.deliveryGroups];
    const sub = newGroups[groupIdx].subOrders[subIdx];
    (sub as any)[field] = value;
    updateOrderState(newGroups);
  };

  const handleDeleteGroup = (groupIdx: number) => {
    if (!order) return;
    const newGroups = order.deliveryGroups.filter((_, idx) => idx !== groupIdx);
    if (newGroups.length === 0) {
      setError('Order must have at least one delivery group.');
      return;
    }
    updateOrderState(newGroups);
  };

  const handleDeleteSubOrder = (groupIdx: number, subIdx: number) => {
    if (!order) return;
    const newGroups = [...order.deliveryGroups];
    const group = newGroups[groupIdx];
    if (group.subOrders.length <= 1) {
      setError('Each delivery group must have at least one suborder.');
      return;
    }
    group.subOrders = group.subOrders.filter((_, idx) => idx !== subIdx);
    updateOrderState(newGroups);
  };

  const handleAddGroup = () => {
    if (!order) return;
    if (processingRules.length === 0) return;
    const newGroup: DeliveryGroupEdit = {
      processingRuleId: processingRules[0].id,
      processingRuleName: processingRules[0].name,
      deliveryMode: 'both',
      pickAddressId: null,
      returnAddressId: null,
      pickdeliveryfee: 0,
      returndeliveryfee: 0,
      subOrders: [{
        name: '',
        quantity: 1,
        finalPrice: null,
      }],
    };
    updateOrderState([...order.deliveryGroups, newGroup]);
    // scroll to the newly added group
    setTimeout(() => {
      groupsEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 50);
  };

  // ── ADD SUBORDER CASCADING LOGIC ────────────────────────────
  const openAddSubMenu = (groupIdx: number) => {
    setAddMenuGroupIdx(groupIdx);
    setMenuStage(1);
    setSelectedCloth(null);
    setSelectedVariant(null);
    setSelectedPartialService(null);
  };

  const closeAddSubMenu = () => {
    setAddMenuGroupIdx(null);
  };

  const handleClothSelect = (cloth: ClothListItem) => {
    setSelectedCloth(cloth);
    if (cloth.variants?.length) {
      setMenuStage(2);
      setSelectedVariant(null);
      setSelectedPartialService(null);
    } else if (cloth.clothPartialServices?.length) {
      setMenuStage(2);
      setSelectedVariant(null);
      setSelectedPartialService(null);
    } else {
      addSuborderFromCloth(cloth, null, null, null);
      closeAddSubMenu();
    }
  };

  const handleVariantSelect = (variant: VariantItem) => {
    setSelectedVariant(variant);
    if (variant.variantPartialServices?.length) {
      setMenuStage(3);
      setSelectedPartialService(null);
    } else {
      addSuborderFromCloth(selectedCloth!, variant, null, null);
      closeAddSubMenu();
    }
  };

  const handleClothPartialServiceSelect = (ps: PartialServiceItem) => {
    addSuborderFromCloth(selectedCloth!, null, ps, null);
    closeAddSubMenu();
  };

  const handleVariantPartialServiceSelect = (ps: PartialServiceItem) => {
    addSuborderFromCloth(selectedCloth!, selectedVariant!, null, ps);
    closeAddSubMenu();
  };

  const addSuborderFromCloth = (
    cloth: ClothListItem,
    variant: VariantItem | null,
    clothPS: PartialServiceItem | null,
    variantPS: PartialServiceItem | null
  ) => {
    if (!order || addMenuGroupIdx === null) return;
    const groups = [...order.deliveryGroups];
    const group = groups[addMenuGroupIdx];
    
    let name = cloth.name;
    let clothId: string | null = cloth.id;
    let variantId: string | null = null;
    let clothPartialServiceId: string | null = null;
    let variantPartialServiceId: string | null = null;
    let basePriceNgn: number | null = null;
    let isSpecial = false;

    if (variant) {
      name += ` - ${variant.name}`;
      variantId = variant.id;
      basePriceNgn = variant.price ?? null;
      isSpecial = variant.isspecial || false;
      if (variantPS) {
        name += ` (${variantPS.name})`;
        variantPartialServiceId = variantPS.id;
        basePriceNgn = variantPS.price ?? null;
        isSpecial = variantPS.isspecial || false;
      }
    } else if (clothPS) {
      name += ` (${clothPS.name})`;
      clothPartialServiceId = clothPS.id;
      basePriceNgn = clothPS.price ?? null;
      isSpecial = clothPS.isspecial || false;
    } else {
      basePriceNgn = cloth.price ?? null;
      isSpecial = cloth.isspecial || false;
    }

    const newSub: SubOrderEdit = {
      clothId,
      variantId,
      clothPartialServiceId,
      variantPartialServiceId,
      name,
      quantity: 1,
      finalPrice: null,
      priceFromProduct: basePriceNgn,
      isSpecial,
    };

    const rule = processingRules.find(r => r.id === group.processingRuleId);
    if (rule && basePriceNgn !== null && !isSpecial) {
      const currMult = currencies.find(c => c.code === order.currencyCode)?.multiplier || 1;
      const result = determineSubOrderPrice({
        basePriceNgn,
        processingMultiplier: rule.multiplier,
        quantity: newSub.quantity,
        currencyMultiplier: currMult,
      });
      if (!result.isSpecial) {
        newSub.finalPrice = result.finalPrice;
      }
    }

    group.subOrders.push(newSub);
    updateOrderState(groups);
    closeAddSubMenu();
  };

  // ── DISCOUNT HANDLERS ────────────────────────────────────────
  const handleDiscountModeChange = (mode: 'code' | 'amount') => {
    setDiscountMode(mode);
    if (!order) return;
    if (mode === 'code') {
      const currentCode = order.discountRuleCode || (discountRules[0]?.code ?? null);
      updateOrderState(order.deliveryGroups, { mode: 'code', code: currentCode || undefined });
    } else {
      updateOrderState(order.deliveryGroups, { mode: 'amount', amount: order.discountAmount });
    }
  };

  const handleDiscountCodeSelect = (code: string) => {
    if (!order) return;
    updateOrderState(order.deliveryGroups, { mode: 'code', code });
  };

  const handleDiscountAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0;
    if (!order) return;
    updateOrderState(order.deliveryGroups, { mode: 'amount', amount: val });
  };

  // ── VALIDATION ───────────────────────────────────────────────
  const isValid = useMemo(() => {
    if (!order) return false;
    for (const group of order.deliveryGroups) {
      if (!group.processingRuleId) return false;
      if (!group.deliveryMode) return false;
      for (const so of group.subOrders) {
        if (so.finalPrice === null || so.finalPrice <= 0) return false;
        if (!so.name) return false;
      }
    }
    return true;
  }, [order]);

  // ── SUBMIT ───────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!order || !isValid) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        currencyCode: order.currencyCode,
        discountRuleCode: order.discountRuleCode,
        discountAmount: order.discountAmount,
        deliveryGroups: order.deliveryGroups.map(dg => ({
          id: dg.id,
          deliveryMode: dg.deliveryMode,
          processingRuleId: dg.processingRuleId,
          pickAddressId: dg.pickAddressId,
          returnAddressId: dg.returnAddressId,
          subOrders: dg.subOrders.map(so => ({
            id: so.id,
            clothId: so.clothId,
            variantId: so.variantId,
            clothPartialServiceId: so.clothPartialServiceId,
            variantPartialServiceId: so.variantPartialServiceId,
            quantity: so.quantity,
            finalPrice: so.finalPrice,
          })),
        })),
      };
      
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Failed to save order');
      }
      
      onUpdate();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── FORMATING ──────────────────────────────────────────────────
  const formatPrice = (val: number) => val.toFixed(2);
  const currencySymbol = order?.currencyCode || '';

  // ── RENDER ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="text-white text-lg">Loading editor...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-xl">Failed to load order data.</div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-navy-deep rounded-3xl shadow-2xl border border-gray-200 dark:border-gray-700"
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white dark:bg-navy-deep z-10">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">
                Edit Order <span className="text-gold-polished">#{orderId}</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Currency: <span className="font-semibold">{order.currencyCode}</span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-300 text-red-700 p-3 rounded-lg text-sm">{error}</div>
            )}

            {/* Discount Section */}
            <section className="space-y-3">
              <h3 className="text-sm font-bold uppercase text-gray-500">Discount</h3>
              <div className="flex gap-4 items-center">
                <button
                  onClick={() => handleDiscountModeChange('code')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${
                    discountMode === 'code'
                      ? 'bg-gold-polished text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  Discount Code
                </button>
                <button
                  onClick={() => handleDiscountModeChange('amount')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${
                    discountMode === 'amount'
                      ? 'bg-gold-polished text-white'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                >
                  Direct Amount
                </button>
              </div>

              {discountMode === 'code' ? (
                <select
                  value={order.discountRuleCode || ''}
                  onChange={(e) => handleDiscountCodeSelect(e.target.value)}
                  className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
                >
                  <option value="">None</option>
                  {discountRules.map(rule => (
                    <option key={rule.id} value={rule.code}>
                      {rule.code} ({rule.type} {rule.percentage}%{rule.capNaira ? ` cap ₦${rule.capNaira}` : ''})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={order.discountAmount}
                  onChange={handleDiscountAmountChange}
                  className="w-full p-2 border rounded-lg text-sm bg-white dark:bg-gray-800"
                  placeholder="Discount amount"
                />
              )}
            </section>

            {/* Delivery Groups */}
            <section className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase text-gray-500">Delivery Groups</h3>
                <button
                  onClick={handleAddGroup}
                  className="flex items-center gap-1 text-xs font-bold uppercase text-gold-polished hover:text-gold-metallic"
                >
                  <Plus className="w-4 h-4" /> Add Group
                </button>
              </div>

              {order.deliveryGroups.map((group, gIdx) => (
                <div key={gIdx} className="border rounded-xl p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 flex-1">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Processing Rule */}
                        <div>
                          <label className="text-xs font-semibold">Processing Rule</label>
                          <select
                            value={group.processingRuleId}
                            onChange={(e) => handleGroupChange(gIdx, 'processingRuleId', e.target.value)}
                            className="w-full p-1.5 border rounded text-sm"
                          >
                            {processingRules.map(rule => (
                              <option key={rule.id} value={rule.id}>{rule.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Delivery Mode */}
                        <div>
                          <label className="text-xs font-semibold">Delivery Mode</label>
                          <select
                            value={group.deliveryMode}
                            onChange={(e) => handleGroupChange(gIdx, 'deliveryMode', e.target.value)}
                            className="w-full p-1.5 border rounded text-sm"
                          >
                            <option value="both">Pickup & Return</option>
                            <option value="pick">Pickup Only</option>
                            <option value="return">Return Only</option>
                            <option value="none">No Delivery</option>
                          </select>
                        </div>

                        {/* Pick Address (shown only if mode includes pickup) */}
                        { (group.deliveryMode === 'both' || group.deliveryMode === 'pick') && (
                          <div>
                            <label className="text-xs font-semibold">Pick Address</label>
                            <select
                              value={group.pickAddressId || ''}
                              onChange={(e) => handleGroupChange(gIdx, 'pickAddressId', e.target.value || null)}
                              className="w-full p-1.5 border rounded text-sm"
                            >
                              <option value="">None</option>
                              {customerAddresses.map(addr => (
                                <option key={addr.id} value={addr.id}>
                                  {addr.label} - {addr.address || ''}{addr.isDefault ? ' (Primary)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Return Address (shown only if mode includes return) */}
                        { (group.deliveryMode === 'both' || group.deliveryMode === 'return') && (
                          <div>
                            <label className="text-xs font-semibold">Return Address</label>
                            <select
                              value={group.returnAddressId || ''}
                              onChange={(e) => handleGroupChange(gIdx, 'returnAddressId', e.target.value || null)}
                              className="w-full p-1.5 border rounded text-sm"
                            >
                              <option value="">None</option>
                              {customerAddresses.map(addr => (
                                <option key={addr.id} value={addr.id}>
                                  {addr.label} - {addr.address || ''}{addr.isDefault ? ' (Primary)' : ''}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteGroup(gIdx)}
                      className="text-red-500 hover:text-red-700 ml-3"
                      title="Delete group"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Suborders */}
                  <div className="pl-2 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold uppercase text-gray-500">Suborders</h4>
                      <button
                        onClick={() => openAddSubMenu(gIdx)}
                        className="flex items-center gap-1 text-xs font-bold uppercase text-gold-polished"
                      >
                        <Plus className="w-3 h-3" /> Add Item
                      </button>
                    </div>

                    {group.subOrders.map((so, sIdx) => (
                      <div key={sIdx} className="flex items-center gap-3 bg-white dark:bg-gray-800 p-2 rounded-lg">
                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <input
                            value={so.name}
                            onChange={(e) => handleSubOrderChange(gIdx, sIdx, 'name', e.target.value)}
                            placeholder="Item name"
                            className="p-1 border rounded text-sm"
                            disabled
                          />
                          <input
                            type="number"
                            min="1"
                            value={so.quantity}
                            onChange={(e) => handleSubOrderChange(gIdx, sIdx, 'quantity', parseInt(e.target.value) || 1)}
                            className="p-1 border rounded text-sm"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={so.finalPrice ?? ''}
                            onChange={(e) => {
                              const val = e.target.value === '' ? null : parseFloat(e.target.value);
                              handleSubOrderChange(gIdx, sIdx, 'finalPrice', val);
                            }}
                            placeholder="Final price"
                            className={`p-1 border rounded text-sm ${so.finalPrice === null ? 'border-red-300' : ''}`}
                          />
                        </div>
                        <button
                          onClick={() => handleDeleteSubOrder(gIdx, sIdx)}
                          className="text-red-500 hover:text-red-700"
                          title="Delete suborder"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}

                    {/* Cascading Add Menu (if open for this group) */}
                    {addMenuGroupIdx === gIdx && (
                      <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          {menuStage > 1 && (
                            <button
                              onClick={() => {
                                if (menuStage === 3) {
                                  setMenuStage(2);
                                  setSelectedPartialService(null);
                                } else if (menuStage === 2) {
                                  setMenuStage(1);
                                  setSelectedCloth(null);
                                }
                              }}
                              className="text-xs font-bold text-gray-500"
                            >
                              ← Back
                            </button>
                          )}
                          <span className="font-semibold">
                            {menuStage === 1 ? 'Select Cloth' : menuStage === 2 ? 'Select Variant/Service' : 'Select Variant Service'}
                          </span>
                          <button onClick={closeAddSubMenu} className="ml-auto text-gray-500 hover:text-red-500"><X className="w-4 h-4" /></button>
                        </div>

                        {/* Stage 1: Cloth List */}
                        {menuStage === 1 && (
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {clothList.map(cloth => {
                              const hasChildren = !!(cloth.variants?.length || cloth.clothPartialServices?.length);
                              return (
                                <button
                                  key={cloth.id}
                                  onClick={() => {
                                    if (!cloth.disabled) {
                                      handleClothSelect(cloth);
                                    } else if (hasChildren) {
                                      setSelectedCloth(cloth);
                                      setMenuStage(2);
                                      setSelectedVariant(null);
                                      setSelectedPartialService(null);
                                    }
                                  }}
                                  disabled={cloth.disabled && !hasChildren}
                                  className={`w-full flex items-center justify-between p-2 rounded text-left ${
                                    cloth.disabled ? 'opacity-60' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                  } ${cloth.disabled && !hasChildren ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <span>{cloth.name} {cloth.price ? `- ${formatPrice(cloth.price)}` : cloth.isspecial ? '(special price)' : ''}</span>
                                  {hasChildren && <ChevronRight className="w-4 h-4" />}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* Stage 2: Variants or Cloth Partial Services */}
                        {menuStage === 2 && selectedCloth && (
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {selectedCloth.variants?.map(variant => {
                              const hasChildren = !!variant.variantPartialServices?.length;
                              return (
                                <button
                                  key={variant.id}
                                  onClick={() => {
                                    if (!variant.disabled) {
                                      handleVariantSelect(variant);
                                    } else if (hasChildren) {
                                      setSelectedVariant(variant);
                                      setMenuStage(3);
                                      setSelectedPartialService(null);
                                    }
                                  }}
                                  disabled={variant.disabled && !hasChildren}
                                  className={`w-full flex items-center justify-between p-2 rounded ${
                                    variant.disabled ? 'opacity-60' : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                                  } ${variant.disabled && !hasChildren ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                  <span>{variant.name} {variant.price ? `- ${formatPrice(variant.price)}` : variant.isspecial ? '(special price)' : ''}</span>
                                  {hasChildren && <ChevronRight className="w-4 h-4" />}
                                </button>
                              );
                            })}
                            {selectedCloth.clothPartialServices?.map(ps => (
                              <button
                                key={ps.id}
                                onClick={() => handleClothPartialServiceSelect(ps)}
                                className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              >
                                <span>{ps.name} {ps.price ? `- ${formatPrice(ps.price)}` : '(special price)'}</span>
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Stage 3: Variant Partial Services */}
                        {menuStage === 3 && selectedVariant && (
                          <div className="max-h-48 overflow-y-auto space-y-1">
                            {selectedVariant.variantPartialServices?.map(ps => (
                              <button
                                key={ps.id}
                                onClick={() => handleVariantPartialServiceSelect(ps)}
                                className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
                              >
                                <span>{ps.name} {ps.price ? `- ${formatPrice(ps.price)}` : '(special price)'}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Group Fees Display */}
                  <div className="flex gap-4 text-xs font-semibold text-gray-600 dark:text-gray-400">
                    <span>Pickup Fee: {formatPrice(group.pickdeliveryfee)}</span>
                    <span>Return Fee: {formatPrice(group.returndeliveryfee)}</span>
                  </div>
                </div>
              ))}
              <div ref={groupsEndRef} />
            </section>

            {/* Real-time Totals */}
            <div className="bg-gray-100 dark:bg-gray-900 p-4 rounded-xl space-y-2 text-sm">
              <div className="flex justify-between"><span>Service Total:</span><span className="font-bold">{currencySymbol} {formatPrice(order.totalserviceamount)}</span></div>
              <div className="flex justify-between"><span>Total Pickup Delivery Fee:</span><span className="font-bold">{currencySymbol} {formatPrice(order.totalpickdeliveryfee)}</span></div>
              <div className="flex justify-between"><span>Total Return Delivery Fee:</span><span className="font-bold">{currencySymbol} {formatPrice(order.totalreturndeliveryfee)}</span></div>
              <div className="flex justify-between"><span>Total Amount:</span><span className="font-bold">{currencySymbol} {formatPrice(order.totalamount)}</span></div>
              <div className="flex justify-between text-green-600"><span>Discount Amount:</span><span className="font-bold">-{currencySymbol} {formatPrice(order.discountAmount)}</span></div>
              <div className="flex justify-between border-t pt-2 text-base"><span>Net Amount:</span><span className="font-black">{currencySymbol} {formatPrice(order.netamount)}</span></div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={onClose}
                className="px-5 py-2 rounded-lg border text-sm font-bold uppercase"
                disabled={saving}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isValid || saving}
                className="px-5 py-2 rounded-lg bg-gold-polished text-white text-sm font-bold uppercase disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}