import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { CUSTOM_CONFIG_FILE_NAME } from '@/constants';
import { CustomError, ErrorCode } from '@/error';
import { contextService, logger } from '@/extension';
import { LanguageProvider } from '@/language-providers';
import { VueProvider } from '@/language-providers/VueProvider';
import { LanguageManager } from '@/languages/LanguageManager';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';

import { GenerateCustomProviderClasses } from '../language-providers/GenerateCustomProviderClasses';
import { VscodeInternalProvider } from '../language-providers/VscodeInternalProvider';

export class FileheaderProviderLoader {
  private configManager: ConfigManager;
  private languageManager: LanguageManager;
  private generateCustomProviderClasses: GenerateCustomProviderClasses;
  // 存储已加载 provider 的缓存
  private providersCache: LanguageProvider[] | null = null;

  constructor(
    configManager: ConfigManager,
    languageManager: LanguageManager,
    generateCustomProviderClasses: GenerateCustomProviderClasses,
  ) {
    this.configManager = configManager;
    this.languageManager = languageManager;
    this.generateCustomProviderClasses = generateCustomProviderClasses;
  }

  public async loadProviders(forceRefresh = false): Promise<LanguageProvider[]> {
    if (this.providersCache && !forceRefresh) {
      return this.providersCache;
    }

    const customProviders = await this.loadCustomProvers();
    this.providersCache = [
      ...customProviders,
      new VueProvider({ configManager: this.configManager }),
      new VscodeInternalProvider({
        configManager: this.configManager,
        languageManager: this.languageManager,
      }),
    ];
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
        async ({ name, providerClass: ProviderClass }) => {
          logger.info(`Generate custom provider: ${name}`);
          const context = contextService?.getContext();
          const activeWorkspace = await getActiveDocumentWorkspace(context);
          try {
            const defaultUri = vscode.Uri.file('.vscode' + CUSTOM_CONFIG_FILE_NAME);
            const uriToUse = activeWorkspace?.uri || defaultUri;
            return new ProviderClass({
              configManager: this.configManager,
              languageManager: this.languageManager,
              workspaceScopeUri: uriToUse,
            });
          } catch (error) {
            logger.error(
              logger.handleError(
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
      logger.error(`Failed to load custom providers: ${error}`);
      return [];
    }
  }
}
