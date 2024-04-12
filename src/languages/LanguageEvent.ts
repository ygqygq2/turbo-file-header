import * as vscode from 'vscode';

import { LanguageManager } from './LanguageManager';
import { OnDidChangeCallback } from './types';

export class LanguageEvent {
  private languageManager: LanguageManager;
  private onDidChangeCallbacks: OnDidChangeCallback[] = [];
  private disposables: vscode.Disposable[] = [];

  constructor(languageManager: LanguageManager) {
    this.languageManager = languageManager;
  }

  public onDidChange = (callback: OnDidChangeCallback) => {
    this.onDidChangeCallbacks.push(callback);
  };

  public registerEvent = () => {
    const disposable = vscode.extensions.onDidChange(() => {
      this.languageManager.updateDefinitions();

      for (const callback of this.onDidChangeCallbacks) {
        callback();
      }
    });

    // this.disposables.push(disposable);
    return disposable;
  };

  public dispose() {
    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables = [];
  }
}
