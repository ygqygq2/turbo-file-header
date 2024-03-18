import * as vscode from 'vscode';
import {
  Config,
  IFileheaderVariables,
  ITemplateFunction,
  Template,
  TemplateInterpolation,
} from '../typings/types';
import { LanguageProvider } from './LanguageProvider';
import { LanguageManager } from '@/languages/LanguageManager';

export class VscodeInternalProvider extends LanguageProvider {
  private languageManager: LanguageManager;
  public languages: string[] = [];
  comments: vscode.CommentRule = { lineComment: '//', blockComment: ['/*', '*/'] };

  constructor(languageManager: LanguageManager) {
    super();
    this.languageManager = languageManager;
  }

  public getBlockCommentFromVscode = async (languageId: string) => {
    this.languages = [languageId];
    const comments = await this.languageManager?.useLanguage(languageId).getComments();
    this.comments = comments;
  };

  override getTemplate(
    tpl: ITemplateFunction,
    variables: IFileheaderVariables,
    useJSDocStyle: boolean = false,
  ): Template {
    const { blockCommentStart, blockCommentEnd } = this.getBlockComment();

    const labels = ['file', 'description', 'author', 'createTime', 'lastModified'];
    const longestLabelLength = Math.max(...labels.map((label) => label.length));

    const generateLine = (
      label: string,
      ...values: (string | TemplateInterpolation)[]
    ): Template => {
      if (values.length === 0) {
        return tpl``;
      }
      const spaces = ' '.repeat(longestLabelLength - label.length);
      const combinedValues = values.reduce((prev, curr) => tpl`${prev} ${curr}`, tpl``);
      return tpl` * @${label}${spaces}    ${combinedValues}\n`;
    };

    const authorEmailPart = variables.authorEmail ? `<${variables.authorEmail}>` : '';

    const lines = [
      generateLine('file', variables.filePath),
      generateLine('description', ''),
      generateLine('author', variables.authorName, authorEmailPart),
      generateLine('createTime', variables.birthtime),
      generateLine('lastModified', variables.mtime),
      tpl` * Copyright ©${variables.companyName} All rights reserved\n`,
    ];

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
