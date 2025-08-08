import { getGamePlayers, addScore } from '../lib/store.js';
import { PongGame } from '../lib/pong.js';
import { t } from '../lib/i18n.js';

const tag = 'page-game';

class GamePage extends HTMLElement {
  private game?: PongGame;

  connectedCallback(): void {
    const { left, right, target } = getGamePlayers();
    this.innerHTML = `
      <section>
        <div class="mb-6 flex items-center justify-between gap-4">
          <a href="/" class="btn-menu btn-menu-sm">
            <span class="btn-menu-inner">
              <span class="block">${t('btn.quit.top')}</span>
              <span class="block">${t('btn.quit.bottom')}</span>
            </span>
          </a>
          <div class="flex items-center gap-2 text-sm">
            <span class="opacity-70">${left}</span>
            <span class="rounded bg-slate-800/80 px-2 py-0.5"><span id="ls">0</span></span>
            <span class="opacity-40">|</span>
            <span class="rounded bg-slate-800/80 px-2 py-0.5"><span id="rs">0</span></span>
            <span class="opacity-70">${right}</span>
          </div>
        </div>

        <div class="relative rounded-lg border border-slate-700 bg-black p-2">
          <canvas id="c" class="block h-[60vh] w-full bg-black"></canvas>

          <div id="ol" class="pointer-events-none absolute inset-0 hidden grid place-items-center">
            <div class="pointer-events-auto rounded-xl border-2 border-slate-300 bg-slate-900/90 p-6 text-center">
              <div id="msg" class="mb-4 text-2xl font-bold"></div>
              <div class="flex flex-wrap items-center justify-center gap-4">
                <button id="restart" class="btn-menu btn-menu-sm">
                  <span class="btn-menu-inner">
                    <span class="block">${t('btn.restart.top')}</span>
                    <span class="block">${t('btn.restart.bottom')}</span>
                  </span>
                </button>
                <a href="/" class="btn-menu btn-menu-sm">
                  <span class="btn-menu-inner">
                    <span class="block">${t('btn.home.top')}</span>
                    <span class="block">${t('btn.home.bottom')}</span>
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>

        <p class="mt-3 text-center text-xs opacity-60">${t('game.controls', { target })}</p>
      </section>
    `;

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
      },
    });
    this.game.start();

    this.querySelector<HTMLButtonElement>('#restart')?.addEventListener('click', () => {
      overlay.classList.add('hidden');
      this.connectedCallback();
    });
  }

  disconnectedCallback(): void { this.game?.destroy(); }
}
customElements.define(tag, GamePage);

export const meta = { title: 'Game' };
export function create() { return document.createElement(tag); }