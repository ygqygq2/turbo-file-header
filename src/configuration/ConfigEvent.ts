import * as vscode from 'vscode';
import { ConfigManager } from './ConfigManager';
import { ConfigTag } from '@/constants';
import { OnDidChangeCallback } from '@/typings/types';

export class ConfigEvent {
  private configManager: ConfigManager;
  private onDidChangeCallbacks: OnDidChangeCallback[] = [];
  private disposables: vscode.Disposable[] = [];

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  public onDidChange = (callback: OnDidChangeCallback) => {
    this.onDidChangeCallbacks.push(callback);
  };

  public registerEvent = () => {
    const disposable = vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration(ConfigTag)) {
        return;
      }

      const config = this.configManager.getConfigurationFlatten(true);
      for (const callback of this.onDidChangeCallbacks) {
        callback(config);
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
