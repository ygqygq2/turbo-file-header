import { FileheaderManager } from '@/fileheader/FileheaderManager';
import * as vscode from 'vscode';

export class FileWatcher {
  private watcher: vscode.FileSystemWatcher | undefined;
  private fileheaderManager: FileheaderManager;

  constructor(fileheaderManager: FileheaderManager) {
    this.fileheaderManager = fileheaderManager;
  }

  private reloadProviders = () => {
    this.fileheaderManager.loadProviders(true);
  };

  public createWatcher = () => {
    // 释放先前的 watcher
    this.dispose();
    this.watcher = vscode.workspace.createFileSystemWatcher('**/.vscode/fileheader.config.yaml');
    this.watcher.onDidCreate(this.reloadProviders);
    this.watcher.onDidChange(this.reloadProviders);
    this.watcher.onDidDelete(this.reloadProviders);
  };

  public dispose = () => {
    this.watcher?.dispose();
  };
}
