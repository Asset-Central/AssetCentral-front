import type { Platform } from './account';

export type AssetType = 'cedear' | 'bono' | 'fci' | 'cash' | 'crypto' | 'stock';

export type Currency = 'ARS' | 'USD';

export { Platform };

export interface Asset {
  ticker: string;
  name?: string;
  asset_type?: AssetType;
  platform?: Platform;
  currency?: Currency;
  account_id: string;
  quantity: number;
  unit_price?: number;
  total_valuation?: number;
  recorded_at?: string;
  daily_change_pct?: number;
}

export interface PricePoint {
  date: string;
  unit_price: number;
  total_valuation: number;
}

export interface ValuePoint {
  date: string;
  total: number;
}

export interface InflationPoint {
  date: string;  // "YYYY-MM"
  rate: number;  // monthly % change
}

export interface AssetGroup {
  type: AssetType;
  total_valuation: number;
  percentage: number;
  assets: Asset[];
}
