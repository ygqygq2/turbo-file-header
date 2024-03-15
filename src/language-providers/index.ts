import { LanguageProvider } from './LanguageProvider';
import { VueProvider } from './VueProvider';

export const internalProviders: LanguageProvider[] = [new VueProvider()];

export { LanguageProvider };
