import { Lang, getLang, setLang, t } from '../lib/i18n.js';

// static pong preview
function drawStaticPong(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width || 600;
  const height = canvas.height || 350;
  const paddleW = 12;
  const paddleH = 80;
  const ballR = 9;

  const leftPaddleY = height / 2 - paddleH / 2;
  const rightPaddleY = height / 2 - paddleH / 2;
  const ballX = width / 2;
  const ballY = height / 2;

  ctx.clearRect(0, 0, width, height);
  ctx.save();

  // navy background
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, width, height);

  // LED line in the middle
  ctx.save();
  ctx.strokeStyle = "#b9d1fc";
  ctx.shadowColor = "#6493e6";
  ctx.shadowBlur = 8;
  ctx.globalAlpha = 0.49;
  ctx.setLineDash([8, 16]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();
  ctx.restore();

  // LED paddles
  ctx.save();
  ctx.shadowColor = "#cde5ff";
  ctx.shadowBlur = 13;
  ctx.globalAlpha = 0.96;
  ctx.fillStyle = '#eaf6ff';
  ctx.fillRect(16, leftPaddleY, paddleW, paddleH);
  ctx.fillRect(width - paddleW - 16, rightPaddleY, paddleW, paddleH);
  ctx.restore();

  // LED ball
  ctx.save();
  ctx.shadowColor = "#eaf6ff";
  ctx.shadowBlur = 20;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(ballX, ballY, ballR, 0, 2 * Math.PI);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();

  ctx.restore();
}

const tag = 'page-home';

class HomePage extends HTMLElement {
  connectedCallback() {
    this.render();
  }

  private render() {
    const lang = getLang();

    const btns = [
      { href: '/play', key: 'start' },
      { href: '/tournament', key: 'startTournament' },
      { href: '/scores', key: 'scores' }
    ];

    this.innerHTML = `
      <style>
        :host {
          display: block;
          background-color: #0f172a;
          color: #cbd1e0;
          min-height: 100vh;
          font-family: 'Michroma', ui-sans-serif, monospace;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          padding: 2rem;
          box-sizing: border-box;
        }
        select#lang-select {
          background-color: #1e293b;
          border: 1px solid #475569;
          color: #e0e7f9;
          font-weight: normal;
          transition: background-color 0.3s;
          padding: 4px 8px;
          font-size: 12px;
          cursor: pointer;
        }
        select#lang-select:hover,
        select#lang-select:focus {
          background-color: #334165;
          border-color: #94a4c8;
          outline: none;
          color: #d7e2f8;
        }
        header h1 {
          text-align: center;
          font-family: 'Michroma', ui-sans-serif, monospace;
          font-weight: normal;
          font-size: 64px;
          letter-spacing: 0.12em;
          margin: 0 0 2rem 0;
          user-select: none;
          background: linear-gradient(180deg, #c4d0ea 5%, #1c2741 100%);
          color: #dae3f6;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow:
            0 1px 10px #161f37cc,
            0 0 7px #22324e,
            0 0 18px #364c7399;
          filter: brightness(1.1);
        }
        @media (min-width: 800px) {
          header h1 { font-size: 96px; }
        }
        canvas#pong-canvas {
          display: block;
          margin: 0 auto 2.25rem auto;
          border: 2px solid #475569;
          border-radius: 8px;
          background-color: #1e293b;
          width: 600px;
          height: 350px;
          max-width: 96vw;
          box-sizing: border-box;
          padding: 0;
        }
        nav {
          display: flex;
          justify-content: center;
          gap: 1rem;
          flex-wrap: wrap;
          margin-top: 1.5rem;
        }
        a.btn-menu {
          font-family: 'Michroma', ui-sans-serif, monospace;
          background: linear-gradient(180deg, #f3f6fc, #c3cadf);
          border: 2px solid #7988a5;
          color: #1b2946;
          text-decoration: none;
          padding: 8px 24px;
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
            0 2px 24px #90b3ef,
            0 8px 20px #aed9fa;
          margin-bottom: 0px;
          font-size: 16px;
        }
        a.btn-menu:hover,
        a.btn-menu:focus {
          background: linear-gradient(180deg, #2a3a5a, #182442);
          border-color: #1a2443;
          color: #b8c6d3;
          box-shadow:
            inset 0 0 6px #2b3c63cc,
            0 3px 16px #405985cc;
          outline: none;
        }
        
        // small screen
        @media (max-width: 393px) {
          canvas#pong-canvas {
            width: 100vw;
            height: calc(100vw * 350 / 600);
            margin-left: auto;
            margin-right: auto;
          }
          nav {
            gap: 0.5rem;
          }
          a.btn-menu {
            width: 100vw;
            max-width: 600px;
            min-width: 0;
            font-size: 16px;
            padding: 16px 0 11px 0;
            letter-spacing: 0.14em;
            margin-left: 0;
            margin-right: 0;
            box-sizing: border-box;
          }
          .main-content {
            margin-top: 48px;
          }
        }
        @media (min-width: 394px) {
          a.btn-menu {
            font-size: 14px;
            padding: 7px 18px;
          }
        }
      </style>

      <section>
        <div style="position: absolute; top: 16px; left: 16px;">
          <select id="lang-select" aria-label="Select Language">
            <option value="en"${lang === "en" ? " selected" : ""}>English</option>
            <option value="fr"${lang === "fr" ? " selected" : ""}>Français</option>
            <option value="es"${lang === "es" ? " selected" : ""}>Español</option>
          </select>
        </div>

        <div class="main-content">
          <header>
            <h1>${t("home.title")}</h1>
          </header>

          <canvas
            id="pong-canvas"
            width="600"
            height="350"
            aria-label="Static Pong preview"
          ></canvas>

          <nav>
            ${btns
              .map((btn) => {
                const top = t(`btn.${btn.key}.top`);
                const bottom = t(`btn.${btn.key}.bottom`);
                const label = bottom ? `${top} ${bottom}` : top;
                return `<a href="${btn.href}" class="btn-menu">${label}</a>`;
              })
              .join('')}
          </nav>
        </div>
      </section>
    `;

    this.setupLanguageListener();
    this.paintCanvas();
  }

  private setupLanguageListener() {
    const select = this.querySelector<HTMLSelectElement>('#lang-select');
    if (!select) return;
    select.addEventListener('change', async (event) => {
      const target = event.target as HTMLSelectElement;
      await setLang(target.value as Lang);
      this.render();
    });
  }

  private paintCanvas() {
    const canvas = this.querySelector<HTMLCanvasElement>('#pong-canvas');
    if (!canvas) return;
    drawStaticPong(canvas);
  }
}

customElements.define(tag, HomePage);

export const meta = { title: 'home' };
export function create() {
  return document.createElement(tag);
}
