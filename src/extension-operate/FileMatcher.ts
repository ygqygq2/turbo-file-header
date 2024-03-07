import * as vscode from 'vscode';
import { FindFilesConfig } from '@/typings/types';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';

export interface Matcher {
  findFiles(): Promise<vscode.Uri[]>;
}

export class FileMatcher implements Matcher {
  private config: FindFilesConfig;

  constructor(config: FindFilesConfig) {
    this.config = config;
  }

  async findFiles(): Promise<vscode.Uri[]> {
    const activeWorkspace = await getActiveDocumentWorkspace();
    if (!activeWorkspace) {
      return [];
    }
    const cancellationTokenSource = new vscode.CancellationTokenSource();
    const token = cancellationTokenSource.token;
    const { include, exclude, maxResults } = this.config;
    console.log("🚀 ~ file: FileMatcher.ts:24 ~ this.config:", this.config);

    const files = await vscode.workspace.findFiles(
      include,
      exclude,
      maxResults ? maxResults : undefined,
      token,
    );
    console.log('🚀 ~ file: FileMatcher.ts:26 ~ files:', files);
    return files;
  }
}
