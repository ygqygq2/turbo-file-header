import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import * as vscode from 'vscode';
import Handlebars from 'handlebars';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';
import { ConfigYaml, IFileheaderVariables, ITemplateFunction, Provider } from '@/typings/types';
import { LanguageProvider } from './LanguageProvider';
import { CUSTOM_CONFIG_FILE_NAME } from '@/constants';
import output from '@/error/output';
import { LanguageManager } from '@/languages/LanguageManager';

interface ProviderDyClass {
  name: string;
  providerClass: new (languageManager: LanguageManager, uri: vscode.Uri) => LanguageProvider;
}

export class GenerateCustomProviderClasses {
  constructor() {}

  private getCustomProvidersConfig = async (): Promise<ConfigYaml | undefined> => {
    const activeWorkspace = await getActiveDocumentWorkspace();
    if (!activeWorkspace) {
      return;
    }

    const configPath = path.join(activeWorkspace.uri.fsPath, '.vscode', CUSTOM_CONFIG_FILE_NAME);
    if (!fs.existsSync(configPath)) {
      return;
    }

    // 读取 yaml 配置
    const configContent = fs.readFileSync(configPath, 'utf8');
    const config: ConfigYaml = YAML.parse(configContent);
    return config;
  };

  private createProviderClass = (provider: Provider) => {
    // 为每个 provider 中的每个 language 生成一个类
    const classes: ProviderDyClass[] = [];
    const { languages = ['javascript'], template = '', startLineOffset = 0 } = provider;

    languages.forEach((languageId) => {
      const className = `${provider.name}_${languageId}`;
      const ProviderClass = class extends LanguageProvider {
        private languageManager: LanguageManager;
        comments: vscode.CommentRule = { lineComment: '//', blockComment: ['/**', '*/'] };
        public readonly languages = [languageId];
        readonly startLineOffset = startLineOffset;

        constructor(languageManager: LanguageManager, workspaceScopeUri?: vscode.Uri | undefined) {
          super(workspaceScopeUri);
          this.languageManager = languageManager;
        }

        public getBlockCommentFromVscode = async () => {
          const comments = await this.languageManager?.useLanguage(languageId).getComments();
          this.comments = comments;
        };

        override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
          const { blockCommentStart, blockCommentEnd } = this.getBlockComment();

          const compiledTemplate = Handlebars.compile(template);
          const result = compiledTemplate(variables);
          if (this.comments && this.comments.blockComment && this.comments.blockComment.length) {
            return tpl`${blockCommentStart}\n${result}${blockCommentEnd}`;
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
    const config = await this.getCustomProvidersConfig();
    if (!config || !config.providers) {
      output.info('No custom providers.');
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
