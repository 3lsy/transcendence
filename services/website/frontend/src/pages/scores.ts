import { getScores, clearScores } from '../lib/store.js';
import { t } from '../lib/i18n.js';

const tag = 'page-scores';

class ScoresPage extends HTMLElement {
  connectedCallback(): void {
    this.innerHTML = `
      <style>
        .btn-menu {
          font-family: 'Michroma', ui-sans-serif, monospace;
          background: linear-gradient(180deg, #f3f6fc, #c3cadf);
          border: 2px solid #7988a5;
          color: #1b2946;
          text-decoration: none;
          padding: 14px 40px;
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
          min-width: 180px;
          max-width: 300px;
        }
        .btn-menu:hover,
        .btn-menu:focus {
          background: linear-gradient(180deg, #2a3a5a, #182442);
          border-color: #1a2443;
          color: #b8c6d3;
          box-shadow:
            inset 0 0 6px #2b3c63cc,
            0 3px 16px #405985cc;
          outline: none;
        }

        @media (max-width: 393px) {
          .btn-menu {
            width: 90vw;
            max-width: 300px;
            min-width: 0;
            font-size: 16px;
            padding: 18px 0 14px 0;
            letter-spacing: 0.14em;
            margin-left: 0;
            margin-right: 0;
          }
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
            0 2px 6px #fff7;
          filter: brightness(1.1);
          margin: 1rem 0 2rem 0;
        }
        @media (min-width: 768px) {
          .led-title {
            font-size: 4rem;
          }
        }

        .score-container {
          max-width: 500px;
          margin: 0 auto 3rem auto;
          background: rgba(33, 37, 41, 0.7);
          border-radius: 12px;
          border: 2px solid #7988a5;
          padding: 1.5rem 2rem;
          color: #eee;
          font-size: 1rem;
          font-family: monospace;
        }

        ol#list {
          list-style-position: inside;
          padding-left: 0;
          margin: 0;
        }
        li.flex {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0;
          border-bottom: 1px solid #55667788;
        }
        li.opacity-70 {
          opacity: 0.7;
          font-style: italic;
          text-align: center;
          padding: 1rem 0;
        }
      </style>

      <section>
        <h2 class="led-title">${t('scores.title')}</h2> 

        <div class="score-container">
          <ol id="list"></ol>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-4">
          <button id="clear" class="btn-menu">
            ${t('btn.clear.top')} ${t('btn.clear.bottom')}
          </button>
          <a href="/" class="btn-menu">
            ${t('btn.home.top')} ${t('btn.home.bottom')}
          </a>
        </div>
      </section>
    `;
    this.renderList();

    this.querySelector<HTMLButtonElement>('#clear')?.addEventListener('click', () => {
      clearScores();
      this.renderList();
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
      li.className = 'flex';
      li.innerHTML = `<span>${i + 1}. ${entry.name}</span><span class="tabular-nums">${entry.points}</span>`;
      ol.appendChild(li);
    });
  }
}

customElements.define(tag, ScoresPage);

export const meta = { title: 'High Scores' };
export function create() { return document.createElement(tag); }
