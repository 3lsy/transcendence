import { getLang, setLang, t } from '../lib/i18n.js';

const tag = 'page-home';

class HomePage extends HTMLElement {
  connectedCallback(): void { this.render(); }

  private render() {
    const lang = getLang();
    this.innerHTML = `
      <section class="relative">
        <!-- Language toggle (top-left) -->
        <div class="absolute left-0 top-0">
          <button id="lang" class="mt-2 rounded-full border border-slate-600/70 bg-black/40 px-3 py-1 text-xs tracking-widest hover:bg-slate-900/60">
            🌐 ${lang.toUpperCase()}
          </button>
        </div>

        <header class="pt-8 pb-8">
          <h1 class="font-pong text-center text-[64px] md:text-[96px] leading-none tracking-[0.12em] text-slate-200">
            ${t('home.title')}
          </h1>
        </header>

        <nav class="mt-6 flex flex-col items-center gap-6">
          <a href="/play" class="btn-menu">
            <span class="btn-menu-inner">
              <span class="block">${t('btn.play.top')}</span>
              <span class="block">${t('btn.play.bottom')}</span>
            </span>
          </a>

          <a href="/tournament" class="btn-menu">
            <span class="btn-menu-inner">
              <span class="block">${t('btn.tournament.top')}</span>
              <span class="block">${t('btn.tournament.bottom')}</span>
            </span>
          </a>

          <a href="/scores" class="btn-menu">
            <span class="btn-menu-inner">
              <span class="block">${t('btn.scores.top')}</span>
              <span class="block">${t('btn.scores.bottom')}</span>
            </span>
          </a>
        </nav>
      </section>
    `;

    this.querySelector<HTMLButtonElement>('#lang')?.addEventListener('click', async () => {
      const next = lang.startsWith('en') ? 'fr' : 'en';
      await setLang(next as any);
      this.render();
    });
  }
}
customElements.define(tag, HomePage);

export const meta = { title: 'Home' };
export function create() { return document.createElement(tag); }