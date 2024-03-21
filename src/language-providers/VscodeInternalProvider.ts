import * as vscode from 'vscode';
import { ITemplateFunction, Template } from '../typings/types';
import { LanguageProvider } from './LanguageProvider';
import { LanguageManager } from '@/languages/LanguageManager';
import { ExtendedLanguageProviderOptions } from './types';

export class VscodeInternalProvider extends LanguageProvider {
  private languageManager: LanguageManager;
  public languages: string[] = [];
  comments: vscode.CommentRule = { lineComment: '//', blockComment: ['/*', '*/'] };

  constructor(options: ExtendedLanguageProviderOptions) {
    super(options);
    const { languageManager } = options;
    this.languageManager = languageManager;
  }

  public getBlockCommentFromVscode = async (languageId: string) => {
    this.languages = [languageId];
    const comments = await this.languageManager?.useLanguage(languageId).getComments();
    this.comments = comments;
  };

  public override getTemplate(
    tpl: ITemplateFunction,
    variables: { [key: string]: string },
    useJSDocStyle: boolean = false,
  ): Template {
    const { blockCommentStart, blockCommentEnd } = this.getBlockComment();

    const config = this.configManager.getConfiguration();
    const { fileheader } = config;
    let longestLabelLength = 0;
    for (const item of fileheader) {
      const { label } = item;
      longestLabelLength = Math.max(longestLabelLength, label.length);
    }

    const lines = fileheader.map((item) => {
      const { label, wholeLine = false } = item;
      const value = item.value;
      longestLabelLength = Math.max(longestLabelLength, label.length);
      console.log('🚀 ~ file: VscodeInternalProvider.ts:44 ~ variables:', variables);
      // 使用正则表达式替换 {{变量}} 格式的字符串
      const valueParts = value.split(/(\{\{\w+\}\})/g).map((part) => {
        return part.replace(/\{\{(\w+)\}\}/, (_match, p1) => {
          console.log('🚀 ~ file: VscodeInternalProvider.ts:47 ~ p1:', p1);
          // 如果不包含 TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER
          // 则是生成真实模板过程
          // if (!variables['__isProxy']) {
          //   // 判断是否在 customVariables 里，如果在，则把变量替换为 customVariables 里的值
          //   const { customVariables } = this.generateWildcardAccessVariables();
          //   const customVariable = customVariables.find((variable) => variable.name === p1);
          //   // 如果值还引用内置变量，则继续替换为内置变量的值
          //   if (customVariable) {
          //     if (/\{\{(\w+)\}\}/.test(customVariable.value)) {
          //       return customVariable.value.replace(
          //         /\{\{(\w+)\}\}/,
          //         (_match, p1) => variables[p1] || '',
          //       );
          //     } else {
          //       return customVariable.value;
          //     }
          //   }
          // }
          return variables[p1] || '';
        });
      });
      return this.generateLine(tpl, label, valueParts, longestLabelLength, wholeLine);
    });

    if (this.comments && this.comments.blockComment && this.comments.blockComment.length) {
      const combinedLines = lines.reduce((prev, curr) => tpl`${prev}${curr}`, tpl``);
      return tpl`${blockCommentStart}${useJSDocStyle ? '*' : ''}\n${combinedLines}${blockCommentEnd}`;
    }
    const combinedLines = lines.reduce(
      (prev, curr) => tpl`${prev}${blockCommentStart}${curr}`,
      tpl``,
    );
    return tpl`${blockCommentStart}\n${combinedLines}${blockCommentEnd}`;
  }
}
