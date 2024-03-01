import vscode from 'vscode';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { LanguageProvider } from './LanguageProvider';

export class HTMLProvider extends LanguageProvider {
  readonly languages: string[] = ['html', 'xml'];

  readonly comments: vscode.CommentRule = { blockComment: ['<!--', '-->'] };
  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    const { blockCommentStart, blockCommentEnd } = this.getBlockComment();

    const authorEmailPart = variables.authorEmail && `<${variables.authorEmail}>`;
    const authorLine =
      variables.authorName && `author:        ${variables.authorName} ${authorEmailPart}\n`;
    const ctimeLine = variables.birthtime && `date:          ${variables.birthtime}\n`;
    const lastModifiedLine = variables.mtime && `lastModified  ${variables.mtime}\n`;
    const companyNameLine =
      variables.companyName && `Copyright©${variables.companyName} All rights reserved\n`;

    return tpl`${blockCommentStart}\n${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}${blockCommentEnd}`;

    // like this:
    /*
    <!--
    author:        ${variables.authorName} <${variables.authorEmail}>
    date:          ${variables.birthtime}
    lastModified:  ${variables.mtime}
    Copyright©${variables.companyName} All rights reserved
    -->
    */
  }
}
