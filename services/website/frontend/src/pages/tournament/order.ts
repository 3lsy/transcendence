import { getFirstRound } from '../../lib/store.js';
import { t } from '../../lib/i18n.js';

const tag = 'page-tournament-order';

class TournamentOrderPage extends HTMLElement {
  connectedCallback(): void {
    const pairs = getFirstRound();
    this.innerHTML = `
      <section class="space-y-6">
        <div>
          <h2 class="font-pong text-2xl tracking-wide">${t('tournament.title')}</h2>
          <div class="opacity-80">${t('tournament.firstRound')}</div>
        </div>

        <div class="rounded-lg border border-slate-700 bg-slate-800/20 p-4">
          <ol id="list" class="space-y-2 text-sm"></ol>
        </div>

        <div class="flex flex-wrap justify-center gap-4">
          <a href="/tournament" class="btn-menu btn-menu-sm">
            <span class="btn-menu-inner"><span class="block">${t('btn.back.top')}</span><span class="block">${t('btn.back.bottom')}</span></span>
          </a>
          <a href="/" class="btn-menu btn-menu-sm">
            <span class="btn-menu-inner"><span class="block">${t('btn.home.top')}</span><span class="block">${t('btn.home.bottom')}</span></span>
          </a>
        </div>
      </section>
    `;

    const ol = this.querySelector<HTMLOListElement>('#list')!;
    pairs.forEach((m, i) => {
      const li = document.createElement('li');
      li.className = 'rounded-md border border-slate-700 px-3 py-2';
      li.textContent = `${i + 1}. ${m.left.name} VS ${m.right.name}`;
      ol.appendChild(li);
    });
  }
}
customElements.define(tag, TournamentOrderPage);

export const meta = { title: 'First Round' };
export function create() { return document.createElement(tag); }