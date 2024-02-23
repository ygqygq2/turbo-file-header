import * as vscode from 'vscode';
import output from '@/error/output';
import { LanguageProvider, internalProviders } from '@/language-providers';
import { GenerateCustomProviderClasses } from '../language-providers/GenerateCustomProviderClasses';
import { errorHandler } from '@/extension';
import { CustomError, ErrorCode } from '@/error';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';
import { CUSTOM_CONFIG_FILE_NAME } from '@/constants';
import { LanguageManager } from '@/languages/LanguageManager';

export class FileheaderProviderLoader {
  private languageManager: LanguageManager;
  private generateCustomProviderClasses: GenerateCustomProviderClasses;
  // 存储已加载 provider 的缓存
  private providersCache: LanguageProvider[] | null = null;

  constructor(
    languageManager: LanguageManager,
    generateCustomProviderClasses: GenerateCustomProviderClasses,
  ) {
    this.languageManager = languageManager;
    this.generateCustomProviderClasses = generateCustomProviderClasses;
  }

  public async loadProviders(forceRefresh = false): Promise<LanguageProvider[]> {
    if (this.providersCache && !forceRefresh) {
      return this.providersCache;
    }

    const customProviders = await this.loadCustomProvers();
    this.providersCache = [...customProviders, ...internalProviders];
    return this.providersCache;
  }

  private async loadCustomProvers(): Promise<LanguageProvider[]> {
    try {
      const dynamicProviderClasses =
        await this.generateCustomProviderClasses.generateProviderClasses();
      if (!dynamicProviderClasses) {
        return [];
      }

      const providersPromises = dynamicProviderClasses.map(
        async ({ name, class: ProviderClass }) => {
          output.info(`Generate custom provider: ${name}`);
          const activeWorkspace = await getActiveDocumentWorkspace();
          try {
            const defaultUri = vscode.Uri.file('.vscode' + CUSTOM_CONFIG_FILE_NAME);
            const uriToUse = activeWorkspace?.uri || defaultUri;
            return new ProviderClass(this.languageManager, uriToUse);
          } catch (error) {
            output.error(
              errorHandler.handle(
                new CustomError(ErrorCode.CustomProviderInstanceFail, name, error),
              ),
            );
            return undefined;
          }
        },
      );

      // 显式地断言过滤后的数组类型
      const providers = (await Promise.all(providersPromises)).filter(
        (provider) => provider !== undefined,
      ) as LanguageProvider[];
      return providers;
    } catch (error) {
      output.error(`Failed to load custom providers: ${error}`);
      return [];
    }
  }
}
