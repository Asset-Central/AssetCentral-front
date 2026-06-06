import type { Favorite } from '@/types/favorites';

const KEY = 'ac_favorites';
const EVENT = 'ac-favorites-changed';

function _dispatch() {
  window.dispatchEvent(new CustomEvent(EVENT));
}

export function getFavorites(): Favorite[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]') as Favorite[];
  } catch { return []; }
}

function _save(favs: Favorite[]) {
  localStorage.setItem(KEY, JSON.stringify(favs));
  _dispatch();
}

export function isFavorite(ticker: string): boolean {
  return getFavorites().some(f => f.ticker === ticker);
}

/** Adds if not present, removes if present. Returns true if now favorited. */
export function toggleFavorite(ticker: string, meta?: Partial<Omit<Favorite, 'ticker' | 'isOpen' | 'addedAt'>>): boolean {
  const favs = getFavorites();
  const idx = favs.findIndex(f => f.ticker === ticker);
  if (idx >= 0) {
    favs.splice(idx, 1);
    _save(favs);
    return false;
  }
  favs.push({ ticker, ...meta, isOpen: false, addedAt: new Date().toISOString() });
  _save(favs);
  return true;
}

export function setFavoriteOpen(ticker: string, open: boolean) {
  const favs = getFavorites();
  const fav = favs.find(f => f.ticker === ticker);
  if (fav) { fav.isOpen = open; _save(favs); }
}

export function removeFavorite(ticker: string) {
  _save(getFavorites().filter(f => f.ticker !== ticker));
}

export const FAVORITES_EVENT = EVENT;
