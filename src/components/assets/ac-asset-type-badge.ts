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
    }
    .CEDEAR { background: color-mix(in srgb, #818cf8 20%, transparent); color: #818cf8; }
    .BONO   { background: color-mix(in srgb, #34d399 20%, transparent); color: #34d399; }
    .FCI    { background: color-mix(in srgb, #fb923c 20%, transparent); color: #fb923c; }
    .USD    { background: color-mix(in srgb, #facc15 20%, transparent); color: #facc15; }
    .ACCION { background: color-mix(in srgb, #f472b6 20%, transparent); color: #f472b6; }
    .CRYPTO { background: color-mix(in srgb, #60a5fa 20%, transparent); color: #60a5fa; }
    .OTRO   { background: color-mix(in srgb, #94a3b8 20%, transparent); color: #94a3b8; }
  `;

  @property() type: AssetType = 'OTRO';

  render() {
    return html`<span class="${this.type}">${this.type}</span>`;
  }
}
