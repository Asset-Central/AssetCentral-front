import type { Currency } from './asset';

export interface PortfolioAsset {
  ticker: string;
  platform: string;
  target_share?: number;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  assets: PortfolioAsset[];
  created_at: string;
  updated_at: string;
}

export interface PortfolioAssetSummary {
  ticker: string;
  name?: string;
  asset_type?: string;
  currency?: Currency;
  platform?: string;
  total_quantity: number;
  unit_price?: number;
  total_valuation: number;
  target_share?: number;
}

export interface PortfolioSummary {
  portfolio: Portfolio;
  assets: PortfolioAssetSummary[];
  total_ars: number;
  total_usd: number;
}
