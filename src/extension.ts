import { DocumentHandler } from './extension-operate/DocumentHandler';
import { FileheaderManager } from '@/fileheader/FileheaderManager';
import { FileWatcher } from './extension-operate/FileWatcher';
import { ConfigEvent } from '@/configuration/ConfigEvent';
import { LanguageEvent } from '@/languages/LanguageEvent';
import { ConfigManager } from './configuration/ConfigManager';
import { FileheaderProviderLoader } from './fileheader/FileheaderProviderLoader';
import { LanguageManager } from './languages/LanguageManager';
import { FileHashMemento } from './fileheader/FileHashMemento';
import { ErrorHandler } from './error/ErrorHandler';
import { GenerateTemplateConfig } from './fileheader/GenerateTemplateConfig';
import { GenerateCustomProviderClasses } from './language-providers/GenerateCustomProviderClasses';
import { FileheaderVariableBuilder } from './fileheader/FileheaderVariableBuilder';
import { ConfigReader } from './configuration/ConfigReader';
import { ExtensionActivator } from './extension-operate/ExtensionActivator';
import { DebounceManager } from './extension-operate/DebounceManager';

export const errorHandler = ErrorHandler.getInstance();
const configReader = ConfigReader.getInstance();
export const configManager = ConfigManager.getInstance(configReader);
export const configEvent = new ConfigEvent(configManager);
export const languageManager = LanguageManager.getInstance();
export const languageEvent = new LanguageEvent(languageManager);
const generateCustomProviderClasses = new GenerateCustomProviderClasses(configReader);
const fileheaderProviderLoader = new FileheaderProviderLoader(
  languageManager,
  generateCustomProviderClasses,
);
const fileHashMemento = new FileHashMemento();
const fileheaderVariableBuilder = new FileheaderVariableBuilder();
export const fileheaderManager = new FileheaderManager(
  configManager,
  fileheaderProviderLoader,
  fileHashMemento,
  fileheaderVariableBuilder,
);
const fileWatcher = new FileWatcher(fileheaderManager);
const debounceManager = new DebounceManager();
const documentHandler = new DocumentHandler(debounceManager, configManager, fileheaderManager);
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
