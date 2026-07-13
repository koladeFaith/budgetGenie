export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  currency: string;
  savings_goal: number;
  dark_mode: boolean;
  notifications_enabled: boolean;
  irregular_income: boolean;
  created_at: string;
  updated_at: string;
};

export type CategoryCorrection = {
  id: string;
  user_id: string;
  keyword: string;
  category_id: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
  created_at: string;
};

export type Transaction = {
  id: string;
  user_id: string;
  amount: number;
  type: "income" | "expense";
  category_id: string | null;
  description: string | null;
  date: string;
  is_anomaly: boolean;
  created_at: string;
};

export type Budget = {
  id: string;
  user_id: string;
  category_id: string;
  monthly_limit: number;
  month: number;
  year: number;
  created_at: string;
};

export type Alert = {
  id: string;
  user_id: string;
  message: string;
  alert_type: string;
  is_read: boolean;
  created_at: string;
};
