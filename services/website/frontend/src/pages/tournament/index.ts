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
      <section>
        <div class="mb-8 flex items-center gap-4">
          <a href="/" class="btn-menu btn-menu-sm">
            <span class="btn-menu-inner">
              <span class="block">${t('btn.back.top')}</span>
              <span class="block">${t('btn.back.bottom')}</span>
            </span>
          </a>
          <h2 class="font-pong text-3xl tracking-wide">${t('tournament.title')}</h2>
        </div>

        <div class="mb-6">
          <div class="mb-2 text-xs opacity-70">${t('tournament.numberOfPlayers')}</div>
          <div class="flex gap-2">
            ${[2,4,8,16].map(n=>`<button class="rounded-md border border-slate-600 px-3 py-2 hover:bg-slate-900/60" data-size="${n}">${n}</button>`).join('')}
          </div>
        </div>

        <div class="mb-4 flex items-center gap-2">
          <input id="alias" placeholder="${t('game.alias')}" class="w-56 rounded-md border border-slate-600 bg-black px-3 py-2 placeholder-slate-500 focus:border-slate-300 outline-none"/>
          <button id="add" class="rounded-md border border-slate-600 px-3 py-2 hover:bg-slate-900/60">+</button>
        </div>

        <div class="rounded-lg border border-slate-700 bg-slate-800/20 p-4">
          <ul id="list" class="max-h-64 space-y-2 overflow-auto text-sm"></ul>
        </div>

        <div class="mt-8 flex justify-end">
          <a id="start" href="/tournament/order" class="btn-menu btn-menu-sm">
            <span class="btn-menu-inner">
              <span class="block">${t('btn.startTournament.top')}</span>
              <span class="block">${t('btn.startTournament.bottom')}</span>
            </span>
          </a>
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
      b.classList.toggle('bg-slate-900/60', Number(b.dataset.size) === size);
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