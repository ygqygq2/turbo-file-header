import { LanguageProvider } from './LanguageProvider';
import { CSSProvider } from './CSSProvider';
import { JavaProvider } from './JavaProvider';
import { VscodeInternalProvider } from './VscodeInternalProvider';
import { HTMLProvider } from './HTMLProvider';
import { PythonProvider } from './PythonProvider';
import { VueProvider } from './VueProvider';
import { TypescriptProvider } from './TypescriptProvider';

export const internalProviders: LanguageProvider[] = [
  new CSSProvider(),
  new HTMLProvider(),
  new JavaProvider(),
  new PythonProvider(),
  new VueProvider(),
  new TypescriptProvider(),
  new VscodeInternalProvider(),
];

export { LanguageProvider as FileheaderLanguageProvider };