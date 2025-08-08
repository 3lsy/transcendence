export type PageContext = {
  params: Record<string, string>; // reserved for future dynamic routes
  query: URLSearchParams;
};

export type PageModule = {
  create: (ctx: PageContext) => HTMLElement | Promise<HTMLElement>;
  meta?: { title?: string };
};

let outletEl: HTMLElement | null = null;

export function mountRouter(outlet: HTMLElement) {
  outletEl = outlet;
  // intercept same-origin links
  document.addEventListener('click', onLinkClick);
  window.addEventListener('popstate', () => render(location.pathname + location.search));
  // initial render
  render(location.pathname + location.search);
}

export function navigate(path: string, replace = false) {
  const url = new URL(path, location.origin);
  if (replace) {
    history.replaceState({}, '', url.pathname + url.search);
  } else {
    history.pushState({}, '', url.pathname + url.search);
  }
  render(url.pathname + url.search);
}

function onLinkClick(e: MouseEvent) {
  const target = e.target as HTMLElement | null;
  if (!target) return;
  const a = target.closest('a');
  if (!a) return;

  const href = (a as HTMLAnchorElement).href;
  if (!href) return;

  const url = new URL(href);
  const sameOrigin = url.origin === location.origin;

  const ignore =
    a.hasAttribute('download') ||
    a.getAttribute('target') === '_blank' ||
    e.ctrlKey || e.metaKey || e.shiftKey || e.altKey ||
    !sameOrigin;

  if (ignore) return;

  e.preventDefault();
  navigate(url.pathname + url.search);
}

async function render(pathAndQuery: string) {
  if (!outletEl) return;
  const url = new URL(pathAndQuery, location.origin);
  const ctx = { params: {}, query: url.searchParams } as PageContext;

  const mod = await resolvePageModule(url.pathname).catch(async () => {
    // fallback to 404
    return await import(new URL('../pages/404.js', import.meta.url).href) as PageModule;
  });

  const el = await (mod as PageModule).create(ctx);
  outletEl.innerHTML = '';
  outletEl.append(el);

  const title = (mod as PageModule).meta?.title;
  if (title) document.title = `Transcendence | ${title}`;
}

async function resolvePageModule(pathname: string): Promise<PageModule> {
  const clean = pathname.replace(/\/+$/, '') || '/';
  const candidates = clean === '/'
    ? ['../pages/index.js']
    : [`../pages${clean}.js`, `../pages${clean}/index.js`];

  for (const c of candidates) {
    try {
      const mod = await import(new URL(c, import.meta.url).href);
      return mod as PageModule;
    } catch {
      // try next
    }
  }
  throw new Error('Page module not found for ' + pathname);
}