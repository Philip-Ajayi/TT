//lib/utils/order-helpers.ts
export function convertCurrency(amountNgn: number, multiplier: number): number {
  return amountNgn * multiplier;
}

export function determineSubOrderPrice(params: {
  basePriceNgn: number | null;
  processingMultiplier: number;
  quantity: number;
  currencyMultiplier: number;
}): { finalPrice: number; isSpecial: boolean } {
  if (params.basePriceNgn === null) {
    return { finalPrice: 0, isSpecial: true };
  }
  
  const calculatedBase = params.basePriceNgn * params.currencyMultiplier;
  const surchargeFactor = 1 + params.processingMultiplier;
  const finalPrice = calculatedBase * surchargeFactor * params.quantity;
  
  return { finalPrice, isSpecial: false };
}

// Utility range checker helper function
function parseAndMatchRange(value: number, syntaxStr: string): boolean {
  if (!syntaxStr.includes('-')) {
    return value === Number(syntaxStr);
  }
  const [min, max] = syntaxStr.split('-').map(Number);
  return value >= min && value <= (max || Infinity);
}

export function determineDeliveryFee(params: {
  miles: number;
  totalQuantity: number;
  deliverySetups1: Array<{ miles: string; pricePerMile: number }>;
  deliverySetups2: Array<{ quantity: string; multiplier: number }>;
  currencyMultiplier: number;
}): number {
  if (params.miles === 0) return 0;

  // 1. Match Delivery Setup 1 (Price per Mile)
  const matchedSetup1 = params.deliverySetups1.find((setup) => 
    parseAndMatchRange(params.miles, setup.miles)
  ) || params.deliverySetups1[0];

  // 2. Match Delivery Setup 2 (Multiplier)
  const matchedSetup2 = params.deliverySetups2.find((setup) => 
    parseAndMatchRange(params.totalQuantity, setup.quantity)
  ) || params.deliverySetups2[0];

  if (!matchedSetup1 || !matchedSetup2) return 0;

  const pricePerMile = Number(matchedSetup1.pricePerMile);
  const multiplier = Number(matchedSetup2.multiplier);

  // Fee rule implementation: multiplier * pricePerMile
  const feeInNgn = multiplier * pricePerMile;
  return feeInNgn * params.currencyMultiplier;
}

export function applyDiscountRule(params: {
  discountType: string; // "cart", "services", "delivery"
  percentage: number;
  capInNgn: number | null;
  currencyMultiplier: number;
  currentServicesTotal: number;
  currentPickDeliveryTotal: number;
  currentReturnDeliveryTotal: number;
}): { servicesDiscount: number; pickDeliveryDiscount: number; returnDeliveryDiscount: number } {
  let servicesDiscount = 0;
  let pickDeliveryDiscount = 0;
  let returnDeliveryDiscount = 0;

  const totalDeliveryTotal = params.currentPickDeliveryTotal + params.currentReturnDeliveryTotal;
  const capInTargetCurrency = params.capInNgn !== null ? params.capInNgn * params.currencyMultiplier : Infinity;
  const rate = params.percentage / 100;

  if (params.discountType === 'services') {
    servicesDiscount = Math.min(params.currentServicesTotal * rate, capInTargetCurrency);
  } else if (params.discountType === 'delivery') {
    const computedDeliveryDiscount = Math.min(totalDeliveryTotal * rate, capInTargetCurrency);
    if (totalDeliveryTotal > 0) {
      pickDeliveryDiscount = (params.currentPickDeliveryTotal / totalDeliveryTotal) * computedDeliveryDiscount;
      returnDeliveryDiscount = (params.currentReturnDeliveryTotal / totalDeliveryTotal) * computedDeliveryDiscount;
    }
  } else if (params.discountType === 'cart') {
    const totalCart = params.currentServicesTotal + totalDeliveryTotal;
    const computedDiscount = Math.min(totalCart * rate, capInTargetCurrency);
    
    if (totalCart > 0) {
      servicesDiscount = (params.currentServicesTotal / totalCart) * computedDiscount;
      const deliveryPortion = (totalDeliveryTotal / totalCart) * computedDiscount;
      if (totalDeliveryTotal > 0) {
        pickDeliveryDiscount = (params.currentPickDeliveryTotal / totalDeliveryTotal) * deliveryPortion;
        returnDeliveryDiscount = (params.currentReturnDeliveryTotal / totalDeliveryTotal) * deliveryPortion;
      }
    }
  }

  return {
    servicesDiscount: isNaN(servicesDiscount) ? 0 : servicesDiscount,
    pickDeliveryDiscount: isNaN(pickDeliveryDiscount) ? 0 : pickDeliveryDiscount,
    returnDeliveryDiscount: isNaN(returnDeliveryDiscount) ? 0 : returnDeliveryDiscount,
  };
}