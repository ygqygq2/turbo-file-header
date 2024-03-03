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
    // 为每个 provider 生成一个类
    const languages = provider?.languages || ['javascript'];
    const startLineOffsetConfig = provider?.startLineOffset || 0;
    const languageId = languages[0];
    const template = provider?.template || '';

    return class extends LanguageProvider {
      private languageManager: LanguageManager;
      comments: vscode.CommentRule = { lineComment: '//', blockComment: ['/**', '*/'] };
      public readonly languages = languages;
      readonly startLineOffset = startLineOffsetConfig;

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
  };

  public generateProviderClasses = async () => {
    const config = await this.getCustomProvidersConfig();
    if (!config || !config.providers) {
      output.info('No custom providers.');
      return;
    }
    const dynamicProviderClasses = config.providers.map((provider: Provider) => {
      const ProviderClass = this.createProviderClass(provider);
      return { name: provider.name, class: ProviderClass };
    });

    return dynamicProviderClasses;
  };
}
