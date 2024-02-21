import * as vscode from 'vscode';
import { ConfigManager } from './ConfigManager';
import { OnDidChangeCallback } from './types';

export class ConfigEvent {
  private configManager: ConfigManager;
  private onDidChangeCallbacks: OnDidChangeCallback[] = [];

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
  }

  public onDidChange = (callback: OnDidChangeCallback) => {
    this.onDidChangeCallbacks.push(callback);
  };

  public registerEvent = () => {
    // Refresh configuration after configuration changed
    return vscode.workspace.onDidChangeConfiguration((event) => {
      if (!event.affectsConfiguration('TurboFileHeader')) {
        return;
      }

      // 获取最新配置
      const config = this.configManager.getConfigurationFlatten(true);

      // Run change callback
      for (const callback of this.onDidChangeCallbacks) {
        callback(config);
      }
    });
  };
}
