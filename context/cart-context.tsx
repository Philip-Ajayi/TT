// context/cart-context.tsx
'use client';

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  determineSubOrderPrice,
  determineDeliveryFee,
  applyDiscountRule,
  convertCurrency,
} from '@/lib/utils/order-helpers';
import { calculateMilesDistance } from '@/lib/utils/geo';

// ------------------------------------------------------------------ 
// 1. TYPES
// ------------------------------------------------------------------ 

export type DeliveryMode = 'both' | 'pick' | 'return' | 'none';

export interface CartItem {
  id: string;
  type: 'cloth' | 'variant' | 'clothPartialService' | 'variantPartialService';
  clothId?: string;
  variantId?: string;
  clothPartialServiceId?: string;
  variantPartialServiceId?: string;
  name: string;
  processingRuleId: string;
  quantity: number;
  deliveryMode: DeliveryMode | null;   // ← now nullable
  pickAddressId?: string;
  returnAddressId?: string;
  basePriceNgn: number | null;
  finalPrice: number | null;
  isSpecial: boolean;
}

export interface CurrencyInfo {
  id: string;
  code: string;
  multiplier: number;
}

interface CalculationStack {
  companyAddresses: { address: string; longitude: number; latitude: number }[];
  deliverySetups1: { miles: string; pricePerMile: number }[];
  deliverySetups2: { quantity: string; multiplier: number }[];
  processingRules: { id: string; name: string; multiplier: number }[];
  discountRules: {
    id: string;
    code: string;
    type: string;
    percentage: number;
    capNaira: number | null;
  }[];
  currencies: { id: string; code: string; multiplier: number }[];
  customerAddresses: {
    id: string;
    label: string;
    longitude: number;
    latitude: number;
    isDefault: boolean;
  }[];
}

interface CartTotals {
  totalserviceamount: number | null;
  totalpickdeliveryfee: number;
  totalreturndeliveryfee: number;
  totalDeliveryFee: number;
  netamount: number | null;
  discountAmount: number;
}

interface CartState {
  items: CartItem[];
  currency: CurrencyInfo | null;
  discountCode: string | null;
  phone: string | null;
  stack: CalculationStack | null;
  referenceCoords: { latitude: number; longitude: number } | null;
  totals: CartTotals | null;
  errors: ValidationErrors;
}

interface ValidationErrors {
  items: Record<string, string[]>;
  currency: string | null;
  phone: string | null;
  stack: string | null;
  discount: string | null;
}

type CartAction =
  | { type: 'SET_STACK'; payload: CalculationStack }
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_ITEM'; payload: { id: string; updates: Partial<Pick<CartItem, 'quantity' | 'deliveryMode' | 'pickAddressId' | 'returnAddressId' | 'processingRuleId'>> } }
  | { type: 'DUPLICATE_ITEM'; payload: string }
  | { type: 'SET_CURRENCY'; payload: CurrencyInfo }
  | { type: 'SET_DISCOUNT_CODE'; payload: string | null }
  | { type: 'SET_PHONE'; payload: string | null }
  | { type: 'CLEAR_CART' }
  | { type: 'VALIDATE_CART' }
  | { type: 'CLEAR_ERRORS' }
  | { type: 'RESTORE_STATE'; payload: { items: CartItem[]; currency: CurrencyInfo | null; discountCode: string | null; phone: string | null } };

// ------------------------------------------------------------------ 
// 2. VALIDATION
// ------------------------------------------------------------------ 

