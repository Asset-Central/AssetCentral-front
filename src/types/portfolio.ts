import type { Asset } from './asset';

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  assetIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  portfolio: Portfolio;
  assets: Asset[];
  totalArs: number;
  totalUsd?: number;
  dailyChangePercent: number;
}
