import { PongGame, type GameState } from '../lib/pong.js';
import { t } from '../lib/i18n.js';
import { navigate } from '../router/router.js';

const tag = 'page-game';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

class GamePage extends HTMLElement {
  private game?: PongGame;

  connectedCallback(): void {
    this.initGame().catch((err) => {
      const msg = err?.message === 'notFound'
        ? t('error.game.notFound')
        : t('error.game.generic');

      this.innerHTML = `
      <div class="flex h-screen items-center justify-center text-white bg-black">
        <p class="text-xl font-bold">${msg}</p>
      </div>`;
    });
  }
  private async initGame(): Promise<void> {
    const matchId = new URLSearchParams(window.location.search).get('matchId');
    if (!matchId) throw new Error('notFound');
    const tournamentId = new URLSearchParams(window.location.search).get('tournamentId');

    const response = await fetch(`/api/game/state?matchId=${matchId}`);
    if (!response.ok) throw new Error(response.status === 404 ? 'notFound' : 'fetchFailed');

    const state: GameState = await response.json();

    const left = state.players.left?.alias ?? t('game.unknownPlayer');
    const right = state.players.right?.alias ?? t('game.unknownPlayer');
    const target = state.target;

    this.renderGameUI(left, right, target);

    const canvas = this.querySelector<HTMLCanvasElement>('#c')!;
    const ls = this.querySelector<HTMLElement>('#ls')!;
    const rs = this.querySelector<HTMLElement>('#rs')!;
    const overlay = this.querySelector<HTMLElement>('#ol')!;
    const msg = this.querySelector<HTMLElement>('#msg')!;

    this.game?.destroy();

    this.game = new PongGame(canvas, left, right, target, matchId, {
      onScore: (l, r) => {
        ls.textContent = String(l);
        rs.textContent = String(r);
      },
      onGameOver: async (winner, cause) => {
        overlay.classList.remove('hidden');
        if (cause === 'normal' && winner) {
          msg.textContent = t('game.win', { name: winner });
        } else if (cause === 'quit') {
          msg.textContent = t('game.quit');
        } else if (cause === 'disconnected') {
          msg.textContent = t('error.game.disconnected');
        } else {
          msg.textContent = t('error.game.generic');
        }
        // Check tournament status if part of tournament
        if (tournamentId && cause === 'normal') {
          try {
            await delay(300); // Wait a bit before checking
            const response = await fetch(`/api/tournament/status/${tournamentId}`);
            if (!response.ok) throw new Error();

            const data = await response.json();
            const actionsDiv = this.querySelector('#tournament-actions')!;
            actionsDiv.innerHTML = ''; // Clear previous content

            if (data.ended) {
              // Tournament is finished
              msg.textContent = t('tournament.ended', { name: winner ?? t('game.unknownPlayer') });
              actionsDiv.innerHTML = `
                <a href="/" class="btn-menu btn-menu-sm border border-slate-500 hover:border-white transition">
                  <span class="btn-menu-inner">
                    <span class="block">${t('btn.home.top')}</span>
                    <span class="block">${t('btn.home.bottom')}</span>
                  </span>
                </a>
             `;
            } else {
              const button = document.createElement('button');
              button.className = 'btn-menu btn-menu-sm border border-slate-500 hover:border-white transition';
              button.innerHTML = `
                <span class="btn-menu-inner">
                  <span class="block">${t('btn.next.top')}</span>
                  <span class="block">${t('btn.next.bottom')}</span>
                </span>
              `;

              button.addEventListener('click', async () => {
                try {
                  const res = await fetch('/api/tournament/new-match', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ tournamentId })
                  });
                  const result = await res.json();
                  if (!res.ok || !result.matchId) throw new Error();

                  navigate(`/game?matchId=${result.matchId}&tournamentId=${tournamentId}`);
                } catch {
                  msg.textContent = t('error.tournament.nextMatchFailed');
                }
              });


              const matchesLeft = data.matchesLeft;
              const currentRoundIndex = data.currentRound;
              const rounds: { left: string, right: string }[][] = data.rounds;

              const listWrapper = document.createElement('div');
              listWrapper.className = 'mt-6';

              if (matchesLeft > 0) {
                // Remaining matches in current round
                const currentRoundMatches = rounds[currentRoundIndex];
                const remainingMatches = currentRoundMatches.slice(currentRoundMatches.length - matchesLeft);

                listWrapper.innerHTML = `
                  <div class="mb-4 text-lg font-pong tracking-wide text-slate-300">
                    ${t('tournament.round', { number: currentRoundIndex + 1 })}
                  </div>
                  <ol class="space-y-2 rounded-lg border border-slate-700 bg-slate-800/20 p-4 text-sm">
                    ${remainingMatches
                    .map(
                      (m, idx) =>
                        `<li class="rounded-md border border-slate-700 px-3 py-2">
                            <span class="font-semibold">${t('tournament.match', { number: currentRoundMatches.length - matchesLeft + idx + 1 })}:</span> 
                            ${m.left} VS ${m.right}
                          </li>`
                    )
                    .join('')}
                  </ol>
                `;
              } else {
                // Show next round matches if any
                const nextRoundIndex = currentRoundIndex + 1;
                if (rounds[nextRoundIndex] && rounds[nextRoundIndex].length > 0) {
                  listWrapper.innerHTML = `
                    <div class="mb-4 text-lg font-pong tracking-wide text-slate-300">
                      ${t('tournament.round', { number: nextRoundIndex + 1 })}
                    </div>
                    <ol class="space-y-2 rounded-lg border border-slate-700 bg-slate-800/20 p-4 text-sm">
                      ${rounds[nextRoundIndex]
                      .map(
                        (m, idx) =>
                          `<li class="rounded-md border border-slate-700 px-3 py-2">
                              <span class="font-semibold">${t('tournament.match', { number: idx + 1 })}:</span> 
                              ${m.left} VS ${m.right}
                            </li>`
                      )
                      .join('')}
                    </ol>
                  `;
                } else {
                  listWrapper.innerHTML = `
                    <div class="rounded-lg border border-slate-700 bg-slate-800/20 p-4 text-sm text-slate-400 italic text-center">
                      ${t('tournament.noFutureRounds')}
                    </div>
                  `;
                }
              }

              actionsDiv.appendChild(listWrapper);

              if (data.matchesLeft === 0 && data.roundsLeft > 0) {
                msg.textContent = t('tournament.nextRound');
              } else {
                msg.textContent = t('tournament.nextMatch');
              }
              actionsDiv.appendChild(button);
            }
          } catch {
            msg.textContent = t('error.tournament.statusFailed');
          }
        }
      },
    });

    this.game.start();

    this.querySelector<HTMLButtonElement>('#quit')?.addEventListener('click', () => this.quitGame(matchId, tournamentId));
  }

  private async quitGame(matchId: string, tournamentId?: string | null): Promise<void> {
    const overlay = this.querySelector<HTMLElement>('#ol')!;
    const msg = this.querySelector<HTMLElement>('#msg')!;

    try {
      const response = await fetch(tournamentId ? '/api/tournament/quit' : '/api/game/quit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tournamentId ? { tournamentId } : { matchId }),
      });

      if (response.ok) {
        navigate('/');
      } else {
        overlay.classList.remove('hidden');
        msg.textContent = t('error.game.quitFailed');
      }
    } catch {
      overlay.classList.remove('hidden');
      msg.textContent = t('error.game.quitFailed');
    }
  }


  private renderGameUI(left: string, right: string, target: number): void {
    this.innerHTML = `
    <section
      class="flex flex-col overflow-hidden px-4 py-8"
      style="height: calc(100vh - 2rem - 2rem);"
    >
      
      <!-- Header -->
      <div class="mb-6 flex items-center justify-between">
        <button id="quit" class="btn-menu btn-menu-sm border border-slate-500 hover:border-white transition">
          <span class="btn-menu-inner">
            <span class="block">${t('btn.quit.top')}</span>
            <span class="block">${t('btn.quit.bottom')}</span>
          </span>
        </button>
        
        <div class="flex items-center gap-2 text-sm text-white">
          <span class="opacity-70">${left}</span>
          <span class="rounded bg-slate-800/80 px-2 py-0.5 font-mono text-base"><span id="ls">0</span></span>
          <span class="opacity-40">|</span>
          <span class="rounded bg-slate-800/80 px-2 py-0.5 font-mono text-base"><span id="rs">0</span></span>
          <span class="opacity-70">${right}</span>
        </div>
      </div>

      <!-- Game Area -->
      <div class="flex-1 flex items-center justify-center">
        <div class="relative w-full max-w-5xl aspect-video overflow-hidden rounded-lg border border-slate-700 bg-black shadow-md">
          <canvas id="c" class="block h-full w-full bg-black"></canvas>
        </div>
      </div>

      <!-- Overlay -->
      <div id="ol" class="pointer-events-none absolute inset-0 z-50 hidden grid place-items-center">
        <div class="pointer-events-auto rounded-xl border-2 border-slate-300 bg-slate-900/90 p-6 text-center max-w-md">
          <div id="msg" class="mb-4 text-2xl font-bold text-white"></div>
          <div id="tournament-actions" class="flex flex-wrap items-center justify-center gap-4">
            <a href="/" class="btn-menu btn-menu-sm border border-slate-500 hover:border-white transition">
              <span class="btn-menu-inner">
                <span class="block">${t('btn.home.top')}</span>
                <span class="block">${t('btn.home.bottom')}</span>
              </span>
            </a>
          </div>
        </div>
      </div>

      <!-- Controls info -->
      <p class="mt-4 text-center text-xs text-slate-400">${t('game.controls', { target })}</p>
    </section>
  `;
  }

  disconnectedCallback(): void { this.game?.destroy(); }
}
customElements.define(tag, GamePage);

export const meta = { title: 'Game' };
export function create() { return document.createElement(tag); }