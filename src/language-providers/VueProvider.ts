import * as vscode from 'vscode';
import upath from 'upath';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { LanguageProvider } from './LanguageProvider';

export class VueProvider extends LanguageProvider {
  readonly languages: string[] = ['vue'];

  readonly comments: vscode.CommentRule = { blockComment: ['<!--', '-->'] };
  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    const { blockCommentStart, blockCommentEnd } = this.getBlockComment();

    const authorEmailPart = variables.authorEmail && `<${variables.authorEmail}>`;
    const authorLine =
      variables.authorName && `author:        ${variables.authorName} ${authorEmailPart}\n`;
    const ctimeLine = variables.birthtime && `date:          ${variables.birthtime}\n`;
    const lastModifiedLine = variables.mtime && `lastModified  ${variables.mtime}\n`;
    const companyNameLine =
      variables.companyName && `Copyright ©${variables.companyName} All rights reserved\n`;
    const componentLine =
      variables.fileName && tpl`component:     ${upath.trimExt(variables.fileName)}\n`;

    return tpl`${blockCommentStart}\n${authorLine}${ctimeLine}${lastModifiedLine}${componentLine}${companyNameLine}${blockCommentEnd}`;

    // like this:
    /*
    <!--
    author:        ${variables.authorName} <${variables.authorEmail}>
    date:          ${variables.birthtime}
    lastModified:  ${variables.mtime}
    component: ${upath.trimExt(variables.fileName)}
    Copyright ©${variables.companyName} All rights reserved
    -->
    */
  }
}
