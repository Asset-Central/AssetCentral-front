export interface MarketQuote {
  ticker: string;
  name?: string;
  asset_type?: string;
  currency?: string;
  exchange?: string;
  unit_price?: number;
  daily_change_pct?: number;
  market_cap?: number;
}

export interface MarketPricePoint {
  date: string;
  price: number;
}
