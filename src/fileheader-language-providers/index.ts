// import { VscodeInternalLanguageProvider } from './VscodeInternalLanguageProvider';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';
import { TypescriptProvider } from './TypescriptFileheaderProvider';

export const internalProviders: FileheaderLanguageProvider[] = [
  new TypescriptProvider(),
  // new VscodeInternalLanguageProvider(),
];

export { FileheaderLanguageProvider };
