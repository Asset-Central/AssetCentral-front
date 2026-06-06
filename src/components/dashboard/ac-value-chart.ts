import { LitElement, html, css } from 'lit';
import { customElement, state, query } from 'lit/decorators.js';
import {
  Chart, type ChartConfiguration,
  LineElement, PointElement, LinearScale, CategoryScale,
  LineController, Filler, Tooltip,
} from 'chart.js';
import { fetchValueHistory } from '@/services/asset.service';
import type { ValuePoint } from '@/types/asset';
import '@/components/common/ac-spinner';

Chart.register(LineElement, PointElement, LinearScale, CategoryScale, LineController, Filler, Tooltip);

type Range = '1h' | '1d' | '1w' | '30d' | '1y';

const RANGE_LABELS: Record<Range, string> = { '1h': '1H', '1d': '1D', '1w': '1S', '30d': '1M', '1y': '1A' };
const RANGE_TITLES: Record<Range, string> = {
  '1h': 'Última hora',
  '1d': 'Último día',
  '1w': 'Última semana',
  '30d': 'Últimos 30 días',
  '1y': 'Último año',
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

function _formatTooltipDate(dateStr: string, range: Range): string {
  if (range === '1h' || range === '1d') {
    const [datePart = '', timePart = ''] = dateStr.split('T');
    const [y = '', m = '', d = ''] = datePart.split('-');
    return `${d}/${m}/${y} ${timePart}`;
  }
  const [y = '', m = '', d = ''] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

@customElement('ac-value-chart')
export class AcValueChart extends LitElement {
  static styles = css`
    :host {
      display: block;
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
    .header-left { display: flex; align-items: baseline; gap: var(--space-3); flex-wrap: wrap; }
    .label { font-size: var(--text-sm); color: var(--color-text-muted); }
    .delta {
      font-size: var(--text-sm);
      font-family: var(--font-mono);
      font-weight: 600;
    }
    .delta.up   { color: #34d399; }
    .delta.down { color: #f87171; }
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
    .range-btn.active {
      background: var(--color-primary);
      border-color: var(--color-primary);
      color: #fff;
    }
    canvas { display: block; max-height: 160px; }
    .loading {
      display: flex; align-items: center; justify-content: center;
      height: 160px;
    }
    .empty {
      display: flex; align-items: center; justify-content: center;
      height: 160px;
      color: var(--color-text-muted);
      font-size: var(--text-sm);
    }
  `;

  @query('canvas') private _canvas!: HTMLCanvasElement;
  @state() private _data: ValuePoint[] = [];
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
    // Destroy chart before showing spinner so _renderChart() creates fresh on new canvas
    this._chart?.destroy();
    this._chart = undefined;
    this._loading = true;
    try {
      this._data = await fetchValueHistory(this._range);
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

    const totals = this._data.map(p => p.total);
    const rawDates = this._data.map(p => p.date);

    const first = totals[0] ?? 0;
    const last  = totals[totals.length - 1] ?? 0;
    const up    = last >= first;
    const lineColor = up ? '#34d399' : '#f87171';
    const fillColor = up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';

    if (this._chart) {
      this._chart.data.labels = rawDates;
      const ds = this._chart.data.datasets[0] as any;
      ds.data = totals;
      ds.borderColor = lineColor;
      ds.backgroundColor = fillColor;
      this._chart.update();
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: rawDates,
        datasets: [{
          data: totals,
          borderColor: lineColor,
          backgroundColor: fillColor,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.35,
          fill: true,
        }],
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
                const label = ctx[0]?.label ?? '';
                return _formatTooltipDate(label, self._range);
              },
              label: (ctx) => {
                const v = ctx.parsed.y as number;
                return ` ARS ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v)}`;
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
          y: {
            ticks: {
              color: '#6b7280',
              font: { size: 10 },
              callback: (v) => {
                const n = Number(v);
                return n >= 1_000_000
                  ? `$${(n / 1_000_000).toFixed(1)}M`
                  : `$${(n / 1_000).toFixed(0)}K`;
              },
            },
            grid: { color: 'rgba(255,255,255,0.05)' },
          },
        },
      },
    };
    this._chart = new Chart(this._canvas, config);
  }

  render() {
    const totals = this._data.map(p => p.total);
    const first  = totals[0] ?? 0;
    const last   = totals[totals.length - 1] ?? 0;
    const delta  = first ? ((last - first) / first) * 100 : 0;
    const up     = delta >= 0;
    const ranges: Range[] = ['1h', '1d', '1w', '30d', '1y'];

    return html`
      <div class="header">
        <div class="header-left">
          <span class="label">Valor del portafolio · ${RANGE_TITLES[this._range]}</span>
          ${!this._loading && this._data.length >= 2 ? html`
            <span class="delta ${up ? 'up' : 'down'}">
              ${up ? '▲' : '▼'} ${Math.abs(delta).toFixed(2)}%
            </span>
          ` : ''}
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

      ${this._loading
        ? html`<div class="loading"><ac-spinner></ac-spinner></div>`
        : this._data.length >= 2
          ? html`<canvas></canvas>`
          : html`<div class="empty">Sin datos para este período</div>`}
    `;
  }
}
