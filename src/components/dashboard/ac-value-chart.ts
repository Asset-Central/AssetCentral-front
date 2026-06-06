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
      align-items: baseline;
      justify-content: space-between;
      margin-bottom: var(--space-4);
    }
    .label { font-size: var(--text-sm); color: var(--color-text-muted); }
    .delta {
      font-size: var(--text-sm);
      font-family: var(--font-mono);
      font-weight: 600;
    }
    .delta.up   { color: #34d399; }
    .delta.down { color: #f87171; }
    canvas { display: block; max-height: 160px; }
    .loading {
      display: flex; align-items: center; justify-content: center;
      height: 160px;
    }
  `;

  @query('canvas') private _canvas!: HTMLCanvasElement;
  @state() private _data: ValuePoint[] = [];
  @state() private _loading = true;
  private _chart?: Chart;

  async connectedCallback() {
    super.connectedCallback();
    try {
      this._data = await fetchValueHistory();
    } catch {
      /* silencioso */
    } finally {
      this._loading = false;
    }
  }

  updated() {
    if (!this._loading && this._data.length >= 2) {
      this._renderChart();
    }
  }

  private _renderChart() {
    if (!this._canvas) return;
    const totals = this._data.map(p => p.total);
    const labels = this._data.map(p => {
      const [, m, d] = p.date.split('-');
      return `${d}/${m}`;
    });

    const first = totals[0] ?? 0;
    const last  = totals[totals.length - 1] ?? 0;
    const up    = last >= first;
    const lineColor  = up ? '#34d399' : '#f87171';
    const fillColor  = up ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)';

    const data = {
      labels,
      datasets: [{
        data: totals,
        borderColor: lineColor,
        backgroundColor: fillColor,
        borderWidth: 2,
        pointRadius: 0,
        tension: 0.35,
        fill: true,
      }],
    };

    if (this._chart) {
      this._chart.data = data;
      this._chart.update();
      return;
    }

    const config: ChartConfiguration = {
      type: 'line',
      data,
      options: {
        responsive: true,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const v = ctx.parsed.y as number;
                return ` ARS ${new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(v)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: { color: '#6b7280', font: { size: 10 }, maxTicksLimit: 8 },
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
    const totals  = this._data.map(p => p.total);
    const first   = totals[0] ?? 0;
    const last    = totals[totals.length - 1] ?? 0;
    const delta   = first ? ((last - first) / first) * 100 : 0;
    const up      = delta >= 0;

    return html`
      <div class="header">
        <span class="label">Valor del portafolio (30 días)</span>
        ${!this._loading && this._data.length >= 2 ? html`
          <span class="delta ${up ? 'up' : 'down'}">
            ${up ? '▲' : '▼'} ${Math.abs(delta).toFixed(2)}%
          </span>
        ` : ''}
      </div>

      ${this._loading
        ? html`<div class="loading"><ac-spinner></ac-spinner></div>`
        : html`<canvas></canvas>`}
    `;
  }
}
