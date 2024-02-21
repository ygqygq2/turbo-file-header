import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { LanguageProvider } from './LanguageProvider';
export class JavaProvider extends LanguageProvider {
  readonly languages: string[] = ['java'];

  blockCommentStart: string = '/**';
  blockCommentEnd: string = '*/';

  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    const hasAuthor = variables.authorName;
    const authorLine = hasAuthor && tpl` * @author        ${variables.authorName}\n`;
    const ctimeLine = variables.ctime && tpl` * @date          ${variables.ctime}\n`;
    const lastModifiedLine = variables.mtime && tpl` * @lastModified  ${variables.mtime}\n`;
    const companyNameLine =
      variables.companyName && tpl` * Copyright © ${variables.companyName} All rights reserved\n`;

    return tpl`${this.blockCommentStart}\n${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}${this.blockCommentEnd}`;

    // like this:
    /**
     * @author        ${variables.authorName}
     * @date          ${variables.ctime}
     * @lastModified  ${variables.mtime}
     * Copyright © ${variables.companyName} All rights reserved
     */
  }
}
