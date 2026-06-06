import { LitElement, html, svg, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import type { Asset, AssetType } from '@/types/asset';

interface Tile {
  x: number; y: number; w: number; h: number;
  asset: Asset;
}

// Colores consistentes con ac-distribution-chart
const TYPE_COLOR: Record<AssetType, string> = {
  cedear: '#818cf8',
  bono:   '#34d399',
  fci:    '#fb923c',
  cash:   '#facc15',
  stock:  '#f472b6',
  crypto: '#60a5fa',
};

const TYPE_LABEL: Record<AssetType, string> = {
  cedear: 'CEDEARs',
  bono:   'Bonos',
  fci:    'FCI',
  cash:   'Efectivo',
  stock:  'Acciones',
  crypto: 'Crypto',
};

@customElement('ac-treemap')
export class AcTreemap extends LitElement {
  static styles = css`
    :host { display: block; width: 100%; }
    .wrap {
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
    .tile { cursor: default; }
    .tile rect { transition: opacity 0.12s; }
    .tile:hover rect { opacity: 0.8; }
    .empty {
      display: flex; align-items: center; justify-content: center;
      height: 200px;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  `;

  @property({ type: Array }) assets: Asset[] = [];
  @state() private _w = 900;

  private _ro?: ResizeObserver;
  private readonly H = 420;

  firstUpdated() {
    const el = this.shadowRoot!.querySelector('svg') ?? this.shadowRoot!.querySelector('.wrap')!;
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

  render() {
    const items = this.assets.filter(a => (a.total_valuation ?? 0) > 0);
    const total = items.reduce((s, a) => s + (a.total_valuation ?? 0), 0);

    const usedTypes = [...new Set(items.map(a => a.asset_type).filter(Boolean))] as AssetType[];

    return html`
      <div class="wrap">
        <div class="header">
          <span class="title">Mapa de activos</span>
          <div class="legend">
            ${usedTypes.map(t => html`
              <div class="legend-item">
                <div class="legend-dot" style="background:${TYPE_COLOR[t]}"></div>
                ${TYPE_LABEL[t] ?? t}
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
            >
              ${this._buildTiles(items, total).map(tile => this._tile(tile, total))}
            </svg>
          `}
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

    const color = TYPE_COLOR[tile.asset.asset_type ?? 'stock'] ?? '#818cf8';
    const pct   = ((tile.asset.total_valuation ?? 0) / total * 100).toFixed(1);
    const fs    = Math.min(w / 4.5, h / 2.2, 20);
    const fsub  = Math.max(fs * 0.58, 9);

    const showLabel = w > 28 && h > 18 && fs >= 7;
    const showPct   = w > 48 && h > 36 && fsub >= 8;
    const midY = showPct ? y + h / 2 - fsub * 0.4 : y + h / 2;

    return svg`
      <g class="tile">
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
          <text x="${x + w / 2}" y="${midY + fs * 0.85}"
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
