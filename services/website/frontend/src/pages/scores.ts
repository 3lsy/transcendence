import { t } from '../lib/i18n.js';
import '../components/page-header.js';

const tag = 'page-scores';

class ScoresPage extends HTMLElement {
  private scores: Array<{
    created_at: string;
    left_nick: string;
    left_score: number;
    right_nick: string;
    right_score: number;
  }> = [];
  private loading = false;
  private error: string | null = null;

  async connectedCallback(): Promise<void> {
    this.render();
    await this.fetchScores();
  }

  private async fetchScores(): Promise<void> {
    try {
      this.loading = true;
      this.error = null;
      this.render();

      const response = await fetch('/api/scoreboard/list');
      if (!response.ok) throw new Error(t('error.scores.fetch'));

      this.scores = await response.json();
      this.loading = false;
      this.error = null;
    } catch (err) {
      this.loading = false;
      this.error = err instanceof Error ? err.message : t('error.scores.unknown');
    }
    this.render();
  }

  private render(): void {
    this.innerHTML = `
    <section class="min-h-screen flex flex-col px-4 py-10">
      <page-header title="${t('scores.title')}" back="/"></page-header>

      <div class="flex-1 flex flex-col items-center justify-center space-y-8">
        <div class="w-full max-w-3xl space-y-4">
          <ol id="list" class="space-y-4">
            ${this.renderContent()}
          </ol>
        </div>
      </div>
    </section>
  `;
  }


  private formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  private renderContent(): string {
    if (this.loading) {
      return `<li class="text-slate-400 opacity-70">${t('scores.loading')}</li>`;
    }

    if (this.error) {
      return `<li class="text-red-400">${this.error}</li>`;
    }

    if (!this.scores.length) {
      return `<li class="text-slate-400 opacity-70">${t('scores.empty')}</li>`;
    }

    return this.scores
      .map((match) => `
      <li class="rounded-lg border border-slate-600 bg-slate-800/30 backdrop-blur-md shadow-md p-5 text-white">
        <div class="flex justify-between text-xs text-slate-400 mb-3">
          <span>${this.formatDate(match.created_at)}</span>
        </div>
        <div class="flex items-center justify-between gap-4">
          <div class="flex-1 text-lg font-medium">
            <span>${match.left_nick}</span>
            <span class="mx-2 opacity-50">vs</span>
            <span>${match.right_nick}</span>
          </div>
          <div class="tabular-nums text-2xl font-bold">
            ${match.left_score} - ${match.right_score}
          </div>
        </div>
      </li>
    `)
      .join('');
  }


}
customElements.define(tag, ScoresPage);

export const meta = { title: 'High Scores' };
export function create() { return document.createElement(tag); }