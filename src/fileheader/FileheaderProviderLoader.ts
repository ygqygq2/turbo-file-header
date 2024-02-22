import * as vscode from 'vscode';
import output from '@/error/output';
import { LanguageProvider, internalProviders } from '@/language-providers';
import { GenerateCustomProviderClasses } from '../language-providers/GenerateCustomProviderClasses';
import { errorHandler } from '@/extension';
import { CustomError, ErrorCode } from '@/error';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';
import { CUSTOM_CONFIG_FILE_NAME } from '@/constants';

export class FileheaderProviderLoader {
  private generateCustomProviderClasses: GenerateCustomProviderClasses;

  constructor(generateCustomProviderClasses: GenerateCustomProviderClasses) {
    this.generateCustomProviderClasses = generateCustomProviderClasses;
  }

  public async loadProviders(): Promise<LanguageProvider[]> {
    const customProviders = await this.loadCustomProvers();

    return [...internalProviders, ...customProviders];
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
            return new ProviderClass(uriToUse);
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
      return providers; // 这里的 providers 已经被断言为 LanguageProvider[] 类型
    } catch (error) {
      output.error(`Failed to load custom providers: ${error}`);
      return [];
    }
  }
}
