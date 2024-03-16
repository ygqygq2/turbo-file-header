import * as vscode from 'vscode';
import { CUSTOM_CONFIG_FILE_NAME } from '@/constants';
import { ConfigManager } from '@/configuration/ConfigManager';
import { FileheaderManager } from '@/fileheader/FileheaderManager';

export class FileWatcher {
  private watcher: vscode.FileSystemWatcher | undefined;
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

  public createWatcher = () => {
    // 释放先前的 watcher
    this.dispose();
    this.watcher = vscode.workspace.createFileSystemWatcher(
      `**/.vscode/${CUSTOM_CONFIG_FILE_NAME}`,
    );
    this.watcher.onDidCreate(this.reloadProviders);
    this.watcher.onDidChange(this.reloadProviders);
    this.watcher.onDidDelete(this.reloadProviders);
    this.watcher.onDidCreate(this.reloadConfig);
    this.watcher.onDidChange(this.reloadConfig);
    this.watcher.onDidDelete(this.reloadConfig);
  };

  public dispose = () => {
    this.watcher?.dispose();
  };
}
