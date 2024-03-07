import { ExtensionActivator } from './extension-operate/ExtensionActivator';

export const extension = new ExtensionActivator();
export const {
  activate,
  deactivate,
  errorHandler,
  fileheaderManager,
  languageEvent,
  languageManager,
  generateCustomTemplate,
  configEvent,
  configManager,
} = extension;
