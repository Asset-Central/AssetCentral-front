import { LitElement, html, svg, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { Router } from '@vaadin/router';
import type { Asset, AssetType } from '@/types/asset';
import type { Portfolio } from '@/types/portfolio';

interface Tile {
  x: number; y: number; w: number; h: number;
  asset: Asset;
}

interface Tip {
  x: number;
  y: number;
  asset: Asset;
  portfolios: Array<{ name: string; color: string }>;
}

/** Devuelve color de tile según daily_change_pct. */
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
  cedear: 'CEDEAR', bono: 'Bono', fci: 'FCI',
  cash: 'Efectivo', stock: 'Acción', crypto: 'Cripto',
};

const PORTFOLIO_COLORS = ['#818cf8', '#fb923c', '#34d399', '#f472b6', '#60a5fa', '#fbbf24'];

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
      flex-wrap: wrap;
      gap: var(--space-2);
    }
    .title { font-size: var(--text-sm); color: var(--color-text-muted); }
    .legends { display: flex; gap: var(--space-4); flex-wrap: wrap; }
    .legend { display: flex; flex-wrap: wrap; gap: var(--space-3); }
    .legend-item {
      display: flex; align-items: center; gap: 6px;
      font-size: var(--text-xs); color: var(--color-text-muted);
    }
    .legend-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
    svg { display: block; border-radius: var(--radius-md); overflow: hidden; }
    .tile { cursor: pointer; }
    .tile rect { transition: opacity 0.12s; }
    .tile:hover rect.bg { opacity: 0.8; }
    .empty {
      display: flex; align-items: center; justify-content: center;
      height: 200px;
      color: var(--color-text-muted); font-size: var(--text-sm);
    }
    .tip {
      position: absolute;
      pointer-events: none;
      background: rgba(15,15,25,0.94);
      border: 1px solid rgba(255,255,255,0.12);
      border-radius: 6px;
      padding: 8px 11px;
      font-size: 12px;
      line-height: 1.6;
      white-space: nowrap;
      color: #e5e7eb;
      box-shadow: 0 4px 16px rgba(0,0,0,.4);
      z-index: 10;
      transform: translate(14px, -50%);
    }
    .tip-ticker { font-weight: 700; font-size: 13px; color: #f9fafb; }
    .tip-type { color: #9ca3af; font-size: 11px; }
    .tip-price { font-family: monospace; color: #d1fae5; }
    .tip-change-up   { color: #34d399; font-family: monospace; font-size: 11px; }
    .tip-change-down { color: #f87171; font-family: monospace; font-size: 11px; }
    .tip-portfolios { margin-top: 4px; display: flex; flex-wrap: wrap; gap: 4px; }
    .tip-portfolio-tag {
      display: inline-flex; align-items: center; gap: 4px;
      font-size: 10px; padding: 1px 5px;
      border-radius: 3px;
      background: rgba(255,255,255,0.08);
    }
    .tip-portfolio-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  `;

  @property({ type: Array }) assets: Asset[] = [];
  @property({ type: Array }) portfolios: Portfolio[] = [];
  @state() private _w = 900;
  @state() private _tip: Tip | null = null;

  private _ro?: ResizeObserver;
  private readonly H = 420;

  private get _portfolioMap(): Map<string, Array<{ name: string; color: string }>> {
    const map = new Map<string, Array<{ name: string; color: string }>>();
    this.portfolios.forEach((p, i) => {
      const color = PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length];
      (p.assets ?? []).forEach(a => {
        const list = map.get(a.ticker) ?? [];
        list.push({ name: p.name, color });
        map.set(a.ticker, list);
      });
    });
    return map;
  }

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
    const portfolios = this._portfolioMap.get(asset.ticker) ?? [];
    this._tip = { x: e.clientX - rect.left, y: e.clientY - rect.top, asset, portfolios };
  }

  render() {
    const items = this.assets.filter(a => (a.total_valuation ?? 0) > 0);
    const total = items.reduce((s, a) => s + (a.total_valuation ?? 0), 0);
    const fmt = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 });
    const tip  = this._tip;

    // Build portfolio legend entries (only portfolios with assets visible in the map)
    const portfolioLegend = this.portfolios
      .map((p, i) => ({ name: p.name, color: PORTFOLIO_COLORS[i % PORTFOLIO_COLORS.length] }))
      .slice(0, 6);

    return html`
      <div class="wrap">
        <div class="header">
          <span class="title">Mapa de activos</span>
          <div class="legends">
            <!-- Leyenda de cambio % -->
            <div class="legend">
              ${[
                { label: '> +3%', color: '#059669' },
                { label: '+1–3%', color: '#34d399' },
                { label: '0–1%', color: '#6ee7b7' },
                { label: '-1–0%', color: '#fca5a5' },
                { label: '-3–1%', color: '#f87171' },
                { label: '< -3%', color: '#dc2626' },
              ].map(l => html`
                <div class="legend-item">
                  <div class="legend-dot" style="background:${l.color}"></div>${l.label}
                </div>
              `)}
            </div>
            <!-- Leyenda de portfolios -->
            ${portfolioLegend.length ? html`
              <div class="legend">
                ${portfolioLegend.map(p => html`
                  <div class="legend-item">
                    <div class="legend-dot" style="background:${p.color};border-radius:50%"></div>${p.name}
                  </div>
                `)}
              </div>
            ` : ''}
          </div>
        </div>

        ${!items.length
          ? html`<div class="empty">Sin activos para mostrar</div>`
          : html`
            <svg
              width="${this._w}" height="${this.H}"
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
            ${tip.portfolios.length ? html`
              <div class="tip-portfolios">
                ${tip.portfolios.map(p => html`
                  <span class="tip-portfolio-tag">
                    <span class="tip-portfolio-dot" style="background:${p.color}"></span>${p.name}
                  </span>
                `)}
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

    // Area-based font: pow(area, 0.3) / 10 → naturally scales with tile size
    const area = w * h;
    const fs   = Math.min(Math.pow(area, 0.3) / 10, 40);
    const fsub = Math.max(fs * 0.65, 8);

    const showLabel = w > 55 && h > 26 && fs >= 8;
    const showPct   = w > 80 && h > 48 && fsub >= 8;
    const midY = showPct ? y + h / 2 - fsub * 0.4 : y + h / 2;

    // Portfolio membership dots (top-left, small colored circles)
    const pfPortfolios = this._portfolioMap.get(tile.asset.ticker) ?? [];
    const showDots = pfPortfolios.length > 0 && w > 30 && h > 20;
    const DOT_R = 4;
    const DOT_PAD = 3;

    return svg`
      <g class="tile"
        @mousemove="${(e: MouseEvent) => this._onTileHover(e, tile.asset)}"
        @click="${() => this._onTileClick(tile.asset.ticker)}"
      >
        <rect class="bg" x="${x}" y="${y}" width="${w}" height="${h}"
              fill="${color}" rx="4" ry="4"/>
        ${showDots ? pfPortfolios.slice(0, 5).map((p, i) => svg`
          <circle
            cx="${x + DOT_PAD + DOT_R + i * (DOT_R * 2 + 3)}"
            cy="${y + DOT_PAD + DOT_R}"
            r="${DOT_R}"
            fill="${p.color}"
            style="pointer-events:none;opacity:0.9"
          />
        `) : svg``}
        ${showLabel ? svg`
          <text x="${x + w / 2}" y="${midY}"
                text-anchor="middle" dominant-baseline="central"
                font-size="${fs}" font-weight="700" fill="white"
                font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
                style="pointer-events:none;text-shadow:0 1px 3px rgba(0,0,0,.5)"
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

  // ── Squarified treemap ────────────────────────────────────────────────────

  private _buildTiles(assets: Asset[], total: number): Tile[] {
    const sorted = [...assets].sort((a, b) => (b.total_valuation ?? 0) - (a.total_valuation ?? 0));
    const tiles: Tile[] = [];
    this._layout(sorted, 0, 0, this._w, this.H, total, tiles);
    return tiles;
  }

  private _layout(items: Asset[], x: number, y: number, w: number, h: number, total: number, tiles: Tile[]): void {
    if (!items.length || w < 1 || h < 1 || total <= 0) return;
    if (items.length === 1) { tiles.push({ x, y, w, h, asset: items[0] }); return; }

    let row: Asset[] = [], rowSum = 0;
    for (let i = 0; i < items.length; i++) {
      const nr = [...row, items[i]], ns = rowSum + (items[i].total_valuation ?? 0);
      if (!row.length || this._worst(nr, ns, total, w, h) <= this._worst(row, rowSum, total, w, h)) {
        row = nr; rowSum = ns;
      } else break;
    }

    const rest = items.slice(row.length);
    if (w >= h) {
      const sw = w * rowSum / total; let cy = y;
      for (const item of row) { const ih = h * (item.total_valuation ?? 0) / rowSum; tiles.push({ x, y: cy, w: sw, h: ih, asset: item }); cy += ih; }
      this._layout(rest, x + sw, y, w - sw, h, total - rowSum, tiles);
    } else {
      const sh = h * rowSum / total; let cx = x;
      for (const item of row) { const iw = w * (item.total_valuation ?? 0) / rowSum; tiles.push({ x: cx, y, w: iw, h: sh, asset: item }); cx += iw; }
      this._layout(rest, x, y + sh, w, h - sh, total - rowSum, tiles);
    }
  }

  private _worst(row: Asset[], sum: number, total: number, w: number, h: number): number {
    if (!row.length || sum === 0 || total === 0) return Infinity;
    let worst = 0;
    if (w >= h) {
      const sw = w * sum / total;
      for (const item of row) { const ih = h * (item.total_valuation ?? 0) / sum; if (ih) worst = Math.max(worst, Math.max(sw / ih, ih / sw)); }
    } else {
      const sh = h * sum / total;
      for (const item of row) { const iw = w * (item.total_valuation ?? 0) / sum; if (iw) worst = Math.max(worst, Math.max(sh / iw, iw / sh)); }
    }
    return worst;
  }
}

declare global { interface HTMLElementTagNameMap { 'ac-treemap': AcTreemap; } }
