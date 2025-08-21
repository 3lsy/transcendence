import { t } from '../lib/i18n.js';
import { generateRandomName } from '../lib/utils.js';

const tag = 'alias-input';

class AliasInput extends HTMLElement {
  connectedCallback(): void {
    this.innerHTML = `
      <div class="flex gap-2 flex-wrap">
        <input 
          id="alias" 
          placeholder="${t('game.alias')}" 
          pattern="^[a-zA-Z0-9]{3,8}$"
          required
          class="flex-1 min-w-[10rem] rounded-md border border-slate-600 bg-black px-3 py-2 placeholder-slate-500 text-white focus:outline-none focus:border-slate-300 transition"
        />
        <button type="button" id="random-alias" class="rounded-md border border-slate-600 px-3 py-2 text-white hover:border-white transition">
          🎲
        </button>
      </div>
    `;
    const aliasInput = this.querySelector<HTMLInputElement>('#alias')!;
    aliasInput.addEventListener('invalid', (e) => {
      if (aliasInput.validity.valueMissing) {
        aliasInput.setCustomValidity(t('error.alias.empty'));
      }
    });
    aliasInput.addEventListener('input', () => {
      if (aliasInput.validity.valueMissing) {
        aliasInput.setCustomValidity(t('error.alias.empty'));
      } else if (aliasInput.validity.patternMismatch) {
        aliasInput.setCustomValidity(t('error.alias.invalid'));
      } else {
        aliasInput.setCustomValidity('');
      }
    });
    this.querySelector<HTMLButtonElement>('#random-alias')?.addEventListener('click', () => {
      aliasInput.value = generateRandomName();
      aliasInput.dispatchEvent(new Event('input'));
      aliasInput.focus();
    });
  }

  get value(): string {
    const input = this.querySelector<HTMLInputElement>('#alias');
    return input?.value.trim() || '';
  }

  set value(val: string) {
    const input = this.querySelector<HTMLInputElement>('#alias');
    if (input) input.value = val;
  }

  get input(): HTMLInputElement | null {
    return this.querySelector<HTMLInputElement>('#alias');
  }
}

customElements.define(tag, AliasInput);