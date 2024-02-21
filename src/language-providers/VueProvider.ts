import upath from 'upath';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { LanguageProvider } from './LanguageProvider';

export class VueProvider extends LanguageProvider {
  readonly languages: string[] = ['vue'];

  blockCommentStart: string = '<!--';
  blockCommentEnd: string = '-->';

  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    const authorEmailPart = variables.authorEmail && `<${variables.authorEmail}>`;
    const authorLine =
      variables.authorName && `author:        ${variables.authorName} ${authorEmailPart}\n`;
    const ctimeLine = variables.ctime && `date:          ${variables.ctime}\n`;
    const lastModifiedLine = variables.mtime && `lastModified  ${variables.mtime}\n`;
    const companyNameLine =
      variables.companyName && `Copyright © ${variables.companyName} All rights reserved\n`;
    const componentLine =
      variables.fileName && tpl`component:     ${upath.trimExt(variables.fileName)}\n`;

    return tpl`${this.blockCommentStart}\n${authorLine}${ctimeLine}${lastModifiedLine}${componentLine}${companyNameLine}${this.blockCommentEnd}`;

    // like this:
    /*
    <!--
    author:        ${variables.authorName} <${variables.authorEmail}>
    date:          ${variables.ctime}
    lastModified:  ${variables.mtime}
    component: ${upath.trimExt(variables.fileName)}
    Copyright © ${variables.companyName} All rights reserved
    -->
    */
  }
}
