export interface Favorite {
  ticker: string;
  name?: string;
  asset_type?: string;
  currency?: string;
  exchange?: string;
  unit_price?: number;
  daily_change_pct?: number;
  isOpen: boolean;
  addedAt: string;
}
