class NavBar extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <header class="border-b border-slate-800">
        <div class="container mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <a href="/" class="font-extrabold tracking-[0.2em] text-xl">PONG</a>
          <nav class="flex items-center gap-3 text-sm">
            <a href="/play" class="px-3 py-1 rounded hover:bg-slate-800">Play</a>
            <a href="/tournament" class="px-3 py-1 rounded hover:bg-slate-800">Tournament</a>
            <a href="/scores" class="px-3 py-1 rounded hover:bg-slate-800">High Scores</a>
          </nav>
        </div>
      </header>
    `;
  }
}
customElements.define('nav-bar', NavBar);