import { configManager } from '@/extension';
import { LanguageProvider } from './LanguageProvider';
import { VueProvider } from './VueProvider';

export const internalProviders: LanguageProvider[] = [new VueProvider({ configManager })];

export { LanguageProvider };
