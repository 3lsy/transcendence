import { getScores, clearScores } from '../lib/store.js';
import { t } from '../lib/i18n.js';

const tag = 'page-scores';

class ScoresPage extends HTMLElement {
  connectedCallback(): void {
    this.innerHTML = `
      <section class="space-y-6">
        <h2 class="font-pong text-3xl tracking-wide text-center">${t('scores.title')}</h2>

        <div class="rounded-lg border border-slate-700 bg-slate-800/20 p-4 mx-auto max-w-md">
          <ol id="list" class="space-y-2 text-sm"></ol>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-4">
          <button id="clear" class="btn-menu btn-menu-sm">
            <span class="btn-menu-inner"><span class="block">${t('btn.clear.top')}</span><span class="block">${t('btn.clear.bottom')}</span></span>
          </button>
          <a href="/" class="btn-menu btn-menu-sm">
            <span class="btn-menu-inner"><span class="block">${t('btn.home.top')}</span><span class="block">${t('btn.home.bottom')}</span></span>
          </a>
        </div>
      </section>
    `;
    this.renderList();
    this.querySelector<HTMLButtonElement>('#clear')?.addEventListener('click', () => {
      clearScores(); this.renderList();
    });
  }

  private renderList() {
    const ol = this.querySelector<HTMLOListElement>('#list')!;
    const s = getScores();
    ol.innerHTML = '';
    if (!s.length) {
      const li = document.createElement('li');
      li.className = 'opacity-70';
      li.textContent = t('scores.empty');
      ol.appendChild(li);
      return;
    }
    s.forEach((entry, i) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between';
      li.innerHTML = `<span>${i + 1}. ${entry.name}</span><span class="tabular-nums">${entry.points}</span>`;
      ol.appendChild(li);
    });
  }
}
customElements.define(tag, ScoresPage);

export const meta = { title: 'High Scores' };
export function create() { return document.createElement(tag); }