import path from 'path';
import fs from 'fs';
import YAML from 'yaml';
import * as vscode from 'vscode';
import Handlebars from 'handlebars';
import { languageManager } from '@/extension';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';
import { ConfigYaml, IFileheaderVariables, ITemplateFunction, Provider } from '@/typings/types';
import { LanguageProvider } from './LanguageProvider';
import { CUSTOM_CONFIG_FILE_NAME } from '@/constants';

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
    const languageId = languages[0];
    const template = provider?.template || '';

    return class extends LanguageProvider {
      private comments: vscode.CommentRule | undefined;
      public languages = languages;
      public blockCommentStart: string = '/*';
      public blockCommentEnd: string = '*/';

      constructor(workspaceScopeUri?: vscode.Uri | undefined) {
        super(workspaceScopeUri);
      }

      public getBlockComment = async () => {
        const comments = await languageManager.useLanguage(languageId).getComments();
        this.comments = comments;
      };

      override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
        // 确保 this.comments 和 this.comments.blockComments 都不是 undefined
        if (this.comments && this.comments.blockComment && this.comments.blockComment.length) {
          // 当存在块注释时使用块注释
          this.blockCommentStart = this.comments.blockComment[0];
          this.blockCommentEnd = this.comments.blockComment[1];
        } else if (this.comments && this.comments.lineComment) {
          // 当不存在块注释但存在行注释时，使用行注释作为块注释的开始和结束
          this.blockCommentStart = this.comments.lineComment;
          this.blockCommentEnd = this.comments.lineComment;
        }

        const compiledTemplate = Handlebars.compile(template);
        const result = compiledTemplate(variables);

        return tpl`${this.blockCommentStart}\n${result}${this.blockCommentEnd}`;
      }
    };
  };

  public generateProviderClasses = async () => {
    const config = await this.getCustomProvidersConfig();
    if (!config || !config.providers) {
      console.error('No providers found in the configuration.');
      return;
    }
    const dynamicProviderClasses = config.providers.map((provider: Provider) => {
      const ProviderClass = this.createProviderClass(provider);
      return { name: provider.name, class: ProviderClass };
    });

    return dynamicProviderClasses;
  };
}
