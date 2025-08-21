import { setGamePlayers } from '../lib/store.js';
import { t, getLang, setLang, Lang } from '../lib/i18n.js';

const tag = 'page-play';

class PlayPage extends HTMLElement {
  connectedCallback(): void {
    const lang = getLang();
    this.innerHTML = `
      <style>
        .bottom-buttons {
          position: fixed;
          bottom: 1.5rem;
          left: 50%;
          transform: translateX(-50%);
          width: auto;
          z-index: 30;
          pointer-events: auto;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 1rem;
        }

        .btn-menu {
          font-family: 'Michroma', ui-sans-serif, monospace;
          background: linear-gradient(180deg, #f3f6fc, #c3cadf);
          border: 2px solid #7988a5;
          color: #1b2946;
          text-decoration: none;
          padding: 12px 32px;
          border-radius: 8px;
          font-weight: 700;
          letter-spacing: 0.13em;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          white-space: nowrap;
          box-shadow:
            inset 0 1px 1px #c9d6f6,
            0 2px 8px #405a90aa;
          transition: background 0.25s, border-color 0.25s, box-shadow 0.25s, color 0.25s;
          user-select: none;
          text-shadow:
            0 2px 12px #90b3ef,
            0 4px 14px #aed9fa;
          font-size: 16px;
          min-width: 150px;
          max-width: 240px;
        }

        .btn-menu:hover,
        .btn-menu:focus {
          background: linear-gradient(180deg, #2a3a5a, #182442);
          border-color: #1a2443;
          color: #b8c6d3;
          box-shadow:
            inset 0 0 6px #2b3c63cc,
            0 3px 16px #405985cc;
          outline: none;
        }

        @media (max-width: 393px) {
          .bottom-buttons {
            position: static !important;
            bottom: auto !important;
            left: auto !important;
            transform: none !important;
            flex-direction: column;
            gap: 1rem;
            align-items: center;
            width: 100%;
            margin-bottom: 2.5rem;
          }
          .btn-menu {
            width: 90vw;
            max-width: 300px;
            min-width: 0;
            font-size: 16px;
            padding: 18px 0 14px 0;
            letter-spacing: 0.14em;
            margin-left: 0;
            margin-right: 0;
          }
          .alias-push {
            margin-bottom: 3.5rem;
          }
        }

        @media (min-width: 394px) {
          .btn-menu {
            font-size: 14px;
            padding: 10px 22px;
          }
          .alias-push {
            margin-bottom: 0;
          }
        }

        .led-title {
          font-family: 'Michroma', monospace;
          font-weight: 400;
          font-size: 3rem;
          letter-spacing: 0.15em;
          color: #fcfcfc;
          user-select: none;
          text-align: center;
          text-shadow:
            0 0 8px #dadada88,
            0 1px 24px #eee8,
            0 2px 6px #fff7;
          filter: brightness(1.1);
          margin: 0;
        }

        @media (min-width: 768px) {
          .led-title {
            font-size: 4rem;
          }
        }
      </style>

      <section class="w-full h-full min-w-[350px] min-h-[700px] flex flex-col">
        <!-- language dropdown -->
        <div class="absolute top-0 left-0 z-30">
          <select id="lang-select" class="mt-2 ml-2 rounded border border-slate-600/70 bg-black/80 px-3 py-1 text-xs tracking-widest text-white focus:outline-none">
            <option value="en"${lang === 'en' ? ' selected' : ''}>English</option>
            <option value="fr"${lang === 'fr' ? ' selected' : ''}>Français</option>
            <option value="es"${lang === 'es' ? ' selected' : ''}>Español</option>
          </select>
        </div>

        <!-- top title-->
        <header class="pt-8 pb-6">
          <h2 class="led-title">${t('game.title')}</h2>
        </header>

        <!-- player alias -->
        <div class="flex-1 flex items-center justify-center alias-push">
          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div class="rounded-lg border border-slate-700 bg-slate-800/20 p-6 flex flex-col items-center gap-4">
              <div class="rounded-full border border-slate-600 p-4">
                <svg class="h-14 w-14 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-width="1" d="M12 12a5 5 0 100-10 5 5 0 000 10"/>
                  <path stroke-width="1" d="M3 22a9 9 0 0118 0"/>
                </svg>
              </div>
              <input id="a" placeholder="${t('game.alias')}" class="w-full max-w-xs rounded-md border border-slate-600 bg-black px-3 py-2 placeholder-slate-500 outline-none focus:border-slate-300"/>
            </div>
            <div class="rounded-lg border border-slate-700 bg-slate-800/20 p-6 flex flex-col items-center gap-4">
              <div class="rounded-full border border-slate-600 p-4">
                <svg class="h-14 w-14 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path stroke-width="1" d="M12 12a5 5 0 100-10 5 5 0 000 10"/>
                  <path stroke-width="1" d="M3 22a9 9 0 0118 0"/>
                </svg>
              </div>
              <input id="b" placeholder="${t('game.alias')}" class="w-full max-w-xs rounded-md border border-slate-600 bg-black px-3 py-2 placeholder-slate-500 outline-none focus:border-slate-300"/>
            </div>
          </div>
        </div>
        <!-- bottom buttons -->
        <div class="bottom-buttons">
          <a href="/" class="btn-menu">
            <span>${t('btn.back.top')} ${t('btn.back.bottom')}</span>
          </a>
          <a id="start" href="/game" class="btn-menu">
            <span>${t('btn.start.top')} ${t('btn.start.bottom')}</span>
          </a>
        </div>
      </section>
    `;
    // language dropdown 
    this.querySelector<HTMLSelectElement>('#lang-select')?.addEventListener('change', async (e) => {
      const selectedLang = (e.target as HTMLSelectElement).value as Lang;
      await setLang(selectedLang);
      this.connectedCallback();
    });
    // alias storage
    this.querySelector('#start')?.addEventListener('click', () => {
      const a = (this.querySelector('#a') as HTMLInputElement)?.value || '';
      const b = (this.querySelector('#b') as HTMLInputElement)?.value || '';
      setGamePlayers(a, b);
    });
  }
}
customElements.define(tag, PlayPage);

export const meta = { title: 'Play' };
export function create() { return document.createElement(tag); }
