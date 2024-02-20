import { DocumentHandler } from './extension-operate/DocumentHandler';
import { ExtensionActivator } from './extension-operate/ExtensionActivator';
import { ExtensionConfigManager } from './extension-operate/ExtensionConfigManager';
import { FileWatcher } from './extension-operate/FileWatcher';
import { FileheaderManager } from './fileheader/FileheaderManager';
import { FileheaderProviderLoader } from './fileheader/FileheaderProviderLoader';

const extensionConfigManager = new ExtensionConfigManager();
const fileheaderProviderLoader = new FileheaderProviderLoader();
export const fileheaderManager = new FileheaderManager(fileheaderProviderLoader);
const fileWatcher = new FileWatcher(fileheaderManager);
const documentHandler = new DocumentHandler(extensionConfigManager, fileheaderManager);
export const extension = new ExtensionActivator(fileWatcher, documentHandler, fileheaderManager);
export const activate = extension.activate;
export const deactivate = extension.deactivate;
