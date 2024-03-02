import * as vscode from 'vscode';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { LanguageProvider } from './LanguageProvider';

export class CSSProvider extends LanguageProvider {
  readonly languages: string[] = ['css', 'less', 'scss'];
  readonly comments: vscode.CommentRule = { blockComment: ['/*', '*/'] };

  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    const { blockCommentStart, blockCommentEnd } = this.getBlockComment();

    const hasAuthor = variables.authorName;
    const authorEmailPart = !!variables.authorEmail && tpl`<${variables.authorEmail}>`;
    const authorLine =
      hasAuthor && tpl` * @author        ${variables.authorName} ${authorEmailPart}\n`;
    const ctimeLine = variables.birthtime && tpl` * @date          ${variables.birthtime}\n`;
    const lastModifiedLine = variables.mtime && tpl` * @lastModified  ${variables.mtime}\n`;
    const companyNameLine =
      variables.companyName && tpl`\n * Copyright ©${variables.companyName} All rights reserved\n`;

    return tpl`${blockCommentStart}\n${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}${blockCommentEnd}`;

    // like this:
    /*
     * @author        ${variables.authorName} <${variables.authorEmail}>
     * @date          ${variables.birthtime}
     * @lastModified  ${variables.mtime}
     * Copyright ©${variables.companyName} All rights reserved
     */
  }
}
