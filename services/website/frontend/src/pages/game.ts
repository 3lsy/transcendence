import { getGamePlayers, addScore } from '../lib/store.js';
import { PongGame } from '../lib/pong.js';
import { t } from '../lib/i18n.js';

const tag = 'page-game';

class GamePage extends HTMLElement {
  private game?: PongGame;

  // prevent arrow keys from scrolling the page
  private preventScrollKeys = (e: KeyboardEvent) => {
    if (["ArrowUp", "ArrowDown", " ", "Spacebar"].includes(e.key)) {
      e.preventDefault();
    }
  };

  connectedCallback(): void {
    const { left, right, target } = getGamePlayers();

    this.innerHTML = `
      <style>
        .btn-menu {
          font-family: 'Michroma', ui-sans-serif, monospace;
          background: linear-gradient(180deg, #f3fcfc, #c3cadf);
          border: 2px solid #798a9f;
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
          color: #b8d6d3;
          box-shadow:
            inset 0 0 6px #2b3c63cc,
            0 3px 16px #405985cc;
          outline: none;
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
            0 2px 6px #fff;
          filter: brightness(1.05);
          margin: 0;
        }
        @media (min-width: 768px) {
          .led-title {
            font-size: 4rem;
          }
        }
      </style>

      <section class="w-full h-full min-w-[350px] min-h-[700px] flex flex-col overflow-hidden">

        <!-- top title -->
        <header class="pt-8 pb-6 flex justify-center">
          <h2 class="led-title">${t('game.title')}</h2>
        </header>

        <!-- quit button -->
        <div class="flex items-center justify-between gap-4 px-4 md:px-10 py-5">
          <a href="/" class="btn-menu">
            ${t('btn.quit.top')}${t('btn.quit.bottom') ? ' ' + t('btn.quit.bottom') : ''}
          </a>


          <div class="flex items-center gap-2 text-sm">
            <span class="opacity-70">${left}</span>
            <span class="rounded bg-slate-800/80 px-2 py-0.5"><span id="ls">0</span></span>
            <span class="opacity-40">|</span>
            <span class="rounded bg-slate-800/80 px-2 py-0.5"><span id="rs">0</span></span>
            <span class="opacity-70">${right}</span>
          </div>
        </div>

        <!-- player alias -->
        <div class="flex flex-col md:flex-row justify-center items-center gap-4 mb-4 px-4">
          <input type="text" class="w-[180px] sm:w-[260px] max-w-full px-3 py-2 rounded border border-slate-700 bg-black/60 text-center text-base sm:text-lg text-slate-200" value="${left}" readonly aria-label="Left player" />
          <input type="text" class="w-[180px] sm:w-[260px] max-w-full px-3 py-2 rounded border border-slate-700 bg-black/60 text-center text-base sm:text-lg text-slate-200" value="${right}" readonly aria-label="Right player" />
        </div>

        <!-- pong game -->
        <div class="relative rounded-lg border border-slate-700 bg-black p-2 w-full max-w-3xl mx-auto">
          <canvas id="c" class="block w-full h-[55vh] max-h-440px min-h-240px bg-black"></canvas>
          <div id="ol" class="pointer-events-none absolute inset-0 hidden grid place-items-center">
            <div class="pointer-events-auto rounded-xl border border-slate-300 bg-slate-900/90 text-center p-6">
              <div id="msg" class="mb-4 text-xl font-bold"></div>
              <div class="flex flex-wrap items-center justify-center gap-4">
                <button id="restart" class="btn-menu">
                  <span>${t('btn.restart.top')}${t('btn.restart.bottom') ? ' ' + t('btn.restart.bottom') : ''}</span>
                </button>
                <a href="/" class="btn-menu">
                  <span>${t('btn.home.top')}${t('btn.home.bottom') ? ' ' + t('btn.home.bottom') : ''}</span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- key map tip -->
        <p class="mt-3 text-center text-xs opacity-60">${t('game.controls', { target })}</p>

      </section>
    `;

    window.addEventListener("keydown", this.preventScrollKeys, { passive: false });

    const canvas = this.querySelector<HTMLCanvasElement>('#c')!;
    const ls = this.querySelector<HTMLElement>('#ls')!;
    const rs = this.querySelector<HTMLElement>('#rs')!;
    const overlay = this.querySelector<HTMLElement>('#ol')!;
    const msg = this.querySelector<HTMLElement>('#msg')!;

    this.game?.destroy();
    this.game = new PongGame(canvas, left, right, target, {
      onScore: (l, r) => { ls.textContent = String(l); rs.textContent = String(r); },
      onGameOver: (winner, points) => {
        overlay.classList.remove('hidden');
        msg.textContent = t('game.win', { name: winner });
        addScore(winner, points);
      }
    });
    this.game.start();

    this.querySelector<HTMLButtonElement>('#restart')?.addEventListener('click', () => {
      overlay.classList.add('hidden');
      this.connectedCallback();
    });
  }

  disconnectedCallback(): void {
    window.removeEventListener("keydown", this.preventScrollKeys);
    this.game?.destroy();
  }
}

customElements.define(tag, GamePage);

export const meta = { title: 'game' };
export function create() {
  return document.createElement(tag);
}
