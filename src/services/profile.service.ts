import { apiFetch } from '@/lib/fetch';

export interface FinancialProfileData {
  age?: number;
  monthly_income_ars?: number;
  savings_capacity_ars?: number;
  risk_aversion?: 'bajo' | 'medio' | 'alto';
  investment_horizon_months?: number;
  goals?: string[];
  currency_preference?: 'ARS' | 'USD' | 'ambas';
}

export interface UserFinancialProfile {
  profile: FinancialProfileData;
}

export async function fetchProfile(): Promise<UserFinancialProfile> {
  const res = await apiFetch('/api/profile');
  if (!res.ok) throw new Error(`Error fetching profile: ${res.status}`);
  return res.json();
}

export async function upsertProfile(data: FinancialProfileData): Promise<UserFinancialProfile> {
  const res = await apiFetch('/api/profile', {
    method: 'PUT',
    body: JSON.stringify({ profile: data }),
  });
  if (!res.ok) throw new Error(`Error saving profile: ${res.status}`);
  return res.json();
}
