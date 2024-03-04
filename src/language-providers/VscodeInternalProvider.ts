import * as vscode from 'vscode';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { LanguageProvider } from './LanguageProvider';
import { LanguageManager } from '@/languages/LanguageManager';

export class VscodeInternalProvider extends LanguageProvider {
  private languageManager: LanguageManager;
  public readonly languages: string[] = [];
  comments: vscode.CommentRule = { lineComment: '//', blockComment: ['/**', '*/'] };

  constructor(languageManager: LanguageManager) {
    super();
    this.languageManager = languageManager;
  }

  public getBlockCommentFromVscode = async (languageId: string) => {
    const comments = await this.languageManager?.useLanguage(languageId).getComments();
    this.comments = comments;
  };

  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    const { blockCommentStart, blockCommentEnd } = this.getBlockComment();

    const hasAuthor = variables.authorName;
    const authorEmailPart = !!variables.authorEmail && tpl`<${variables.authorEmail}>`;
    const authorLine =
      hasAuthor && tpl` * @author        ${variables.authorName} ${authorEmailPart}\n`;
    const ctimeLine = variables.birthtime && tpl` * @date          ${variables.birthtime}\n`;
    const lastModifiedLine = variables.mtime && tpl` * @lastModified  ${variables.mtime}\n`;
    const companyNameLine =
      variables.companyName && tpl` * Copyright ©${variables.companyName} All rights reserved\n`;

    if (this.comments && this.comments.blockComment && this.comments.blockComment.length) {
      return tpl`${blockCommentStart}\n${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}${blockCommentEnd}`;
    }
    return tpl`${blockCommentStart}\n${blockCommentStart}${authorLine}${blockCommentStart}${ctimeLine}${blockCommentStart}${lastModifiedLine}${blockCommentStart}${companyNameLine} ${blockCommentEnd}`;

    // like this:
    /**
     * @author        ${variables.authorName} <${variables.authorEmail}>
     * @date          ${variables.birthtime}
     * @lastModified  ${variables.mtime}
     * Copyright ©${variables.companyName} All rights reserved
     */
  }
}
