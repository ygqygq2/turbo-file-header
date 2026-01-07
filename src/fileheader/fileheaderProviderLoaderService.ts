import path from 'path';
import vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';
import { LanguageProvider } from '@/language-providers';
import { VscodeInternalProvider } from '@/language-providers/VscodeInternalProvider';
import { getLanguageIdByExt } from '@/utils/vscode-utils';

export async function findProvider(
  configManager: ConfigManager,
  providers: LanguageProvider[],
  document: vscode.TextDocument,
): Promise<LanguageProvider | undefined> {
  let languageId = document.languageId;
  // 如果没有识别到自定义语言，则尝试使用后缀匹配
  if (languageId === 'plaintext') {
    const ext = path.extname(document.uri.fsPath).slice(1);
    const config = configManager.getConfiguration();
    const tmpLanguageId = getLanguageIdByExt(config, `.${ext}`);
    if (tmpLanguageId) {
      languageId = tmpLanguageId;
    }
  }

  for (const provider of providers) {
    // 只有自定义 provider 有 provider.workspaceScopeUri
    let isWorkspaceMatch: boolean;
    if (!provider.workspaceScopeUri) {
      isWorkspaceMatch = true;
    } else {
      const documentWorkspace = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.path;
      const providerWorkspace = provider.workspaceScopeUri?.path;
      isWorkspaceMatch = documentWorkspace === providerWorkspace;
    }
    if (!isWorkspaceMatch) {
      continue;
    }

    const isLanguageMatch = await (async () => {
      if (provider instanceof VscodeInternalProvider) {
        await provider.getBlockCommentFromVscode(languageId);
        return true;
      }
      return provider.languages.includes(languageId);
    })();

    if (isLanguageMatch) {
      return provider;
    }
  }
  logger.info(new CustomError(ErrorCode.LanguageProviderNotFound));
  return undefined;
}
