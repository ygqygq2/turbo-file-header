import { CSSLanguageProvider } from "./CSSTurboFileHeadervider";
import { FileheaderLanguageProvider } from "./FileheaderLanguageProvider";
import { HTMLTurboFileHeadervider } from "./HTMLTurboFileHeadervider";
import { JavaTurboFileHeadervider } from "./JavaTurboFileHeadervider";
import { PythonTurboFileHeadervider } from "./PythonTurboFileHeadervider";
import { TypescriptTurboFileHeadervider } from "./TypescriptTurboFileHeadervider";
import { VueTurboFileHeadervider } from "./VueTurboFileHeadervider";

export const internalProviders: FileheaderLanguageProvider[] = [
  new TypescriptTurboFileHeadervider(),
  new PythonTurboFileHeadervider(),
  new VueTurboFileHeadervider(),
  new HTMLTurboFileHeadervider(),
  new CSSLanguageProvider(),
  new JavaTurboFileHeadervider(),
];

export { FileheaderLanguageProvider };
