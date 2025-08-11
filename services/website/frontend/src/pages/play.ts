import { setGamePlayers } from '../lib/store.js';
import { t } from '../lib/i18n.js';
import { navigate } from '../router/router.js';

const tag = 'page-play';

class PlayPage extends HTMLElement {
  async joinGame(alias: string): Promise<{ matchId: string, side: string }> {
    const response = await fetch('/api/game/join', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        matchId: 'default', // You might want to generate this or get from somewhere
        alias
      })
    });

    if (!response.ok) {
      throw new Error('Failed to join game');
    }

    return response.json();
  }
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
          <button id="start" href="/game" class="btn-menu btn-menu-sm">
            <span class="btn-menu-inner">
              <span class="block">${t('btn.start.top')}</span>
              <span class="block">${t('btn.start.bottom')}</span>
            </span>
          </button>
        </div>
      </section>
    `;

    this.querySelector<HTMLAnchorElement>('#start')!.addEventListener('click', async () => {
      const matchId = 'default';
      const a = this.querySelector<HTMLInputElement>('#a')?.value || 'Player A';
      const b = this.querySelector<HTMLInputElement>('#b')?.value || 'Player B';
      const { side: aSide } = await this.joinGame(a);
      await this.joinGame(b);
      setGamePlayers(aSide == 'left' ? a : b, aSide == 'right' ? a : b);
      navigate(`game?matchId=${matchId}`);
    });
  }
}
customElements.define(tag, PlayPage);

export const meta = { title: 'Play' };
export function create() { return document.createElement(tag); }