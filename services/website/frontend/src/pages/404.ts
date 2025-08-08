const tag = 'page-404';

class NotFoundPage extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <section class="text-center">
        <h1 class="text-3xl font-bold mb-2">404</h1>
        <p class="text-slate-300">Page not found.</p>
        <p class="mt-4"><a class="btn" href="/">Go home</a></p>
      </section>
    `;
  }
}

customElements.define(tag, NotFoundPage);

export const meta = { title: 'Not found' };
export function create() { return document.createElement(tag); }