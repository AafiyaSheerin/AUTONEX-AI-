export interface BryntumGanttTask {
  id: number | string;
  name: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  duration?: number;
  percentDone?: number;
  percent_done?: number;
  baselines?: Array<{
    startDate?: string;
    duration?: number;
  }>;
}

export interface BryntumDependency {
  id?: string;
  from: number | string;
  to: number | string;
  fromEvent?: number | string;
  toEvent?: number | string;
}

export interface BryntumOrder {
  order_id: string;
  product: string;
  buyer_name: string;
  address: string;
  courier: string;
  status: string;
  paypal_order_id: string;
  paypal_status: string;
  policy_decision: string;
  placed_by_agent: boolean;
  tasks: BryntumGanttTask[];
  dependencies: BryntumDependency[];
  delay_days?: number;
  estimated_delivery?: string;
}

export interface BryntumCourier {
  id: string;
  name: string;
}

export interface CourierReassignResult {
  decision: "ALLOWED" | "NEEDS_APPROVAL" | "BLOCKED";
  reason: string;
  order_id: string;
  courier: string;
}

