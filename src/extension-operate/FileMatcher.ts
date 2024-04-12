import { minimatch } from 'minimatch';
import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { contextService } from '@/extension';
import { FindFilesConfig } from '@/typings/types';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';

export interface Matcher {
  findFiles(): Promise<vscode.Uri[]>;
}

export class FileMatcher implements Matcher {
  private config: FindFilesConfig | undefined;
  private configManager: ConfigManager;

  constructor(configManager: ConfigManager) {
    this.configManager = configManager;
    this.init();
  }

  private init = async () => {
    const config = await this.configManager.getConfigurationFromCustomConfig();
    this.config = config.findFilesConfig;
  };

  public findFiles = async (): Promise<vscode.Uri[]> => {
    const context = contextService.getContext();
    const activeWorkspace = await getActiveDocumentWorkspace(context);
    if (!activeWorkspace) {
      return [];
    }

    const cancellationTokenSource = new vscode.CancellationTokenSource();
    const token = cancellationTokenSource.token;

    const globalConfig = this.configManager.getConfiguration();
    const config = this.config as unknown as FindFilesConfig;
    const includePattern = config?.include || globalConfig.include || '**/*';
    const excludePattern = config?.exclude || globalConfig.exclude || undefined;

    const files = await vscode.workspace.findFiles(
      includePattern,
      excludePattern,
      config?.maxResults ? config.maxResults : undefined,
      token,
    );
    return files;
  };

  public shouldAddHeader = (filePath: string): boolean => {
    const globalConfig = this.configManager.getConfiguration();
    const config = this.config as unknown as FindFilesConfig;
    const includePattern = config?.include || globalConfig?.include;
    const excludePattern = config?.exclude || globalConfig?.exclude;

    // 获取文件相对于工作空间的路径
    const relativePath = vscode.workspace.asRelativePath(filePath);

    // 如果文件路径匹配 "include" 配置，但不匹配 "exclude" 配置，那么应该添加头部
    if (minimatch(relativePath, includePattern) && !minimatch(relativePath, excludePattern)) {
      return true;
    }

    return false;
  };
}
