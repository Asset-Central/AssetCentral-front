import { LitElement, html, svg, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import type { Asset, AssetType } from '@/types/asset';

interface Tile {
  x: number; y: number; w: number; h: number;
  asset: Asset;
}

interface Tip {
  x: number;
  y: number;
  asset: Asset;
}

/** Devuelve color de tile según daily_change_pct: verde si sube, rojo si baja, gris si neutro. */
function tileColor(pct: number | undefined): string {
  if (pct == null) return '#4b5563';
  if (pct >= 3)    return '#059669';
  if (pct >= 1)    return '#34d399';
  if (pct >= 0)    return '#6ee7b7';
  if (pct >= -1)   return '#fca5a5';
  if (pct >= -3)   return '#f87171';
  return '#dc2626';
}

const TYPE_LABEL: Record<AssetType, string> = {
  cedear: 'CEDEAR',
  bono:   'Bono',
  fci:    'FCI',
  cash:   'Efectivo',
  stock:  'Acción',
  crypto: 'Cripto',
};

@customElement('ac-treemap')
export class AcTreemap extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; }
    .wrap {
      position: relative;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    }
    .title { font-size: var(--text-sm); color: var(--color-text-muted); }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-3);
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: var(--text-xs);
      color: var(--color-text-muted);
    }
    .legend-dot {
      width: 8px; height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }
    svg { display: block; border-radius: var(--radius-md); overflow: hidden; }
    .tile { cursor: pointer; }
    .tile rect { transition: opacity 0.12s; }
    .tile:hover rect { opacity: 0.8; }
    .empty {
      display: flex; align-items: center; justify-content: center;
      height: 200px;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }

    /* Tooltip */
    .tip {
      position: absolute;
      pointer-events: none;
      background: rgba(15, 15, 25, 0.92);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 7px 10px;
      font-size: 12px;
      line-height: 1.5;
      white-space: nowrap;
      color: #e5e7eb;
      box-shadow: 0 4px 16px rgba(0,0,0,.4);
      z-index: 10;
      transform: translate(12px, -50%);
    }
    .tip-ticker {
      font-weight: 700;
      font-size: 13px;
      color: #f9fafb;
    }
    .tip-type {
      color: #9ca3af;
      font-size: 11px;
    }
    .tip-price {
      font-family: monospace;
      color: #d1fae5;
      margin-top: 2px;
    }
    .tip-change-up   { color: #34d399; font-family: monospace; font-size: 11px; }
    .tip-change-down { color: #f87171; font-family: monospace; font-size: 11px; }
  `;

  @property({ type: Array }) assets: Asset[] = [];
  @state() private _w = 900;
  @state() private _tip: Tip | null = null;

  private _ro?: ResizeObserver;
  private readonly H = 420;

  firstUpdated() {
    this._ro = new ResizeObserver(entries => {
      const w = entries[0].contentRect.width;
      if (w > 10) this._w = w;
    });
    this._ro.observe(this.shadowRoot!.querySelector('.wrap')!);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._ro?.disconnect();
  }

  private _onTileClick(ticker: string) {
    Router.go(`/assets?open=${encodeURIComponent(ticker)}`);
  }

  private _onTileHover(e: MouseEvent, asset: Asset) {
    const svgEl = this.shadowRoot!.querySelector('svg');
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    this._tip = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      asset,
    };
  }

  render() {
    const items = this.assets.filter(a => (a.total_valuation ?? 0) > 0);
    const total = items.reduce((s, a) => s + (a.total_valuation ?? 0), 0);
    const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });

    const tip = this._tip;

    return html`
      <div class="wrap">
        <div class="header">
          <span class="title">Mapa de activos</span>
          <div class="legend">
            ${[
              { label: '> +3%',   color: '#059669' },
              { label: '+1–3%',   color: '#34d399' },
              { label: '0–1%',    color: '#6ee7b7' },
              { label: '-1–0%',   color: '#fca5a5' },
              { label: '-3–1%',   color: '#f87171' },
              { label: '< -3%',   color: '#dc2626' },
            ].map(l => html`
              <div class="legend-item">
                <div class="legend-dot" style="background:${l.color}"></div>
                ${l.label}
              </div>
            `)}
          </div>
        </div>

        ${!items.length
          ? html`<div class="empty">Sin activos para mostrar</div>`
          : html`
            <svg
              width="${this._w}"
              height="${this.H}"
              viewBox="0 0 ${this._w} ${this.H}"
              @mouseleave="${() => { this._tip = null; }}"
            >
              ${this._buildTiles(items, total).map(tile => this._tile(tile, total))}
            </svg>
          `}

        ${tip ? html`
          <div class="tip" style="left:${tip.x}px;top:${tip.y}px">
            <div class="tip-ticker">${tip.asset.ticker}</div>
            <div class="tip-type">${TYPE_LABEL[tip.asset.asset_type as AssetType] ?? tip.asset.asset_type ?? ''}</div>
            ${tip.asset.unit_price != null ? html`
              <div class="tip-price">${tip.asset.currency ?? ''} ${fmt.format(tip.asset.unit_price)}</div>
            ` : ''}
            ${tip.asset.daily_change_pct != null ? html`
              <div class="${tip.asset.daily_change_pct >= 0 ? 'tip-change-up' : 'tip-change-down'}">
                ${tip.asset.daily_change_pct >= 0 ? '▲' : '▼'} ${Math.abs(tip.asset.daily_change_pct).toFixed(2)}%
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  private _tile(tile: Tile, total: number) {
    const GAP = 2;
    const x = tile.x + GAP;
    const y = tile.y + GAP;
    const w = Math.max(0, tile.w - GAP * 2);
    const h = Math.max(0, tile.h - GAP * 2);
    if (w < 4 || h < 4) return svg``;

    const color = tileColor(tile.asset.daily_change_pct);
    const pct   = ((tile.asset.total_valuation ?? 0) / total * 100).toFixed(1);

    // Scale font with tile size; cap at 20px
    const fs    = Math.min(w / 5, h / 2.5, 20);
    const fsub  = Math.max(fs * 0.65, 9);

    // Only show text labels for tiles large enough to be legible
    const showLabel = w > 60 && h > 30;
    const showPct   = w > 80 && h > 50;
    const midY = showPct ? y + h / 2 - fsub * 0.4 : y + h / 2;

    return svg`
      <g class="tile"
        @mousemove="${(e: MouseEvent) => this._onTileHover(e, tile.asset)}"
        @click="${() => this._onTileClick(tile.asset.ticker)}"
      >
        <rect x="${x}" y="${y}" width="${w}" height="${h}"
              fill="${color}" rx="4" ry="4"/>
        ${showLabel ? svg`
          <text x="${x + w / 2}" y="${midY}"
                text-anchor="middle" dominant-baseline="central"
                font-size="${fs}" font-weight="700" fill="white"
                font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                style="pointer-events:none;text-shadow:0 1px 2px rgba(0,0,0,.4)"
          >${tile.asset.ticker}</text>
        ` : svg``}
        ${showPct ? svg`
          <text x="${x + w / 2}" y="${midY + fs * 0.9}"
                text-anchor="middle" dominant-baseline="central"
                font-size="${fsub}" font-weight="400"
                fill="rgba(255,255,255,0.72)"
                font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                style="pointer-events:none"
          >${pct}%</text>
        ` : svg``}
      </g>
    `;
  }

  // ── Squarified treemap algorithm ──────────────────────────────────────────

  private _buildTiles(assets: Asset[], total: number): Tile[] {
    const sorted = [...assets].sort(
      (a, b) => (b.total_valuation ?? 0) - (a.total_valuation ?? 0)
    );
    const tiles: Tile[] = [];
    this._layout(sorted, 0, 0, this._w, this.H, total, tiles);
    return tiles;
  }

  private _layout(
    items: Asset[], x: number, y: number, w: number, h: number,
    total: number, tiles: Tile[],
  ): void {
    if (!items.length || w < 1 || h < 1 || total <= 0) return;

    if (items.length === 1) {
      tiles.push({ x, y, w, h, asset: items[0] });
      return;
    }

    let row: Asset[]  = [];
    let rowSum        = 0;

    for (let i = 0; i < items.length; i++) {
      const newRow = [...row, items[i]];
      const newSum = rowSum + (items[i].total_valuation ?? 0);
      if (!row.length || this._worst(newRow, newSum, total, w, h) <= this._worst(row, rowSum, total, w, h)) {
        row    = newRow;
        rowSum = newSum;
      } else {
        break;
      }
    }

    const rest = items.slice(row.length);

    if (w >= h) {
      const stripW = w * rowSum / total;
      let cy = y;
      for (const item of row) {
        const itemH = h * (item.total_valuation ?? 0) / rowSum;
        tiles.push({ x, y: cy, w: stripW, h: itemH, asset: item });
        cy += itemH;
      }
      this._layout(rest, x + stripW, y, w - stripW, h, total - rowSum, tiles);
    } else {
      const stripH = h * rowSum / total;
      let cx = x;
      for (const item of row) {
        const itemW = w * (item.total_valuation ?? 0) / rowSum;
        tiles.push({ x: cx, y, w: itemW, h: stripH, asset: item });
        cx += itemW;
      }
      this._layout(rest, x, y + stripH, w, h - stripH, total - rowSum, tiles);
    }
  }

  /** Worst aspect ratio for a candidate row (lower = more square-ish = better). */
  private _worst(row: Asset[], sum: number, total: number, w: number, h: number): number {
    if (!row.length || sum === 0 || total === 0) return Infinity;
    let worst = 0;
    if (w >= h) {
      const stripW = w * sum / total;
      for (const item of row) {
        const itemH = h * (item.total_valuation ?? 0) / sum;
        if (itemH === 0) continue;
        worst = Math.max(worst, Math.max(stripW / itemH, itemH / stripW));
      }
    } else {
      const stripH = h * sum / total;
      for (const item of row) {
        const itemW = w * (item.total_valuation ?? 0) / sum;
        if (itemW === 0) continue;
        worst = Math.max(worst, Math.max(stripH / itemW, itemW / stripH));
      }
    }
    return worst;
  }
}

declare global {
  interface HTMLElementTagNameMap { 'ac-treemap': AcTreemap; }
}
