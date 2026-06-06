import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Asset } from '@/types/asset';

@customElement('ac-performance-badge')
export class AcPerformanceBadge extends LitElement {
  static styles = css`
    :host {
      display: block;
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: var(--space-6);
    }
    .label { font-size: var(--text-sm); color: var(--color-text-muted); margin-bottom: var(--space-2); }
    .change {
      font-size: var(--text-3xl);
      font-weight: 700;
      font-family: var(--font-mono);
    }
    .positive { color: var(--color-success); }
    .negative { color: var(--color-danger); }
    .neutral  { color: var(--color-text-muted); }
    .sub { font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
  `;

  @property({ type: Array }) assets: Asset[] = [];

  private get _avgChange(): number {
    if (!this.assets.length) return 0;
    return this.assets.reduce((s, a) => s + a.dailyChangePercent, 0) / this.assets.length;
  }

  render() {
    const change = this._avgChange;
    const cls = change > 0 ? 'positive' : change < 0 ? 'negative' : 'neutral';
    const sign = change > 0 ? '+' : '';
    return html`
      <div class="label">Variación diaria (promedio)</div>
      <div class="change ${cls}">${sign}${change.toFixed(2)}%</div>
      <div class="sub">Basado en ${this.assets.length} activos</div>
    `;
  }
}
