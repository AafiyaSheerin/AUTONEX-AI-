export interface BuyerPurchase {
  id: string;
  order_id: string;
  product_name: string;
  product_image_url: string;
  merchant: string;
  amount: number;
  currency: string;
  delivery_address: string;
  delivery_date: string;
  timestamp: string;
  date: string;
}

export interface BryntumCalendarEvent {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  allDay?: boolean;
  eventColor?: string;
  orderId?: string;
  amount?: number;
}

export interface BuyerPurchaseCalendarResponse {
  success: boolean;
  daily_used: number;
  daily_limit: number;
  purchases: BuyerPurchase[];
  calendar_events: BryntumCalendarEvent[];
}

