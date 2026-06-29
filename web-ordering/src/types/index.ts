export interface Cafe {
  id: string;
  name: string;
  owner: string;
  email: string | null;
  phone: string | null;
  logo: string | null;
  reward_name: string;
  reward_threshold: number;
  reward_description: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  cafe_id: string;
  name: string;
  phone: string;
  email: string | null;
  total_visits: number;
  current_progress: number;
  lifetime_spending: number;
  reward_count: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  customer_id: string;
  cafe_id: string;
  bill_amount: number;
  visit_number: number;
  created_at: string;
  customer?: {
    name: string;
    phone: string;
  };
}

export interface RewardRedemption {
  id: string;
  customer_id: string;
  cafe_id: string;
  reward_name: string;
  reward_value: number;
  redeemed_at: string;
  customer?: {
    name: string;
    phone: string;
  };
}
