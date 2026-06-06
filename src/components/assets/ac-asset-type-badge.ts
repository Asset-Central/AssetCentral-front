import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { AssetType } from '@/types/asset';

@customElement('ac-asset-type-badge')
export class AcAssetTypeBadge extends LitElement {
  static styles = css`
    :host { display: inline-block; }
    span {
      display: inline-block;
      padding: 2px var(--space-2);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .cedear { background: color-mix(in srgb, #818cf8 20%, transparent); color: #818cf8; }
    .bono   { background: color-mix(in srgb, #34d399 20%, transparent); color: #34d399; }
    .fci    { background: color-mix(in srgb, #fb923c 20%, transparent); color: #fb923c; }
    .cash   { background: color-mix(in srgb, #facc15 20%, transparent); color: #facc15; }
    .stock  { background: color-mix(in srgb, #f472b6 20%, transparent); color: #f472b6; }
    .crypto { background: color-mix(in srgb, #60a5fa 20%, transparent); color: #60a5fa; }
  `;

  @property() type: AssetType = 'stock';

  render() {
    return html`<span class="${this.type}">${this.type}</span>`;
  }
}