function validateCartItem(item: CartItem, stack: CalculationStack | null): string[] {
  const errors: string[] = [];
  
  if (!item.id) {
    errors.push('Item ID is required');
  }
  
  if (!item.type) {
    errors.push('Item type is required');
  }
  
  if (item.quantity <= 0) {
    errors.push('Quantity must be greater than 0');
  }
  
  if (!item.processingRuleId) {
    errors.push('Processing rule is required');
  }
  
  // Validate delivery mode (must be selected)
  if (!item.deliveryMode) {
    errors.push('Delivery option is required');
  }
  
  // Validate IDs based on type
  switch (item.type) {
    case 'cloth':
      if (!item.clothId) errors.push('Cloth ID is required');
      break;
    case 'variant':
      if (!item.variantId) errors.push('Variant ID is required');
      break;
    case 'clothPartialService':
      if (!item.clothPartialServiceId) errors.push('Cloth partial service ID is required');
      break;
    case 'variantPartialService':
      if (!item.variantPartialServiceId) errors.push('Variant partial service ID is required');
      break;
  }
  
  // Validate addresses based on delivery mode
  if (item.deliveryMode === 'pick' || item.deliveryMode === 'both') {
    if (!item.pickAddressId) {
      errors.push('Pick address is required for this delivery mode');
    } else if (stack) {
      const addressExists = stack.customerAddresses.some(addr => addr.id === item.pickAddressId);
      if (!addressExists) {
        errors.push('Selected pick address does not exist');
      }
    }
  }
  
  if (item.deliveryMode === 'return' || item.deliveryMode === 'both') {
    if (!item.returnAddressId) {
      errors.push('Return address is required for this delivery mode');
    } else if (stack) {
      const addressExists = stack.customerAddresses.some(addr => addr.id === item.returnAddressId);
      if (!addressExists) {
        errors.push('Selected return address does not exist');
      }
    }
  }
  
  // Validate processing rule exists
  if (stack && item.processingRuleId) {
    const ruleExists = stack.processingRules.some(rule => rule.id === item.processingRuleId);
    if (!ruleExists) {
      errors.push('Selected processing rule does not exist');
    }
  }
  
  return errors;
}

function validateCart(state: CartState): ValidationErrors {
  const errors: ValidationErrors = {
    items: {},
    currency: null,
    phone: null,
    stack: null,
    discount: null,
  };
  
  if (!state.stack) {
    errors.stack = 'Configuration not loaded';
  } else {
    // Validate each item
    state.items.forEach(item => {
      const itemErrors = validateCartItem(item, state.stack);
      if (itemErrors.length > 0) {
        errors.items[item.id] = itemErrors;
      }
    });
    
    // Validate currency
    if (!state.currency) {
      errors.currency = 'Currency is required';
    } else if (!state.stack.currencies.some(c => c.id === state.currency!.id)) {
      errors.currency = 'Selected currency is not available';
    }
    
    // Validate discount code if present
    if (state.discountCode) {
      const discountExists = state.stack.discountRules.some(
        rule => rule.code === state.discountCode
      );
      if (!discountExists) {
        errors.discount = 'Invalid discount code';
      }
    }
  }
  
  // Validate phone – now mandatory
  if (!state.phone) {
    errors.phone = 'Phone number is required';
  } else if (!/^\+?[\d\s-]{10,}$/.test(state.phone)) {
    errors.phone = 'Invalid phone number format';
  }
  
  return errors;
}

// ------------------------------------------------------------------ 
// 3. HELPERS
// ------------------------------------------------------------------ 

function buildGroupKey(item: CartItem): string {
  // If delivery mode is not selected, return a key that excludes this item from fee calculation
  if (!item.deliveryMode) {
    return `invalid-${item.id}`;
  }
  if (item.deliveryMode === 'none') {
    return `none-no_address-${item.processingRuleId}`;
  }
  if (item.deliveryMode === 'both') {
    return `both-${item.pickAddressId ?? 'null'}-${item.returnAddressId ?? 'null'}-${item.processingRuleId}`;
  }
  const addr = item.deliveryMode === 'pick' ? item.pickAddressId : item.returnAddressId;
  return `${item.deliveryMode}-${addr ?? 'null'}-${item.processingRuleId}`;
}

function recalcItemPrice(
  item: CartItem,
  processingMultiplier: number,
  currencyMultiplier: number
): { finalPrice: number | null; isSpecial: boolean } {
  if (item.basePriceNgn === null) return { finalPrice: null, isSpecial: true };
  
  if (processingMultiplier < 0) {
    console.warn('Invalid processing multiplier:', processingMultiplier);
    return { finalPrice: null, isSpecial: true };
  }
  
  const { finalPrice } = determineSubOrderPrice({
    basePriceNgn: item.basePriceNgn,
    processingMultiplier,
    quantity: item.quantity,
    currencyMultiplier,
  });
  
  return { finalPrice, isSpecial: false };
}

/** Recalculate all items' finalPrice based on current stack and currency */
function recalcAllItems(
  items: CartItem[],
  stack: CalculationStack | null,
  currency: CurrencyInfo | null
): CartItem[] {
  if (!stack || !currency) return items; // cannot recalc without stack/currency

  const currencyMultiplier = currency.multiplier;
  if (currencyMultiplier <= 0) return items;

  return items.map(item => {
    const rule = stack.processingRules.find(r => r.id === item.processingRuleId);
    const processingMultiplier = rule ? Number(rule.multiplier) : 0;
    const recalc = recalcItemPrice(item, processingMultiplier, currencyMultiplier);
    return {
      ...item,
      finalPrice: recalc.finalPrice,
      isSpecial: recalc.isSpecial,
    };
  });
}

