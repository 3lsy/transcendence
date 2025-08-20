import { t } from '../lib/i18n.js';

const tag = 'page-header';

class PageHeader extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || t('game.title');
    const backHref = this.getAttribute('back') || '/';

    this.innerHTML = `
      <div class="mb-10 flex items-center justify-between">
        <a href="${backHref}" class="btn-menu btn-menu-sm border border-slate-500 hover:border-white transition">
          <span class="btn-menu-inner">
            <span class="block">${t('btn.back.top')}</span>
            <span class="block">${t('btn.back.bottom')}</span>
          </span>
        </a>
        <h2 class="font-pong text-4xl tracking-wide text-white">${title}</h2>
      </div>
    `;
  }
}

customElements.define(tag, PageHeader);
