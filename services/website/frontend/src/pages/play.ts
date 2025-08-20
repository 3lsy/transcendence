import { t } from '../lib/i18n.js';
import '../components/alias-input.js';
import '../components/page-header.js';
import { navigate } from '../router/router.js';

const tag = 'page-play';

class PlayPage extends HTMLElement {
  async createGame(nickLeft: string, nickRight: string): Promise<{ matchId: string }> {
    const response = await fetch('/api/game/new', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nick_left: nickLeft, nick_right: nickRight })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data?.error || 'Failed to create game');
    }

    return response.json();
  }

  connectedCallback(): void {
    this.innerHTML = `
    <section class="min-h-screen flex flex-col px-4 py-10">
      <page-header></page-header>

      <div class="flex-1 flex flex-col items-center justify-center">
        <div id="error-message" class="text-red-500 text-sm mb-4 hidden"></div>
        <form id="game-form" class="grid gap-8 md:grid-cols-2 w-full max-w-4xl">
          ${this.playerCard('playerA-alias')}
          ${this.playerCard('playerB-alias')}
          <div class="md:col-span-2 mt-10 flex justify-end">
            <button type="submit" class="btn-menu btn-menu-md border border-slate-500 hover:border-white transition">
              <span class="btn-menu-inner">
                <span class="block">${t('btn.start.top')}</span>
                <span class="block">${t('btn.start.bottom')}</span>
              </span>
            </button>
          </div>
        </form>
      </div>
    </section>
  `;

    const form = this.querySelector<HTMLFormElement>('#game-form')!;
    const errorDiv = this.querySelector<HTMLDivElement>('#error-message')!;

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      errorDiv.classList.add('hidden');
      errorDiv.textContent = '';

      const aliasInputs = form.querySelectorAll('alias-input');
      const aInput = aliasInputs[0] as any;
      const bInput = aliasInputs[1] as any;
      const a = aInput?.input?.value?.trim();
      const b = bInput?.input?.value?.trim();

      if (!aInput?.input?.checkValidity()) {
        aInput.input.reportValidity();
        return;
      }
      if (!bInput?.input?.checkValidity()) {
        bInput.input.reportValidity();
        return;
      }

      try {
        const { matchId } = await this.createGame(a, b);
        navigate(`game?matchId=${matchId}`);
      } catch (error: any) {
        errorDiv.textContent = error.message || 'An error occurred';
        errorDiv.classList.remove('hidden');
      }
    });
  }

  playerCard(aliasId: string) {
    return `
      <div class="rounded-lg border border-slate-700 bg-slate-800/30 p-6 flex flex-col items-center gap-5 shadow-lg backdrop-blur-md">
        <div class="rounded-full border border-slate-600 p-5 bg-slate-900/30">
          <svg class="h-16 w-16 text-slate-300 opacity-80" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path stroke-width="1" d="M12 12a5 5 0 100-10 5 5 0 000 10z"/>
            <path stroke-width="1" d="M3 22a9 9 0 0118 0"/>
          </svg>
        </div>
        <alias-input id="${aliasId}"></alias-input>
      </div>
    `;
  }
}

customElements.define(tag, PlayPage);

export const meta = { title: 'Play' };
export function create() { return document.createElement(tag); }