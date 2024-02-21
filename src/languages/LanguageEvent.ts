import * as vscode from 'vscode';
import { LanguageManager } from './LanguageManager';
import { OnDidChangeCallback } from './types';

export class LanguageEvent {
  private languageManager: LanguageManager;
  private onDidChangeCallbacks: OnDidChangeCallback[] = [];

  constructor(languageManager: LanguageManager) {
    this.languageManager = languageManager;
  }

  public onDidChange = (callback: OnDidChangeCallback) => {
    this.onDidChangeCallbacks.push(callback);
  };

  public registerEvent = () => {
    // Refresh languages definitions after extensions changed
    return vscode.extensions.onDidChange(() => {
      this.languageManager.updateDefinitions();

      // Run change callbacks
      for (const callback of this.onDidChangeCallbacks) {
        callback();
      }
    });
  };
}