function computeTotals(
  items: CartItem[],
  currency: CurrencyInfo | null,
  discountCode: string | null,
  stack: CalculationStack | null,
  referenceCoords: { latitude: number; longitude: number } | null
): CartTotals | null {
  if (!stack || !currency || !referenceCoords || items.length === 0) {
    if (items.length === 0) {
      return {
        totalserviceamount: 0,
        totalpickdeliveryfee: 0,
        totalreturndeliveryfee: 0,
        totalDeliveryFee: 0,
        netamount: 0,
        discountAmount: 0,
      };
    }
    return null;
  }

  const currencyMultiplier = currency.multiplier;
  
  if (currencyMultiplier <= 0) {
    console.error('Invalid currency multiplier:', currencyMultiplier);
    return null;
  }

  const groupsMap = new Map<string, CartItem[]>();
  for (const item of items) {
    // Skip items with invalid delivery mode (they will be caught by validation)
    if (!item.deliveryMode) continue;
    const key = buildGroupKey(item);
    if (!groupsMap.has(key)) groupsMap.set(key, []);
    groupsMap.get(key)!.push(item);
  }

  const addressMap = new Map(stack.customerAddresses.map(a => [a.id, a]));
  const ds1 = stack.deliverySetups1;
  const ds2 = stack.deliverySetups2;

  let totalPickFee = 0;
  let totalReturnFee = 0;

  for (const [key, groupItems] of groupsMap.entries()) {
    const parts = key.split('-');
    const mode = parts[0] as DeliveryMode;
    const totalQty = groupItems.reduce((sum, it) => sum + it.quantity, 0);

    if (mode === 'none' || totalQty <= 0) continue;

    if (mode === 'both') {
      const pickId = parts[1] !== 'null' ? parts[1] : undefined;
      const returnId = parts[2] !== 'null' ? parts[2] : undefined;

      if (pickId) {
        const addr = addressMap.get(pickId);
        if (addr) {
          const miles = calculateMilesDistance(
            referenceCoords.latitude,
            referenceCoords.longitude,
            addr.latitude,
            addr.longitude
          );
          if (miles >= 0) {
            totalPickFee += determineDeliveryFee({
              miles,
              totalQuantity: totalQty,
              deliverySetups1: ds1,
              deliverySetups2: ds2,
              currencyMultiplier,
            });
          }
        }
      }
      if (returnId) {
        const addr = addressMap.get(returnId);
        if (addr) {
          const miles = calculateMilesDistance(
            referenceCoords.latitude,
            referenceCoords.longitude,
            addr.latitude,
            addr.longitude
          );
          if (miles >= 0) {
            totalReturnFee += determineDeliveryFee({
              miles,
              totalQuantity: totalQty,
              deliverySetups1: ds1,
              deliverySetups2: ds2,
              currencyMultiplier,
            });
          }
        }
      }
    } else {
      const addrId = parts[1];
      if (addrId && addrId !== 'null') {
        const addr = addressMap.get(addrId);
        if (addr) {
          const miles = calculateMilesDistance(
            referenceCoords.latitude,
            referenceCoords.longitude,
            addr.latitude,
            addr.longitude
          );
          if (miles >= 0) {
            const fee = determineDeliveryFee({
              miles,
              totalQuantity: totalQty,
              deliverySetups1: ds1,
              deliverySetups2: ds2,
              currencyMultiplier,
            });
            if (mode === 'pick') totalPickFee += fee;
            if (mode === 'return') totalReturnFee += fee;
          }
        }
      }
    }
  }

  const hasSpecial = items.some(it => it.isSpecial);
  const totalserviceamount = hasSpecial
    ? null
    : items.reduce((sum, it) => sum + (it.finalPrice ?? 0), 0);

  let discountAmount = 0;
  let finalPickFee = totalPickFee;
  let finalReturnFee = totalReturnFee;
  let finalServiceAmount = totalserviceamount;

  if (discountCode) {
    const rule = stack.discountRules.find(r => r.code === discountCode);
    if (rule) {
      const deductions = applyDiscountRule({
        discountType: rule.type,
        percentage: Number(rule.percentage),
        capInNgn: rule.capNaira ? Number(rule.capNaira) : null,
        currencyMultiplier,
        currentServicesTotal: totalserviceamount ?? 0,
        currentPickDeliveryTotal: totalPickFee,
        currentReturnDeliveryTotal: totalReturnFee,
      });

      discountAmount =
        deductions.servicesDiscount +
        deductions.pickDeliveryDiscount +
        deductions.returnDeliveryDiscount;

      if (totalserviceamount !== null) {
        finalServiceAmount = Math.max(0, totalserviceamount - deductions.servicesDiscount);
      }
      finalPickFee = Math.max(0, finalPickFee - deductions.pickDeliveryDiscount);
      finalReturnFee = Math.max(0, finalReturnFee - deductions.returnDeliveryDiscount);
    }
  }

  const totalDeliveryFee = finalPickFee + finalReturnFee;
  const netamount =
    totalserviceamount !== null && !hasSpecial
      ? (finalServiceAmount ?? 0) + finalPickFee + finalReturnFee
      : null;

  return {
    totalserviceamount: finalServiceAmount,
    totalpickdeliveryfee: finalPickFee,
    totalreturndeliveryfee: finalReturnFee,
    totalDeliveryFee,
    netamount,
    discountAmount,
  };
}

