type Dict = Record<string, any>;
type Lang = 'en' | 'fr' | (string & {});
const LANG_KEY = 'pong:lang';
const DICT_KEY = (l: string) => `pong:i18n:${l}`;
const DEFAULT_LANG: Lang = 'en';

let mem: Record<string, Dict> = {};

function pathGet(obj: Dict | undefined, path: string): unknown {
  if (!obj) return undefined;
  return path.split('.').reduce((acc: any, k) => (acc && k in acc ? acc[k] : undefined), obj);
}

function interpolate(str: string, vars?: Record<string, string | number>): string {
  if (!vars) return str;
  return str.replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? `{${k}}`));
}

export function getLang(): Lang {
  return (localStorage.getItem(LANG_KEY) as Lang) ||
    (navigator.language?.slice(0, 2) as Lang) ||
    DEFAULT_LANG;
}

export async function setLang(lang: Lang): Promise<void> {
  localStorage.setItem(LANG_KEY, lang);
  await ensureLocale(lang);
  window.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
}

async function ensureLocale(lang: Lang): Promise<void> {
  if (mem[lang]) return;
  const cached = localStorage.getItem(DICT_KEY(lang));
  if (cached) {
    try { mem[lang] = JSON.parse(cached); } catch { /* ignore */ }
  }
  if (!mem[lang]) {
    const res = await fetch(`/locales/${lang}.json`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Failed to load locale ${lang}`);
    const dict = await res.json();
    mem[lang] = dict;
    localStorage.setItem(DICT_KEY(lang), JSON.stringify(dict));
  }
}

export async function initI18n(lang?: Lang): Promise<void> {
  const chosen = (lang || getLang()) as Lang;
  localStorage.setItem(LANG_KEY, chosen);
  try {
    await ensureLocale(chosen);
  } catch {
    if (chosen !== DEFAULT_LANG) await ensureLocale(DEFAULT_LANG);
  }
}

function readDict(lang: Lang): Dict | undefined {
  if (!mem[lang]) {
    const cached = localStorage.getItem(DICT_KEY(lang));
    if (cached) try { mem[lang] = JSON.parse(cached); } catch {}
  }
  return mem[lang];
}

export function t(path: string, vars?: Record<string, string | number>): string {
  const lang = getLang();
  const dict = readDict(lang);
  let val = pathGet(dict, path);
  if (val === undefined && lang !== DEFAULT_LANG) {
    val = pathGet(readDict(DEFAULT_LANG), path);
  }
  if (typeof val !== 'string') return path; // fallback to key
  return interpolate(val, vars);
}