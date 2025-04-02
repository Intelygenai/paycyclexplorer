
// Custom database type definitions to work with Supabase
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string;
  created_at?: string;
  updated_at?: string;
}

export interface CostCenter {
  id: string;
  name: string;
  description: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}