// ------------------------------------------------------------------ 
// 4. REDUCER
// ------------------------------------------------------------------ 

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_STACK': {
      const stack = action.payload;
      
      // Validate stack data
      if (!stack.companyAddresses?.length) {
        console.error('No company addresses provided');
        return { ...state, errors: { ...state.errors, stack: 'No company addresses available' } };
      }
      
      const defaultCust = stack.customerAddresses?.find(a => a.isDefault);
      let refCoords: { latitude: number; longitude: number } | null = null;

      if (stack.companyAddresses.length > 0) {
        if (defaultCust) {
          let minDist = Infinity;
          let closest = stack.companyAddresses[0];
          for (const comp of stack.companyAddresses) {
            const dist = calculateMilesDistance(
              defaultCust.latitude,
              defaultCust.longitude,
              comp.latitude,
              comp.longitude
            );
            if (dist >= 0 && dist < minDist) {
              minDist = dist;
              closest = comp;
            }
          }
          refCoords = { latitude: closest.latitude, longitude: closest.longitude };
        } else {
          refCoords = {
            latitude: stack.companyAddresses[0].latitude,
            longitude: stack.companyAddresses[0].longitude,
          };
        }
      }
      
      // --- Automatic default currency selection (new) ---
      let currency = state.currency;
      if (!currency) {
        // Prefer the base currency (multiplier 1.0), otherwise the first one
        const defaultCurr =
          stack.currencies.find(c => c.multiplier === 1.0) || stack.currencies[0];
        if (defaultCurr) {
          currency = defaultCurr;
        }
      }
      
      // If currency changed (or was set from null), recalc all item prices
      let items = state.items;
      if (currency && currency.id !== state.currency?.id) {
        items = recalcAllItems(state.items, stack, currency);
      }
      
      const newState = { 
        ...state, 
        stack, 
        referenceCoords: refCoords, 
        currency,
        items,
        errors: { ...state.errors, stack: null } 
      };
      return { ...newState, errors: validateCart(newState) };
    }

    case 'ADD_ITEM': {
      const newItem = action.payload;
      
      if (newItem.quantity <= 0) {
        console.error('Cannot add item with quantity <= 0');
        return state;
      }
      
      let newState = { ...state, items: [...state.items, newItem] };

      // --- Auto‑select default currency if missing when first item is added ---
      if (newState.items.length > 0 && !newState.currency && newState.stack) {
        const defaultCurr =
          newState.stack.currencies.find(c => c.multiplier === 1.0) ||
          newState.stack.currencies[0];
        if (defaultCurr) {
          newState.currency = defaultCurr;
          newState.items = recalcAllItems(
            newState.items,
            newState.stack,
            defaultCurr
          );
        }
      }
      
      return { ...newState, errors: validateCart(newState) };
    }

    case 'REMOVE_ITEM': {
      const newState = { ...state, items: state.items.filter(it => it.id !== action.payload) };
      return { ...newState, errors: validateCart(newState) };
    }

    case 'UPDATE_ITEM': {
      const { id, updates } = action.payload;
      
      if (updates.quantity !== undefined && updates.quantity <= 0) {
        console.error('Cannot update item with quantity <= 0');
        return state;
      }
      
      const newState = {
        ...state,
        items: state.items.map(it => {
          if (it.id !== id) return it;
          const updated = { ...it, ...updates };
          
          if (
            updates.quantity !== undefined ||
            updates.processingRuleId !== undefined
          ) {
            const rule = state.stack?.processingRules.find(
              r => r.id === updated.processingRuleId
            );
            const mult = rule ? Number(rule.multiplier) : 0;
            const currMult = state.currency?.multiplier ?? 1;
            const recalc = recalcItemPrice(updated, mult, currMult);
            updated.finalPrice = recalc.finalPrice;
            updated.isSpecial = recalc.isSpecial;
          }
          return updated;
        }),
      };
      
      return { ...newState, errors: validateCart(newState) };
    }

    case 'DUPLICATE_ITEM': {
      const original = state.items.find(it => it.id === action.payload);
      if (!original) return state;
      
      const duplicate: CartItem = {
        ...original,
        id: `${original.id}_copy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      };
      
      const newState = { ...state, items: [...state.items, duplicate] };
      return { ...newState, errors: validateCart(newState) };
    }

    case 'SET_CURRENCY': {
      if (!action.payload?.id || !action.payload?.multiplier) {
        console.error('Invalid currency data');
        return state;
      }
      
      // Recalculate all item prices with new currency
      const newItems = recalcAllItems(state.items, state.stack, action.payload);
      
      return { 
        ...state, 
        currency: action.payload,
        items: newItems,
        errors: { ...state.errors, currency: null }
      };
    }

    case 'SET_DISCOUNT_CODE':
      return { ...state, discountCode: action.payload };

    case 'SET_PHONE':
      return { 
        ...state, 
        phone: action.payload,
        errors: { ...state.errors, phone: null }
      };

    case 'CLEAR_CART':
      return { 
        ...state, 
        items: [], 
        discountCode: null, 
        phone: null,
        errors: {
          items: {},
          currency: null,
          phone: null,
          stack: state.stack ? null : 'Configuration not loaded',
          discount: null,
        }
      };

    case 'VALIDATE_CART':
      return { ...state, errors: validateCart(state) };

    case 'CLEAR_ERRORS':
      return {
        ...state,
        errors: {
          items: {},
          currency: null,
          phone: null,
          stack: null,
          discount: null,
        }
      };

    case 'RESTORE_STATE': {
      const { items, currency, discountCode, phone } = action.payload;
      return {
        ...state,
        items,
        currency,
        discountCode,   // we always pass null from hydrate
        phone,
      };
    }

    default:
      return state;
  }
}

// ------------------------------------------------------------------ 
// 5. CONTEXT
// ------------------------------------------------------------------ 

interface CartContextValue {
  items: CartItem[];
  currency: CurrencyInfo | null;
  discountCode: string | null;
  phone: string | null;
  totals: CartTotals | null;
  stack: CalculationStack | null;
  referenceCoords: { latitude: number; longitude: number } | null;
  errors: ValidationErrors;
  isValid: boolean;
  // NEW
  fetchStack: () => Promise<void>;
  stackLoading: boolean;
  stackError: string | null;

  addItem: (payload: CartItem) => void;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<Pick<CartItem, 'quantity' | 'deliveryMode' | 'pickAddressId' | 'returnAddressId' | 'processingRuleId'>>) => void;
  duplicateItem: (id: string) => void;
  setCurrency: (c: CurrencyInfo) => void;
  setDiscountCode: (code: string | null) => void;
  setPhone: (phone: string | null) => void;
  clearCart: () => void;
  validateCart: () => void;
  clearErrors: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY = 'cart_state';
const CART_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    currency: null,
    discountCode: null,
    phone: null,
    stack: null,
    referenceCoords: null,
    totals: null,
    errors: {
      items: {},
      currency: null,
      phone: null,
      stack: null,
      discount: null,
    },
  });

  const [isHydrated, setIsHydrated] = useState(false);
  // --- Lazy fetch states ---
  const [stackLoading, setStackLoading] = useState(false);
  const [stackError, setStackError] = useState<string | null>(null);

  // ---------- Hydrate from localStorage (unchanged) ----------
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.timestamp && Date.now() - parsed.timestamp < CART_TTL_MS) {
          const { data } = parsed;
          if (data) {
            dispatch({
              type: 'RESTORE_STATE',
              payload: {
                items: data.items || [],
                currency: data.currency || null,
                discountCode: null,
                phone: data.phone || null,
              },
            });
          }
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // ---------- Lazy stack fetch (replaces old automatic useEffect) ----------
  const fetchStack = useCallback(async () => {
    if (state.stack || stackLoading) return; // already loaded or loading
    setStackLoading(true);
    setStackError(null);
    try {
      const res = await fetch('/api/stack/calculation');
      if (!res.ok) throw new Error('Failed to fetch calculation stack');
      const data: CalculationStack = await res.json();
      if (!data.companyAddresses?.length) {
        throw new Error('Invalid calculation stack: no company addresses');
      }
      dispatch({ type: 'SET_STACK', payload: data });
    } catch (err: any) {
      console.error('Failed to load calculation stack', err);
      setStackError(err.message || 'Could not load configuration');
      // Set an empty stack so the app can still render (validation will catch missing data)
      dispatch({
        type: 'SET_STACK',
        payload: {
          companyAddresses: [],
          deliverySetups1: [],
          deliverySetups2: [],
          processingRules: [],
          discountRules: [],
          currencies: [],
          customerAddresses: [],
        },
      });
    } finally {
      setStackLoading(false);
    }
  }, [state.stack, stackLoading]);

  // ---------- Persist to localStorage (unchanged) ----------
  useEffect(() => {
    if (!isHydrated) return;
    const dataToStore = {
      items: state.items,
      currency: state.currency,
      phone: state.phone,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data: dataToStore,
      timestamp: Date.now(),
    }));
  }, [state.items, state.currency, state.phone, isHydrated]);

  // ... (rest of the helpers, totals, isValid, action callbacks unchanged) ...

  const clearCart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const totals = useMemo(() => {
    return computeTotals(
      state.items,
      state.currency,
      state.discountCode,
      state.stack,
      state.referenceCoords
    );
  }, [state.items, state.currency, state.discountCode, state.stack, state.referenceCoords]);

  const isValid = useMemo(() => {
    return (
      !state.errors.stack &&
      !state.errors.currency &&
      !state.errors.phone &&
      !state.errors.discount &&
      Object.keys(state.errors.items).length === 0 &&
      state.items.length > 0 &&
      state.currency !== null
    );
  }, [state.errors, state.items, state.currency]);

  const addItem = useCallback((payload: CartItem) => dispatch({ type: 'ADD_ITEM', payload }), []);
  const removeItem = useCallback((id: string) => dispatch({ type: 'REMOVE_ITEM', payload: id }), []);
  const updateItem = useCallback(
    (id: string, updates: Partial<Pick<CartItem, 'quantity' | 'deliveryMode' | 'pickAddressId' | 'returnAddressId' | 'processingRuleId'>>) =>
      dispatch({ type: 'UPDATE_ITEM', payload: { id, updates } }),
    []
  );
  const duplicateItem = useCallback((id: string) => dispatch({ type: 'DUPLICATE_ITEM', payload: id }), []);
  const setCurrency = useCallback((c: CurrencyInfo) => dispatch({ type: 'SET_CURRENCY', payload: c }), []);
  const setDiscountCode = useCallback((code: string | null) => dispatch({ type: 'SET_DISCOUNT_CODE', payload: code }), []);
  const setPhone = useCallback((phone: string | null) => dispatch({ type: 'SET_PHONE', payload: phone }), []);
  const validateCart = useCallback(() => dispatch({ type: 'VALIDATE_CART' }), []);
  const clearErrors = useCallback(() => dispatch({ type: 'CLEAR_ERRORS' }), []);

  const value = useMemo<CartContextValue>(
    () => ({
      items: state.items,
      currency: state.currency,
      discountCode: state.discountCode,
      phone: state.phone,
      totals,
      stack: state.stack,
      referenceCoords: state.referenceCoords,
      errors: state.errors,
      isValid,
      fetchStack,
      stackLoading,
      stackError,
      addItem,
      removeItem,
      updateItem,
      duplicateItem,
      setCurrency,
      setDiscountCode,
      setPhone,
      clearCart,
      validateCart,
      clearErrors,
    }),
    [
      state.items,
      state.currency,
      state.discountCode,
      state.phone,
      totals,
      state.stack,
      state.referenceCoords,
      state.errors,
      isValid,
      fetchStack,
      stackLoading,
      stackError,
      addItem,
      removeItem,
      updateItem,
      duplicateItem,
      setCurrency,
      setDiscountCode,
      setPhone,
      clearCart,
      validateCart,
      clearErrors,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

// ------------------------------------------------------------------ 
// 6. CATALOG HELPER (useCatalog)
// ------------------------------------------------------------------ 

export interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  img?: string;
  price?: number;
  isspecial?: boolean;
  disabled?: boolean;
  clothPartialServices?: {
    id: string;
    name: string;
    price: number;
  }[];
  variants?: {
    id: string;
    name: string;
    price?: number;
    isspecial?: boolean;
    disabled?: boolean;
    variantPartialServices?: {
      id: string;
      name: string;
      price: number;
    }[];
  }[];
}

export function useCatalog() {
  const { currency } = useCart();

  const fetchCatalog = useCallback(
    async (currencyOverride?: CurrencyInfo): Promise<CatalogItem[]> => {
      const res = await fetch('/api/stack/catalog');
      if (!res.ok) {
        throw new Error('Failed to fetch catalog');
      }
      
      const raw = await res.json();
      
      if (!Array.isArray(raw)) {
        throw new Error('Invalid catalog data format');
      }

      const mult = currencyOverride?.multiplier ?? currency?.multiplier ?? 1;
      
      if (mult <= 0) {
        throw new Error('Invalid currency multiplier');
      }
      
      const convert = (val: number) => convertCurrency(val, mult);

      return raw.map((cloth: any) => ({
        id: cloth.id,
        name: cloth.name,
        description: cloth.description,
        img: cloth.img,
        ...(cloth.price !== undefined
          ? { price: convert(cloth.price) }
          : cloth.isspecial
          ? { isspecial: true }
          : {}),
        disabled: cloth.disabled,
        clothPartialServices: cloth.clothPartialServices?.map((cps: any) => ({
          ...cps,
          price: convert(cps.price),
        })),
        variants: cloth.variants?.map((v: any) => ({
          id: v.id,
          name: v.name,
          ...(v.price !== undefined
            ? { price: convert(v.price) }
            : v.isspecial
            ? { isspecial: true }
            : {}),
          disabled: v.disabled,
          variantPartialServices: v.variantPartialServices?.map((vps: any) => ({
            ...vps,
            price: convert(vps.price),
          })),
        })),
      }));
    },
    [currency]
  );

  return fetchCatalog;
}

// ------------------------------------------------------------------ 
// 7. ORDER SUBMISSION HELPER (useSubmitOrder)
// ------------------------------------------------------------------ 

interface SubmitOrderParams {
  phoneNumber?: string;
  currencyId?: string;
  customerAddressId?: string;
  discountRuleCode?: string;
  specialOrderNote?: string;
}

export function useSubmitOrder() {
  const { items, currency, discountCode, phone, isValid, errors } = useCart();

  const submitOrder = useCallback(
    async (params: SubmitOrderParams = {}) => {
      // Validate cart before submission
      if (!isValid) {
        const errorMessages = [
          errors.stack,
          errors.currency,
          errors.phone,
          errors.discount,
          ...Object.values(errors.items).flat()
        ].filter(Boolean);
        
        throw new Error(`Cart validation failed: ${errorMessages.join(', ')}`);
      }
      
      if (items.length === 0) {
        throw new Error('Cart is empty');
      }
      
      const phoneToUse = params.phoneNumber ?? phone;
      const currencyIdToUse = params.currencyId ?? currency?.id;
      
      // Phone is mandatory – no fallback
      if (!phoneToUse) {
        throw new Error('Phone number is required for order');
      }
      if (!currencyIdToUse) {
        throw new Error('Currency is required for order');
      }
      
      // Validate phone format
      if (!/^\+?[\d\s-]{10,}$/.test(phoneToUse)) {
        throw new Error('Invalid phone number format');
      }

      // Build cart items with only the relevant ID based on type
      const cartItems = items.map(item => {
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
      });

      const payload = {
        phoneNumber: phoneToUse,
        currencyId: currencyIdToUse,
        customerAddressId: params.customerAddressId,
        discountRuleCode: params.discountRuleCode ?? discountCode,
        specialOrderNote: params.specialOrderNote,
        cartItems,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Order submission failed' }));
        throw new Error(err.message || 'Order submission failed');
      }

      return res.json();
    },
    [items, currency, discountCode, phone, isValid, errors]
  );

  return submitOrder;
}