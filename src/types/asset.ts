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
}

export interface AssetGroup {
  type: AssetType;
  total_valuation: number;
  percentage: number;
  assets: Asset[];
}
