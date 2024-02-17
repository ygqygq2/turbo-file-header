import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';

export class CSSLanguageProvider extends FileheaderLanguageProvider {
  readonly languages: string[] = ['css', 'less', 'scss'];
  blockCommentStart: string = '/*';
  blockCommentEnd: string = '*/';

  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    const hasAuthor = variables.authorName;
    const authorEmailPart = !!variables.authorEmail && tpl`<${variables.authorEmail}>`;

    const authorLine =
      hasAuthor && tpl`\n * @author        ${variables.authorName} ${authorEmailPart}`;

    const ctimeLine = variables.ctime && tpl`\n * @date          ${variables.ctime}`;

    const lastModifiedLine = variables.mtime && tpl`\n * @lastModified  ${variables.mtime}`;

    const companyNameLine =
      variables.companyName && tpl`\n * Copyright © ${variables.companyName} All rights reserved`;

    // prettier-ignore
    return tpl
`/*${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}
 */`;

    // like this:
    /*
     * @author        ${variables.authorName} <${variables.authorEmail}>
     * @date          ${variables.ctime}
     * @lastModified  ${variables.mtime}
     * Copyright © ${variables.companyName} All rights reserved
     */
  }
}
