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
import { ErrorHandler } from './error/ErrorHandler';
import { GenerateTemplateConfig } from './fileheader/GenerateTemplateConfig';
import { GenerateCustomProviderClasses } from './language-providers/GenerateCustomProviderClasses';
import { FileheaderVariableBuilder } from './fileheader/FileheaderVariableBuilder';
import { createVCSProvider } from './vsc-provider';
import { BaseVCSProvider } from './vsc-provider/BaseVCSProvider';
import { ConfigReader } from './configuration/ConfigReader';

export const vscProvider = createVCSProvider() as unknown as BaseVCSProvider;
export const errorHandler = ErrorHandler.getInstance();
const configReader = ConfigReader.getInstance();
export const configManager = ConfigManager.getInstance(configReader);
export const configEvent = new ConfigEvent(configManager);
export const languageManager = LanguageManager.getInstance();
export const languageEvent = new LanguageEvent(languageManager);
// export const configuration = configManager.getConfigurationFlatten();
const generateCustomProviderClasses = new GenerateCustomProviderClasses(configReader);
const fileheaderProviderLoader = new FileheaderProviderLoader(
  languageManager,
  generateCustomProviderClasses,
);
const fileHashMemento = new FileHashMemento();
const fileheaderVariableBuilder = new FileheaderVariableBuilder(vscProvider);
export const fileheaderManager = new FileheaderManager(
  configManager,
  vscProvider,
  fileheaderProviderLoader,
  fileHashMemento,
  fileheaderVariableBuilder,
);
const fileWatcher = new FileWatcher(fileheaderManager);
const documentHandler = new DocumentHandler(configManager, fileheaderManager);
export const generateCustomTemplate = GenerateTemplateConfig.getInstance();
export const extension = new ExtensionActivator(
  configEvent,
  languageEvent,
  fileWatcher,
  documentHandler,
  fileheaderManager,
);
export const activate = extension.activate;
export const deactivate = extension.deactivate;
