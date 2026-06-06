import { LitElement, html, css } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import { Chart, type ChartConfiguration, ArcElement, DoughnutController, Tooltip, Legend } from 'chart.js';
import { groupByType } from '@/services/asset.service';
import type { Asset, AssetType } from '@/types/asset';

Chart.register(ArcElement, DoughnutController, Tooltip, Legend);

const TYPE_COLORS: Record<AssetType, string> = {
  CEDEAR:  '#818cf8',
  BONO:    '#34d399',
  FCI:     '#fb923c',
  USD:     '#facc15',
  ACCION:  '#f472b6',
  CRYPTO:  '#60a5fa',
  OTRO:    '#94a3b8',
};

@customElement('ac-distribution-chart')
export class AcDistributionChart extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
    }
    .label { font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-4); }
    canvas { max-height: 180px; }
  `;

  @property({ type: Array }) assets: Asset[] = [];
  @query('canvas') private _canvas!: HTMLCanvasElement;
  private _chart?: Chart;

  updated() {
    this._renderChart();
  }

  private _renderChart() {
    const groups = groupByType(this.assets);
    const data = {
      labels: groups.map((g) => g.type),
      datasets: [{
        data: groups.map((g) => g.totalArs),
        backgroundColor: groups.map((g) => TYPE_COLORS[g.type]),
        borderWidth: 0,
        hoverOffset: 4,
      }],
    };

    if (this._chart) {
      this._chart.data = data;
      this._chart.update();
      return;
    }

    const config: ChartConfiguration = {
      type: 'doughnut',
      data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'right',
            labels: { color: '#94a3b8', font: { size: 12 }, boxWidth: 12 },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct = groups[ctx.dataIndex]?.percentage.toFixed(1);
                return ` ${ctx.label}: ${pct}%`;
              },
            },
          },
        },
      },
    };
    this._chart = new Chart(this._canvas, config);
  }

  render() {
    return html`
      <div class="label">Distribución por tipo</div>
      <canvas></canvas>
    `;
  }
}
