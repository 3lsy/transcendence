import { t } from '../../lib/i18n.js';
import '../../components/page-header.js';
import { navigate } from '../../router/router.js';

const tag = 'page-tournament-order';

interface Match {
  left: string;
  right: string;
  matchId?: string;
}

class TournamentOrderPage extends HTMLElement {
  async connectedCallback(): Promise<void> {
    await this.loadTournament();
  }

  private async loadTournament(): Promise<void> {
    this.innerHTML = `
      <section class="min-h-screen flex flex-col px-4 py-10">
        <page-header title="${t('tournament.title')}" back="/tournament"></page-header>
        <div class="flex-1 flex flex-col items-center justify-center space-y-8">
          <div class="text-slate-400 animate-pulse">${t('common.loading')}</div>
        </div>
      </section>
    `;

    try {
      const params = new URLSearchParams(window.location.search);
      const tournamentId = params.get('id');

      if (!tournamentId) {
        throw new Error(t('error.tournament.noId'));
      }

      const response = await fetch(`/api/tournament/status/${tournamentId}`);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t('error.tournament.fetchFailed'));
      }

      const data = await response.json();

      if (!data.rounds?.[0]?.length) {
        throw new Error(t('error.tournament.noMatches'));
      }

      this.renderTournament(data.rounds[0]);
    } catch (error) {
      this.renderError((error as Error).message);
    }
  }

  private renderTournament(matches: Match[]): void {
    const params = new URLSearchParams(window.location.search);
    const tournamentId = params.get('id');

    this.innerHTML = `
      <section class="min-h-screen flex flex-col px-4 py-10">
        <page-header title="${t('tournament.title')}" back="/tournament"></page-header>

        <div class="flex-1 flex flex-col items-center justify-center space-y-10 w-full">
          <div class="text-center">
            <h2 class="font-semibold text-xl text-white mb-1">${t('tournament.firstRound')}</h2>
            <p class="text-slate-400 text-sm">${t('tournament.instructions') || ''}</p>
          </div>

          <div class="w-full max-w-3xl space-y-4">
            <ol id="list" class="space-y-4">
              ${matches.map((match, i) => `
                <li class="rounded-lg border border-slate-600 bg-slate-800/30 backdrop-blur-md shadow-md p-5 text-white">
                  <div class="flex justify-between text-xs text-slate-400 mb-3">
                    <span>${t('tournament.match', { number: i + 1 })}</span>
                  </div>
                  <div class="flex items-center justify-between gap-4">
                    <div class="flex-1 text-lg font-medium">
                      <span>${match.left}</span>
                      <span class="mx-2 opacity-50">vs</span>
                      <span>${match.right}</span>
                    </div>
                  </div>
                </li>
              `).join('')}
            </ol>
          </div>

          <div id="error-message" class="text-red-500 text-sm mt-4 hidden"></div>

          <div class="w-full max-w-3xl mt-10 flex justify-end">
            <button id="start-button" type="button" class="btn-menu btn-menu-md border border-slate-500 hover:border-white transition">
              <span class="btn-menu-inner">
                <span class="block">${t('btn.start.top')}</span>
                <span class="block">${t('btn.start.bottom')}</span>
              </span>
            </button>
          </div>
        </div>
      </section>
  `;

    const startButton = this.querySelector<HTMLButtonElement>('#start-button');
    const errorMessage = this.querySelector<HTMLDivElement>('#error-message');

    if (startButton && tournamentId && errorMessage) {
      startButton.addEventListener('click', async () => {
        errorMessage.classList.add('hidden');
        errorMessage.textContent = '';

        try {
          const response = await fetch('/api/tournament/new-match', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ tournamentId })
          });

          if (!response.ok) {
            const data = await response.json();
            throw new Error(data?.error || t('error.tournament.fetchFailed'));
          }

          const { matchId } = await response.json();

          if (!matchId) {
            throw new Error(t('error.tournament.noMatchId'));
          }

          navigate(`/game?matchId=${matchId}&tournamentId=${tournamentId}`);
        } catch (err) {
          errorMessage.textContent = (err instanceof Error ? err.message : t('error.tournament.fetchFailed'));
          errorMessage.classList.remove('hidden');
        }
      });
    }
  }



  private renderError(message: string): void {
    this.innerHTML = `
      <section class="min-h-screen flex flex-col px-4 py-10">
        <page-header title="${t('tournament.title')}" back="/tournament"></page-header>

        <div class="flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div class="text-red-400 text-sm">${message}</div>
          <a href="/tournament" class="underline text-slate-300 hover:text-white transition">
            ${t('tournament.tryAgain')}
          </a>
        </div>
      </section>
    `;
  }
}

customElements.define(tag, TournamentOrderPage);

export const meta = { title: 'Tournament - First Round' };
export function create() { return document.createElement(tag); }
