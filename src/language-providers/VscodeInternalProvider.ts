import * as vscode from 'vscode';
import { languageManager } from '@/extension';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { LanguageProvider } from './LanguageProvider';

export class VscodeInternalProvider extends LanguageProvider {
  readonly languages: string[] = [];
  private comments: vscode.CommentRule | undefined;
  public blockCommentStart: string = '';
  public blockCommentEnd: string = '';

  public getBlockComment = async (languageId: string) => {
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

    const hasAuthor = variables.authorName;
    const authorEmailPart = !!variables.authorEmail && tpl`<${variables.authorEmail}>`;
    const authorLine =
      hasAuthor && tpl` * @author        ${variables.authorName} ${authorEmailPart}\n`;
    const ctimeLine = variables.ctime && tpl` * @date          ${variables.ctime}\n`;
    const lastModifiedLine = variables.mtime && tpl` * @lastModified  ${variables.mtime}\n`;
    const companyNameLine =
      variables.companyName && tpl` * Copyright © ${variables.companyName} All rights reserved\n`;

    return tpl`${this.blockCommentStart}\n${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}${this.blockCommentEnd}`;

    // like this:
    /**
     * @author        ${variables.authorName} <${variables.authorEmail}>
     * @date          ${variables.ctime}
     * @lastModified  ${variables.mtime}
     * Copyright © ${variables.companyName} All rights reserved
     */
  }
}
