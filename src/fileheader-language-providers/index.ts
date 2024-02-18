import { VscodeInternalLanguageProvider } from './VscodeInternalLanguageProvider';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';

export const internalProviders: FileheaderLanguageProvider[] = [
  new VscodeInternalLanguageProvider(),
];

export { FileheaderLanguageProvider };
