import { mountRouter } from '../router/router.js';

class AppRoot extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <div class="min-h-screen flex flex-col">
        <main id="app" class="container mx-auto max-w-5xl flex-1 px-4 py-8"></main>
      </div>
    `;
    const outlet = this.querySelector('#app') as HTMLElement;
    mountRouter(outlet);
  }
}
customElements.define('app-root', AppRoot);