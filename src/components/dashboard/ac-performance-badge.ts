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
    .value {
      font-size: var(--text-3xl);
      font-weight: 700;
      font-family: var(--font-mono);
      color: var(--color-text-muted);
    }
    .sub { font-size: var(--text-sm); color: var(--color-text-muted); margin-top: var(--space-1); }
  `;

  @property({ type: Array }) assets: Asset[] = [];

  render() {
    return html`
      <div class="label">Activos totales</div>
      <div class="value">${this.assets.length}</div>
      <div class="sub">en ${new Set(this.assets.map((a) => a.platform)).size} plataformas</div>
    `;
  }
}
