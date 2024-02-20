import * as vscode from 'vscode';
import { getConfigurationFlatten } from './configuration';
import { OnDidChangeCallback } from './types';

const onDidChangeCallbacks: OnDidChangeCallback[] = [];

export function onDidChange(callback: OnDidChangeCallback) {
  onDidChangeCallbacks.push(callback);
}

let disposable: vscode.Disposable | undefined;
export function registerEvent() {
  // Refresh configuration after configuration changed
  disposable = vscode.workspace.onDidChangeConfiguration((event) => {
    if (!event.affectsConfiguration('TurboFileHeader')) {
      return;
    }

    const config = getConfigurationFlatten(true);

    // Run change callback
    for (const callback of onDidChangeCallbacks) {
      callback(config);
    }
  });
}

export function unregisterEvent() {
  if (disposable) {
    disposable.dispose();
  }
}
