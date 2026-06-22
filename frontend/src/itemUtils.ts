import { ItemCalculationResult, ItemQuoteItem } from './types';

export function calculateQuotationTotals(items: ItemQuoteItem[]): ItemCalculationResult {
  let totalSubtotal = 0;
  let totalDiscount = 0;
  let totalGst = 0;
  let totalGrand = 0;

  items.forEach((item) => {
    const baseItemPrice = item.complimentary ? 0 : item.price;
    const qty = Math.max(0, item.quantity);
    const itemSubtotal = baseItemPrice * qty;

    let itemDiscountInput = 0;
    if (item.discountType === 'Percentage') {
      itemDiscountInput = itemSubtotal * (Math.max(0, item.discountValue) / 100);
    } else if (item.discountType === 'Flat') {
      itemDiscountInput = Math.max(0, item.discountValue);
    }
    const itemDiscountResolved = Math.min(itemSubtotal, itemDiscountInput);
    const postDiscountBalance = itemSubtotal - itemDiscountResolved;

    let itemGst = 0;
    let itemFinalLineTotal = 0;

    if (item.taxInclusive) {
      const gstRateDecimal = item.gstRate / 100;
      const divisor = 1 + gstRateDecimal;
      const calculatedBase = postDiscountBalance / divisor;
      itemGst = postDiscountBalance - calculatedBase;
      itemFinalLineTotal = postDiscountBalance;
    } else {
      const gstRateDecimal = item.gstRate / 100;
      itemGst = postDiscountBalance * gstRateDecimal;
      itemFinalLineTotal = postDiscountBalance + itemGst;
    }

    totalSubtotal += itemSubtotal;
    totalDiscount += itemDiscountResolved;
    totalGst += itemGst;
    totalGrand += itemFinalLineTotal;
  });

  return {
    subtotal: Math.round(totalSubtotal * 100) / 100,
    discountTotal: Math.round(totalDiscount * 100) / 100,
    gstTotal: Math.round(totalGst * 100) / 100,
    grandTotal: Math.round(totalGrand * 100) / 100,
  };
}

export function formatCurrency(amount: number, symbol: string = '₹'): string {
  return `${symbol}${amount.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}
