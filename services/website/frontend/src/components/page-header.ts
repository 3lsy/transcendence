import { t } from '../lib/i18n.js';

const tag = 'page-header';

class PageHeader extends HTMLElement {
  connectedCallback() {
    const title = this.getAttribute('title') || t('game.title');
    const backHref = this.getAttribute('back') || '/';

    this.innerHTML = `
  <div class="mb-10 flex items-center justify-between">
    <a href="${backHref}" class="btn-back flex items-center gap-2 rounded-lg border-2 border-slate-300 text-slate-200 uppercase px-4 tracking-[0.20em] h-[42px] transition hover:bg-white/10 hover:border-white font-normal text-lg md:text-xl">
      <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M15 18l-6-6 6-6" />
      </svg>
      <span>${t('btn.back.top')} ${t('btn.back.bottom')}</span>
    </a>
    <h2 class="font-pong text-x1 sm:text-2xl md:text-4xl tracking-wide text-white">${title}</h2>
  </div>
`;


  }
}

customElements.define(tag, PageHeader);