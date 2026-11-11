import { minimatch } from 'minimatch';
import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { contextService } from '@/services';
import { FindFilesConfig } from '@/typings/types';
import { getActiveDocumentWorkspaceUri } from '@/utils/vscode-utils';

export interface Matcher {
  findFiles(): Promise<vscode.Uri[]>;
}

/**
 * 拆分逗号分隔的多个 glob 模式，返回模式数组
 */
function splitGlobPatterns(pattern?: string): string[] {
  return (pattern || '')
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);
}

/**
 * 将逗号分隔的多个 glob 模式转换为 vscode.workspace.findFiles 支持的花括号多模式语法
 */
function toMultiGlob(pattern?: string): string {
  const patterns = splitGlobPatterns(pattern);
  if (patterns.length <= 1) {
    return patterns[0] || '';
  }
  return `{${patterns.join(',')}}`;
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
    const context = contextService?.getContext();
    const activeWorkspaceUri = await getActiveDocumentWorkspaceUri(context);
    if (!activeWorkspaceUri) {
      return [];
    }

    const cancellationTokenSource = new vscode.CancellationTokenSource();
    try {
      const globalConfig = this.configManager.getConfiguration();
      const config = this.config as unknown as FindFilesConfig;
      const includePattern = config?.include || globalConfig.include || '**/*';
      const excludePattern = config?.exclude || globalConfig.exclude || undefined;

      const files = await vscode.workspace.findFiles(
        toMultiGlob(includePattern) || '**/*',
        excludePattern ? toMultiGlob(excludePattern) : undefined,
        config?.maxResults ? config.maxResults : undefined,
        cancellationTokenSource.token,
      );
      return files;
    } finally {
      cancellationTokenSource.dispose();
    }
  };

  public shouldAddHeader = (filePath: string): boolean => {
    const globalConfig = this.configManager.getConfiguration();
    const config = this.config as unknown as FindFilesConfig;
    const includePattern = config?.include || globalConfig?.include;
    const excludePattern = config?.exclude || globalConfig?.exclude;

    // 获取文件相对于工作空间的路径
    const relativePath = vscode.workspace.asRelativePath(filePath);

    const includePatterns = splitGlobPatterns(includePattern);
    const excludePatterns = splitGlobPatterns(excludePattern);

    // 如果文件路径匹配任一 "include" 模式，且不匹配 "exclude" 模式，那么应该添加头部
    const isIncluded = includePatterns.some((p) => minimatch(relativePath, p));
    const isExcluded = excludePatterns.some((p) => minimatch(relativePath, p));
    return isIncluded && !isExcluded;
  };
}
