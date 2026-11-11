import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { CUSTOM_CONFIG_FILE_NAME } from '@/constants';
import { FileheaderManager } from '@/fileheader/FileheaderManager';

export class FileWatcher {
  private watcher: vscode.FileSystemWatcher | undefined;
  private watcherDisposables: vscode.Disposable[] = [];
  private configManager: ConfigManager;
  private fileheaderManager: FileheaderManager;

  constructor(configManager: ConfigManager, fileheaderManager: FileheaderManager) {
    this.fileheaderManager = fileheaderManager;
    this.configManager = configManager;
  }

  private reloadProviders = () => {
    this.fileheaderManager.loadProviders(true);
  };

  private reloadConfig = () => {
    this.configManager.getConfigurationFromCustomConfig(true);
  };

  private handleConfigChange = () => {
    this.reloadProviders();
    this.reloadConfig();
  };

  public createWatcher = () => {
    // 释放先前的 watcher 及其事件订阅
    this.dispose();
    this.watcher = vscode.workspace.createFileSystemWatcher(
      `**/.vscode/${CUSTOM_CONFIG_FILE_NAME}`,
    );
    // Combine all config change events
    this.watcherDisposables = [
      this.watcher.onDidCreate(this.handleConfigChange),
      this.watcher.onDidChange(this.handleConfigChange),
      this.watcher.onDidDelete(this.handleConfigChange),
    ];
  };

  public dispose = () => {
    this.watcherDisposables.forEach((d) => d.dispose());
    this.watcherDisposables = [];
    this.watcher?.dispose();
    this.watcher = undefined;
  };
}
