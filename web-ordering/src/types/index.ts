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
  whatsapp_access_token?: string | null;
  whatsapp_phone_number_id?: string | null;
  whatsapp_business_account_id?: string | null;
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
  items?: TransactionItem[];
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

export interface MenuCategory {
  id: string;
  cafe_id: string;
  name: string;
  created_at: string;
}

export interface MenuItem {
  id: string;
  category_id: string;
  cafe_id: string;
  name: string;
  price: number;
  description: string | null;
  created_at: string;
}

export interface TransactionItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface WhatsAppTemplate {
  id: string;
  cafe_id: string;
  name: string;
  body: string;
  meta_template_name?: string | null;
  meta_language_code?: string;
  created_at: string;
}

export interface CustomerList {
  id: string;
  cafe_id: string;
  name: string;
  description: string | null;
  created_at: string;
  member_count?: number;
}

export interface CustomerListMember {
  list_id: string;
  customer_id: string;
  created_at?: string;
}

export interface WhatsAppCampaign {
  id: string;
  cafe_id: string;
  template_id: string;
  list_id: string | null;
  name: string;
  status: string;
  sent_count: number;
  delivered_count: number;
  failed_count: number;
  created_at: string;
  template_name?: string;
  list_name?: string;
}

export interface WhatsAppCampaignLog {
  id: string;
  campaign_id: string;
  customer_name: string;
  customer_phone: string;
  status: string;
  error_message: string | null;
  created_at: string;
}

