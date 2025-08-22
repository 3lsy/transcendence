import { t } from '../lib/i18n.js';
import '../components/alias-input.js';
import '../components/page-header.js';
import { navigate } from '../router/router.js';

const tag = 'page-play';

class PlayPage extends HTMLElement {
  private _matches: Array<{ matchId: string; player_left: string; player_right: string }> = [];
  private loading = false;
  private error: string | null = null;

  connectedCallback(): void {
    this.render();
    this.fetchMatches();
    this.setupFormHandler();
  }

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

  private async fetchMatches() {
    this.loading = true;
    this.render();
    try {
      const response = await fetch('/api/game/list');
      if (!response.ok) throw new Error('Failed to load matches');
      this._matches = await response.json();
      this.error = null;
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Unknown error';
    } finally {
      this.loading = false;
      this.render();
    }
  }

  private setupFormHandler() {
    const form = this.querySelector<HTMLFormElement>('#game-form');
    if (!form) return;

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

  private render(): void {
    this.innerHTML = `
    <section class="min-h-screen flex flex-col px-4 py-10 space-y-16">
      <page-header></page-header>

      <div class="flex flex-col items-center justify-center">
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

      <div class="w-full max-w-3xl mx-auto">
        <h2 class="text-xl text-white font-semibold mb-4">${t('play.active_matches') || 'Active Matches'}</h2>
        <ol class="space-y-4">
          ${this.renderMatches()}
        </ol>
      </div>
    </section>
  `;
    this.setupFormHandler(); // Re-bind event listener on re-render
  }

  private renderMatches(): string {
    if (this.loading) {
      return `<li class="text-slate-400">${t('loading') || 'Loading matches...'}</li>`;
    }

    if (this.error) {
      return `<li class="text-red-400">${this.error}</li>`;
    }

    if (!this._matches.length) {
      return `<li class="text-slate-500">${t('play.no_active_matches') || 'No active matches'}</li>`;
    }

    return this._matches
      .map(
        (match) => `
      <li class="rounded-lg border border-slate-600 bg-slate-800/30 backdrop-blur-md shadow-md p-5 text-white flex items-center justify-between">
        <div class="text-lg font-medium">
          ${match.player_left}
          <span class="mx-2 opacity-50">vs</span>
          ${match.player_right}
        </div>
        <button class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition" onclick="window.location.href='/game?matchId=${match.matchId}'">
          ${t('btn.join') || 'Join'}
        </button>
      </li>
    `
      )
      .join('');
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
