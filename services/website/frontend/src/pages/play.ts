import { setGamePlayers } from '../lib/store.js';
import { t } from '../lib/i18n.js';

const tag = 'page-play';

class PlayPage extends HTMLElement {
  connectedCallback(): void {
    this.innerHTML = `
      <section>
        <div class="mb-8 flex items-center gap-4">
          <a href="/" class="btn-menu btn-menu-sm">
            <span class="btn-menu-inner">
              <span class="block">${t('btn.back.top')}</span>
              <span class="block">${t('btn.back.bottom')}</span>
            </span>
          </a>
          <h2 class="font-pong text-3xl tracking-wide">${t('game.title')}</h2>
        </div>

        <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div class="rounded-lg border border-slate-700 bg-slate-800/20 p-6 flex flex-col items-center gap-4">
            <div class="rounded-full border border-slate-600 p-4">
              <svg class="h-14 w-14 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-width="1" d="M12 12a5 5 0 100-10 5 5 0 000 10z"/><path stroke-width="1" d="M3 22a9 9 0 0118 0"/>
              </svg>
            </div>
            <input id="a" placeholder="${t('game.alias')}" class="w-full max-w-xs rounded-md border border-slate-600 bg-black px-3 py-2 placeholder-slate-500 focus:border-slate-300 outline-none"/>
          </div>

          <div class="rounded-lg border border-slate-700 bg-slate-800/20 p-6 flex flex-col items-center gap-4">
            <div class="rounded-full border border-slate-600 p-4">
              <svg class="h-14 w-14 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path stroke-width="1" d="M12 12a5 5 0 100-10 5 5 0 000 10z"/><path stroke-width="1" d="M3 22a9 9 0 0118 0"/>
              </svg>
            </div>
            <input id="b" placeholder="${t('game.alias')}" class="w-full max-w-xs rounded-md border border-slate-600 bg-black px-3 py-2 placeholder-slate-500 focus:border-slate-300 outline-none"/>
          </div>
        </div>

        <div class="mt-10 flex justify-end">
          <a id="start" href="/game" class="btn-menu btn-menu-sm">
            <span class="btn-menu-inner">
              <span class="block">${t('btn.start.top')}</span>
              <span class="block">${t('btn.start.bottom')}</span>
            </span>
          </a>
        </div>
      </section>
    `;

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