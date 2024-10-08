import Handlebars from 'handlebars';
import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { logger } from '@/extension';
import { LanguageManager } from '@/languages/LanguageManager';
import { IFileheaderVariables, ITemplateFunction, Provider } from '@/typings/types';
import { getBlockComment } from '@/utils/vscode-utils';

import { ConfigReader } from '../configuration/ConfigReader';
import { LanguageProvider } from './LanguageProvider';
import { ExtendedLanguageProviderOptions } from './types';

interface ProviderDyClass {
  name: string;
  providerClass: new ({
    configManager,
    languageManager,
    workspaceScopeUri,
  }: {
    configManager: ConfigManager;
    languageManager: LanguageManager;
    workspaceScopeUri: vscode.Uri;
  }) => LanguageProvider;
}

export class GenerateCustomProviderClasses {
  private configReader: ConfigReader;

  constructor(configReader: ConfigReader) {
    this.configReader = configReader;
  }

  private createProviderClass = (provider: Provider) => {
    // 为每个 provider 中的每个 language 生成一个类
    const classes: ProviderDyClass[] = [];
    const { languages = ['javascript'], template = '', startLineOffset = 0 } = provider;

    languages.forEach((languageId) => {
      const className = `${provider.name}_${languageId}`;
      const ProviderClass = class extends LanguageProvider {
        private languageManager: LanguageManager;
        comments: vscode.CommentRule = { lineComment: '//', blockComment: ['/*', '*/'] };
        public readonly languages = [languageId];
        readonly startLineOffset = startLineOffset;

        constructor(options: ExtendedLanguageProviderOptions) {
          super(options);
          const { languageManager } = options;
          this.languageManager = languageManager;
          // 这里异步的，但是初始化时很早，所以它会在使用时已经初始化完成
          this.initialize(languageId);
        }

        private initialize = async (languageId: string) => {
          await this.getBlockCommentFromVscode(languageId);
        };

        public getBlockCommentFromVscode = async (languageId: string) => {
          const comments = await this.languageManager?.useLanguage(languageId).getComments();
          this.comments = comments;
        };

        override getTemplate(
          tpl: ITemplateFunction,
          variables: IFileheaderVariables,
          useJSDocStyle: boolean = false,
        ) {
          const { blockCommentStart, blockCommentEnd } = getBlockComment(this.comments);

          const compiledTemplate = Handlebars.compile(template);
          const result = compiledTemplate(variables);
          if (this.comments && this.comments.blockComment && this.comments.blockComment.length) {
            return tpl`${blockCommentStart}${useJSDocStyle ? '*' : ''}\n${result}${blockCommentEnd}`;
          }
          const resultLines = result.split('\n');
          const commentedResult = resultLines.map((line) => blockCommentStart + line).join('\n');
          return tpl`${blockCommentStart}\n${commentedResult}${blockCommentEnd}`;
        }
      };

      classes.push({ name: className, providerClass: ProviderClass });
    });

    return classes;
  };

  public generateProviderClasses = async () => {
    const config = await this.configReader?.getConfigYaml();
    if (!config || !config.providers) {
      logger.info('No custom providers.');
      return;
    }
    const dynamicProviderClasses = config.providers.flatMap((provider: Provider) => {
      return this.createProviderClass(provider).map(({ name, providerClass: ProviderClass }) => ({
        name,
        providerClass: ProviderClass,
      }));
    });

    return dynamicProviderClasses;
  };
}
