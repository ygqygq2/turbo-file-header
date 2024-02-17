import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';
export class JavaTurboFileHeadervider extends FileheaderLanguageProvider {
  readonly languages: string[] = ['java'];

  blockCommentStart: string = '/**';
  blockCommentEnd: string = '*/';

  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    const hasAuthor = variables.authorName;

    const authorLine = hasAuthor && tpl`\n * @author        ${variables.authorName}`;

    const ctimeLine = variables.ctime && tpl`\n * @date          ${variables.ctime}`;

    const lastModifiedLine = variables.mtime && tpl`\n * @lastModified  ${variables.mtime}`;

    const companyNameLine =
      variables.companyName && tpl`\n * Copyright © ${variables.companyName} All rights reserved`;

    // prettier-ignore
    return tpl
`/**${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}
 */`;

    // like this:
    /**
     * @author        ${variables.authorName}
     * @date          ${variables.ctime}
     * @lastModified  ${variables.mtime}
     * Copyright © ${variables.companyName} All rights reserved
     */
  }
}
