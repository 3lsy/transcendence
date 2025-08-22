import { Lang, getLang, setLang, t } from '../lib/i18n.js';

const tag = 'page-home';

class HomePage extends HTMLElement {
  connectedCallback(): void { this.render(); }

  private render() {
    const lang = getLang();
    this.innerHTML = `
      <section class="relative pt-20 md:pt-24">
        <!-- language dropdown -->
        <div style="position: absolute; top: 16px; left: 16px; z-index: 10;">
          <select id="lang-select" class="btn-select" aria-label="Select Language">
            <option value="en"${lang === "en" ? " selected" : ""}>English</option>
            <option value="fr"${lang === "fr" ? " selected" : ""}>Français</option>
            <option value="es"${lang === "es" ? " selected" : ""}>Español</option>
          </select>
        </div>

        <!-- top title -->
        <header class="pt-8 pb-8">
          <h1 class="font-pong text-center text-[64px] md:text-[96px] leading-none tracking-[0.12em] text-slate-200">
            ${t('home.title')}
          </h1>
        </header>

        <!-- buttons -->
        <nav class="mt-6 flex flex-col items-center gap-6">
          <a href="/play" class="btn-menu">
            <span class="btn-menu-inner">
              ${t('btn.play.top')} ${t('btn.play.bottom')}
            </span>
          </a>

          <a href="/tournament" class="btn-menu">
            <span class="btn-menu-inner">
              ${t('btn.tournament.top')}${t('btn.tournament.bottom')}
            </span>
          </a>

          <a href="/scores" class="btn-menu">
            <span class="btn-menu-inner">
              ${t('btn.scores.top')}${t('btn.scores.bottom')}
            </span>
          </a>
        </nav>
      </section>
    `;

    this.setupLanguageListener();
  }

  private setupLanguageListener() {
    const select = this.querySelector<HTMLSelectElement>('#lang-select');
    if (!select) return;
    select.addEventListener('change', async (event) => {
      const target = event.target as HTMLSelectElement;
      await setLang(target.value as Lang);
      this.render();
    });
  }
}
customElements.define(tag, HomePage);

export const meta = { title: 'Home' };
export function create() { return document.createElement(tag); }