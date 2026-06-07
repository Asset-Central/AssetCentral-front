import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import {
  Chart, type ChartConfiguration,
  LineElement, PointElement, BarElement,
  LinearScale, CategoryScale,
  LineController, BarController,
  Tooltip, Legend,
} from 'chart.js';
import { fetchPerformance } from '@/services/asset.service';
import type { PerformancePoint } from '@/types/asset';
import '@/components/common/ac-spinner';

Chart.register(
  LineElement, PointElement, BarElement,
  LinearScale, CategoryScale,
  LineController, BarController,
  Tooltip, Legend,
);

type Range = '1h' | '1d' | '1w' | '30d' | '1y';

const RANGE_LABELS: Record<Range, string> = { '1h': '1H', '1d': '1D', '1w': '1S', '30d': '1M', '1y': '1A' };
const RANGE_TITLES: Record<Range, string> = {
  '1h': 'Última hora', '1d': 'Último día', '1w': 'Última semana',
  '30d': 'Últimos 30 días', '1y': 'Último año',
};

function _formatLabel(dateStr: string, range: Range): string {
  if (range === '1h' || range === '1d') {
    const t = dateStr.includes('T') ? dateStr.split('T')[1] ?? '' : '';
    return t.substring(0, 5);
  }
  const parts = dateStr.split('-');
  if (parts.length >= 3) return `${parts[2]}/${parts[1]}`;
  return dateStr;
}

