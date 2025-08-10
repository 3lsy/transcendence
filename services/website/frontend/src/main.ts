import { initI18n } from './lib/i18n.js';
async function bootstrap() {
  await initI18n();
  import('./components/app-root.js');
}
bootstrap();