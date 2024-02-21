import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { LanguageProvider } from './LanguageProvider';

export class HTMLProvider extends LanguageProvider {
  readonly languages: string[] = ['html', 'xml'];

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

    return tpl`${this.blockCommentStart}\n${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}${this.blockCommentEnd}`;

    // like this:
    /*
    <!--
    author:        ${variables.authorName} <${variables.authorEmail}>
    date:          ${variables.ctime}
    lastModified:  ${variables.mtime}
    Copyright © ${variables.companyName} All rights reserved
    -->
    */
  }
}
