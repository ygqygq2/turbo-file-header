import { DocumentHandler } from './extension-operate/DocumentHandler';
import { ExtensionActivator } from './extension-operate/ExtensionActivator';
import { ConfigManager } from './configuration/ConfigManager';
import { FileWatcher } from './extension-operate/FileWatcher';
import { FileheaderManager } from './fileheader/FileheaderManager';
import { FileheaderProviderLoader } from './fileheader/FileheaderProviderLoader';
import { ConfigEvent } from './configuration/ConfigEvent';
import { LanguageManager } from './languages/LanguageManager';
import { LanguageEvent } from './languages/LanguageEvent';
import { FileHashMemento } from './fileheader/FileHashMemento';

export const configManager = ConfigManager.getInstance();
export const configEvent = new ConfigEvent(configManager);
export const languageManager = LanguageManager.getInstance();
export const languageEvent = new LanguageEvent(languageManager);
// export const configuration = configManager.getConfigurationFlatten();
const fileheaderProviderLoader = new FileheaderProviderLoader();
const fileHashMemento = new FileHashMemento();
export const fileheaderManager = new FileheaderManager(fileheaderProviderLoader, fileHashMemento);
const fileWatcher = new FileWatcher(fileheaderManager);
const documentHandler = new DocumentHandler(configManager, fileheaderManager);
export const extension = new ExtensionActivator(
  configEvent,
  languageEvent,
  fileWatcher,
  documentHandler,
  fileheaderManager,
);
export const activate = extension.activate;
export const deactivate = extension.deactivate;
