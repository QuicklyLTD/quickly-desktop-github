export interface ChangeState {
  discountAmount: number;
  currentAmount: number;
  changePrice: number;
  changeMessage: string;
}

export function calculateChangeState(priceWillPay: number, payedPrice: number, discountPercent?: number): ChangeState {
  const discountAmount = discountPercent ? (priceWillPay * discountPercent) / 100 : 0;
  const currentAmount = priceWillPay - discountAmount;
  const changePrice = payedPrice - priceWillPay + discountAmount;
  const changeMessage = changePrice > 0 ? 'Para Üstü' : 'Kalan Ödeme';

  return {
    discountAmount,
    currentAmount,
    changePrice,
    changeMessage
  };
}
