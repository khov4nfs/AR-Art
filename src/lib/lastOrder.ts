export const LAST_ORDER_KEY = "everie_last_order";

export interface LastOrderSnapshot {
  orderNumber: string;
  total: number;
  paymentMethod: string;
  expectedMinDays: number;
  expectedMaxDays: number;
  hasEngraving: boolean;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  items: {
    name: string;
    quantity: number;
    price: number;
    image: string;
    color?: string;
    engravingText?: string;
    engravingPlacement?: string;
  }[];
}
