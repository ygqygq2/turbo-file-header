import vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { LanguageManager } from '@/languages/LanguageManager';

export interface LanguageProviderOptions {
  configManager: ConfigManager;
  workspaceScopeUri?: vscode.Uri;
}

export interface ExtendedLanguageProviderOptions extends LanguageProviderOptions {
  languageManager: LanguageManager;
}