function _fmt(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

@customElement('ac-performance-chart')
export class AcPerformanceChart extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
      margin-top: var(--space-4);
    }
    .header {
      display: flex; align-items: flex-start;
      justify-content: space-between;
      margin-bottom: var(--space-4);
      flex-wrap: wrap; gap: var(--space-2);
    }
    .header-left { display: flex; flex-direction: column; gap: var(--space-1); }
    .title { font-size: var(--text-sm); color: var(--color-text-muted); font-weight: 600; }
    .subtitle { font-size: var(--text-xs); color: var(--color-text-muted); }
    .range-btns { display: flex; gap: var(--space-1); }
    .range-btn {
      padding: 2px 8px;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--color-text-muted);
      font-size: var(--text-xs);
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .range-btn:hover { border-color: var(--color-primary); color: var(--color-primary); }
    .range-btn.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
    .legend {
      display: flex; flex-wrap: wrap; gap: var(--space-4);
      margin-bottom: var(--space-3);
    }
    .legend-item { display: flex; align-items: center; gap: 6px; font-size: var(--text-xs); color: var(--color-text-muted); }
    .legend-swatch { width: 12px; height: 4px; border-radius: 2px; flex-shrink: 0; }
    .legend-swatch.bar { height: 10px; border-radius: 2px; }
    canvas { display: block; max-height: 280px; }
    .loading { display: flex; align-items: center; justify-content: center; height: 280px; }
    .empty { display: flex; align-items: center; justify-content: center; height: 280px; color: var(--color-text-muted); font-size: var(--text-sm); }
  `;

  @query('canvas') private _canvas!: HTMLCanvasElement;
  @state() private _data: PerformancePoint[] = [];
  @state() private _loading = true;
  @state() private _range: Range = '30d';
  private _chart?: Chart;

  connectedCallback() {
    super.connectedCallback();
    this._load();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._chart?.destroy();
    this._chart = undefined;
  }

  private async _load() {
    this._chart?.destroy();
    this._chart = undefined;
    this._loading = true;
    try {
      this._data = await fetchPerformance(this._range);
    } catch { /* silencioso */ }
    finally { this._loading = false; }
  }

  private _setRange(r: Range) {
    if (this._range === r) return;
    this._range = r;
    this._load();
  }

  updated() {
    if (!this._loading && this._data.length >= 2) {
      this._renderChart();
    } else if (!this._loading && this._chart) {
      this._chart.destroy();
      this._chart = undefined;
    }
  }

  private _renderChart() {
    if (!this._canvas) return;

    const dates = this._data.map(p => p.date);
    const totals = this._data.map(p => p.total);
    const marketPnls = this._data.map(p => p.market_pnl);
    const capitalFlows = this._data.map(p => p.capital_flow);

    const marketColors = marketPnls.map(v => v >= 0 ? 'rgba(52,211,153,0.75)' : 'rgba(248,113,113,0.75)');
    const capitalColors = capitalFlows.map(v => v >= 0 ? 'rgba(96,165,250,0.75)' : 'rgba(251,191,36,0.75)');

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;

    if (this._chart) {
      const ds = this._chart.data.datasets;
      this._chart.data.labels = dates;
      (ds[0] as any).data = totals;
      (ds[1] as any).data = marketPnls;
      (ds[1] as any).backgroundColor = marketColors;
      (ds[2] as any).data = capitalFlows;
      (ds[2] as any).backgroundColor = capitalColors;
      this._chart.update();
      return;
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: dates,
        datasets: [
          {
            type: 'line',
            label: 'Valor total',
            data: totals,
            borderColor: '#818cf8',
            backgroundColor: 'rgba(129,140,248,0.08)',
            borderWidth: 2,
            pointRadius: 0,
            pointHoverRadius: 4,
            tension: 0.35,
            fill: false,
            yAxisID: 'yTotal',
            order: 0,
          } as any,
          {
            type: 'bar',
            label: 'P&L mercado',
            data: marketPnls,
            backgroundColor: marketColors,
            borderRadius: 2,
            yAxisID: 'yDelta',
            order: 1,
          } as any,
          {
            type: 'bar',
            label: 'Flujo de capital',
            data: capitalFlows,
            backgroundColor: capitalColors,
            borderRadius: 2,
            yAxisID: 'yDelta',
            order: 2,
          } as any,
        ],
      },
      options: {
        responsive: true,
        animation: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: (ctx) => {
                const raw = ctx[0]?.label ?? '';
                return _formatLabel(raw, self._range);
              },
              label: (ctx) => {
                const v = ctx.parsed.y as number;
                const sign = v >= 0 ? '+' : '';
                if (ctx.datasetIndex === 0) {
                  return ` Valor: ARS ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v)}`;
                }
                return ` ${ctx.dataset.label}: ${sign}${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: '#6b7280',
              font: { size: 10 },
              maxTicksLimit: 8,
              callback: (_, idx) => {
                const label = (self._chart?.data.labels?.[idx] as string) ?? '';
                return _formatLabel(label, self._range);
              },
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
          yTotal: {
            type: 'linear',
            position: 'left',
            ticks: {
              color: '#818cf8',
              font: { size: 10 },
              callback: (v) => _fmt(Number(v)),
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
          yDelta: {
            type: 'linear',
            position: 'right',
            ticks: {
              color: '#6b7280',
              font: { size: 10 },
              callback: (v) => _fmt(Number(v)),
            },
            grid: { drawOnChartArea: false },
          },
        },
      },
    };

    this._chart = new Chart(this._canvas, config);
  }

  render() {
    const ranges: Range[] = ['1h', '1d', '1w', '30d', '1y'];

    return html`
      <div class="header">
        <div class="header-left">
          <span class="title">Rendimiento · ${RANGE_TITLES[this._range]}</span>
          <span class="subtitle">Valor total, ganancia de mercado y flujos de capital</span>
        </div>
        <div class="range-btns">
          ${ranges.map(r => html`
            <button
              class="range-btn ${this._range === r ? 'active' : ''}"
              @click="${() => this._setRange(r)}"
            >${RANGE_LABELS[r]}</button>
          `)}
        </div>
      </div>

      <div class="legend">
        <div class="legend-item">
          <div class="legend-swatch" style="background:#818cf8"></div>Valor total
        </div>
        <div class="legend-item">
          <div class="legend-swatch bar" style="background:rgba(52,211,153,0.75)"></div>P&L mercado (+)
        </div>
        <div class="legend-item">
          <div class="legend-swatch bar" style="background:rgba(248,113,113,0.75)"></div>P&L mercado (−)
        </div>
        <div class="legend-item">
          <div class="legend-swatch bar" style="background:rgba(96,165,250,0.75)"></div>Capital ingresado
        </div>
        <div class="legend-item">
          <div class="legend-swatch bar" style="background:rgba(251,191,36,0.75)"></div>Capital retirado
        </div>
      </div>

      ${this._loading
        ? html`<div class="loading"><ac-spinner></ac-spinner></div>`
        : this._data.length >= 2
          ? html`<canvas></canvas>`
          : html`<div class="empty">Sin datos para este período</div>`}
    `;
  }
}

declare global { interface HTMLElementTagNameMap { 'ac-performance-chart': AcPerformanceChart; } }
