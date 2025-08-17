import {
  setTournamentSize, getTournamentSize, addTournamentPlayer, removeTournamentPlayer,
  getTournamentPlayers, canStartTournament, buildFirstRound
} from '../../lib/store.js';
import { t } from '../../lib/i18n.js';

const tag = 'page-tournament';

class TournamentPage extends HTMLElement {
  connectedCallback(): void {
    this.render();
    this.wire();
    this.refresh();
  }

  private render(): void {
    this.innerHTML = `
      <section class="min-h-screen flex flex-col px-4 py-10">
        <div class="mb-10 flex items-center justify-between">
          <a href="/" class="btn-menu btn-menu-sm border border-slate-500 hover:border-white transition">
            <span class="btn-menu-inner">
              <span class="block">${t('btn.back.top')}</span>
              <span class="block">${t('btn.back.bottom')}</span>
            </span>
          </a>
          <h2 class="font-pong text-4xl tracking-wide text-white">${t('tournament.title')}</h2>
        </div>

        <div class="flex flex-col items-center space-y-10">
          <!-- Player count selection -->
          <div class="w-full max-w-md">
            <div class="mb-2 text-xs text-slate-400 tracking-wide">${t('tournament.numberOfPlayers')}</div>
            <div class="grid grid-cols-4 gap-3">
              ${[2, 4, 8, 16].map(n => `
                <button class="rounded-md border border-slate-600 px-4 py-2 text-white hover:border-white transition" data-size="${n}">${n}</button>
              `).join('')}
            </div>
          </div>

          <!-- Add player input -->
          <div class="w-full max-w-md flex gap-2">
            <input id="alias" placeholder="${t('game.alias')}" class="flex-1 rounded-md border border-slate-600 bg-black px-3 py-2 placeholder-slate-500 text-white focus:outline-none focus:border-slate-300 transition" />
            <button id="add" class="rounded-md border border-slate-600 px-4 py-2 text-white hover:border-white transition">+</button>
          </div>

          <!-- Player list -->
          <div class="w-full max-w-md rounded-lg border border-slate-700 bg-slate-800/30 backdrop-blur-md shadow-md p-4">
            <ul id="list" class="max-h-64 space-y-2 overflow-auto text-sm text-white"></ul>
          </div>

          <!-- Start tournament button -->
          <div class="w-full max-w-md flex justify-end">
            <a id="start" href="/tournament/order" class="btn-menu btn-menu-sm border border-slate-500 hover:border-white transition">
              <span class="btn-menu-inner">
                <span class="block">${t('btn.startTournament.top')}</span>
                <span class="block">${t('btn.startTournament.bottom')}</span>
              </span>
            </a>
          </div>
        </div>
      </section>
    `;
  }

  private wire(): void {
    this.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((b) => {
      b.addEventListener('click', () => { setTournamentSize(Number(b.dataset.size)); this.refresh(); });
    });

    this.querySelector<HTMLButtonElement>('#add')?.addEventListener('click', () => {
      const inp = this.querySelector<HTMLInputElement>('#alias')!;
      addTournamentPlayer(inp.value);
      inp.value = ''; inp.focus(); this.refresh();
    });

    this.querySelector<HTMLInputElement>('#alias')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); this.querySelector<HTMLButtonElement>('#add')!.click(); }
    });

    this.querySelector<HTMLAnchorElement>('#start')?.addEventListener('click', (e) => {
      if (!canStartTournament()) { e.preventDefault(); return; }
      buildFirstRound();
    });
  }

  private refresh(): void {
    const size = getTournamentSize();
    this.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((b) => {
      const isSelected = Number(b.dataset.size) === size;
      b.classList.toggle('bg-slate-900/60', isSelected);
      b.classList.toggle('border-white', isSelected);
      b.classList.toggle('text-white', isSelected);
      b.classList.toggle('opacity-100', isSelected);
      b.classList.toggle('opacity-50', !isSelected);
    });

    const ul = this.querySelector<HTMLUListElement>('#list')!;
    ul.innerHTML = '';
    getTournamentPlayers().forEach((p, i) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between rounded-md border border-slate-700 px-3 py-2';
      li.innerHTML = `<span><span class="opacity-50 mr-2">${i + 1}.</span>${p.name}</span>`;
      const rm = document.createElement('button');
      rm.className = 'rounded-md border border-slate-600 px-2 py-1 text-xs hover:bg-slate-900/60';
      rm.textContent = t('common.remove');
      rm.addEventListener('click', () => { removeTournamentPlayer(p.id); this.refresh(); });
      li.appendChild(rm);
      ul.appendChild(li);
    });

    const start = this.querySelector<HTMLAnchorElement>('#start')!;
    const ok = canStartTournament();
    start.classList.toggle('opacity-50', !ok);
    start.classList.toggle('cursor-not-allowed', !ok);
    start.classList.toggle('pointer-events-none', !ok);
    start.setAttribute('aria-disabled', String(!ok));
  }
}
customElements.define(tag, TournamentPage);

export const meta = { title: 'Tournament' };
export function create() { return document.createElement(tag); }