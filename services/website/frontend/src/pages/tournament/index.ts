import { t } from '../../lib/i18n.js';
import { navigate } from '../../router/router.js';
import '../../components/alias-input.js';
import '../../components/page-header.js';

const tag = 'page-tournament';

class TournamentPage extends HTMLElement {
  private players: Set<string> = new Set();
  private selectedSize: number = 2;

  connectedCallback(): void {
    this.render();
    this.wire();
    this.refresh();
  }

  private render(): void {
    this.innerHTML = `
      <section class="min-h-screen flex flex-col px-4 py-10">
        <page-header title="${t('tournament.title')}" back="/"></page-header>

        <div class="flex-1 flex flex-col items-center justify-center">
          <div class="grid gap-8 md:grid-cols-2 w-full max-w-4xl">
            
            <!-- Left Side: Player setup -->
            <div class="flex flex-col gap-6">
              <div>
                <div class="mb-2 text-xs text-slate-400 tracking-wide">${t('tournament.numberOfPlayers')}</div>
                <div class="grid grid-cols-4 gap-3">
                  ${[2, 4, 8, 16].map(n => `
                    <button type="button" class="rounded-md border border-slate-600 px-4 py-2 text-white hover:border-white transition" data-size="${n}">
                      ${n}
                    </button>
                  `).join('')}
                </div>
              </div>

              <alias-input></alias-input>
              <button type="button" id="add" class="rounded-md border border-slate-600 px-4 py-2 text-white hover:border-white transition">
                +
              </button>

            </div>

            <!-- Right Side: Player list -->
            <div class="rounded-lg border border-slate-700 bg-slate-800/30 backdrop-blur-md shadow-md p-6 flex flex-col justify-between">
              <ul id="list" class="max-h-64 space-y-2 overflow-auto text-sm text-white"></ul>
            </div>

            <!-- Full width: Start button -->
            <div class="md:col-span-2 flex justify-end mt-6">
              <button id="start" type="button" class="btn-menu btn-menu-sm border border-slate-500 hover:border-white transition">
                <span class="btn-menu-inner">
                  <span class="block">${t('btn.startTournament.top')}</span>
                  <span class="block">${t('btn.startTournament.bottom')}</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>
    `;
  }



  private wire(): void {
    this.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((b) => {
      b.addEventListener('click', () => {
        this.selectedSize = Number(b.dataset.size);
        this.refresh();
      });
    });


    this.querySelector<HTMLButtonElement>('#add')?.addEventListener('click', () => {
      if (this.players.size >= this.selectedSize) {
        return;
      }
      const aliasInput = this.querySelector('alias-input') as any;
      const inp = aliasInput?.input as HTMLInputElement;
      if (!inp || !inp.checkValidity()) {
        inp?.reportValidity();
        return;
      }
      const nickname = inp.value.trim();
      this.players.add(nickname);
      inp.value = '';
      inp.focus();
      this.refresh();
    });

    const aliasInput = this.querySelector('alias-input') as any;
    aliasInput?.input?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.querySelector<HTMLButtonElement>('#add')!.click();
      }
    });

    this.querySelector<HTMLAnchorElement>('#start')?.addEventListener('click', async (e) => {
      e.preventDefault();

      // Validate tournament can start
      if (this.players.size !== this.selectedSize) {
        return;
      }

      try {
        const response = await fetch('/api/tournament/new', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nicks: Array.from(this.players)
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('Tournament creation failed:', error);
          return;
        }

        const { tournamentId, firstRound } = await response.json();
        navigate(`/tournament/order?id=${tournamentId}`);
      } catch (error) {
        console.error('Failed to create tournament:', error);
      }
    });
  }

  private refresh(): void {
    // Update size selector buttons
    this.querySelectorAll<HTMLButtonElement>('[data-size]').forEach((b) => {
      const isSelected = Number(b.dataset.size) === this.selectedSize;
      b.classList.toggle('bg-slate-900/60', isSelected);
      b.classList.toggle('border-white', isSelected);
      b.classList.toggle('text-white', isSelected);
      b.classList.toggle('opacity-100', isSelected);
      b.classList.toggle('opacity-50', !isSelected);
    });

    // Update players list
    const ul = this.querySelector<HTMLUListElement>('#list')!;
    ul.innerHTML = '';
    Array.from(this.players).forEach((nickname, i) => {
      const li = document.createElement('li');
      li.className = 'flex items-center justify-between rounded-md border border-slate-700 px-3 py-2';
      li.innerHTML = `<span><span class="opacity-50 mr-2">${i + 1}.</span>${nickname}</span>`;
      const rm = document.createElement('button');
      rm.className = 'rounded-md border border-slate-600 px-2 py-1 text-xs hover:bg-slate-900/60';
      rm.textContent = t('common.remove');
      rm.addEventListener('click', () => {
        this.players.delete(nickname);
        this.refresh();
      });
      li.appendChild(rm);
      ul.appendChild(li);
    });

    // Update start button state
    const start = this.querySelector<HTMLAnchorElement>('#start')!;
    const canStart = this.players.size === this.selectedSize;
    start.classList.toggle('opacity-50', !canStart);
    start.classList.toggle('cursor-not-allowed', !canStart);
    start.classList.toggle('pointer-events-none', !canStart);
    start.setAttribute('aria-disabled', String(!canStart));
  }
}
customElements.define(tag, TournamentPage);

export const meta = { title: 'Tournament' };
export function create() { return document.createElement(tag); }