import * as vscode from 'vscode';
import { ITemplateFunction, Template, TemplateInterpolation } from '../typings/types';
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
    variables: any,
    useJSDocStyle: boolean = false,
  ): Template {
    const { blockCommentStart, blockCommentEnd } = this.getBlockComment();

    const config = this.configManager.getConfiguration();
    const { fileheader } = config;
    let longestLabelLength = 0;
    const lines = fileheader.map((item) => {
      const { label, wholeLine } = item;
      longestLabelLength = Math.max(longestLabelLength, label.length);
      const value = variables[label];
      return this.generateLine(tpl, label, value, longestLabelLength, wholeLine);
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
