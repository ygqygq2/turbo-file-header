import { Configuration } from '@/utils/configuration';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';
import { Parser } from '@/utils/parser';
export class VscodeInternalLanguageProvider extends FileheaderLanguageProvider {
  private configuration: Configuration = new Configuration();
  private parser: Parser = new Parser(this.configuration);

  readonly languages: string[] = [];

  blockCommentStart: string = this.parser.blockCommentStart;
  blockCommentEnd: string = this.parser.blockCommentEnd;

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
`/**${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}
 */`;

    // like this:
    /**
     * @author        ${variables.authorName} <${variables.authorEmail}>
     * @date          ${variables.ctime}
     * @lastModified  ${variables.mtime}
     * Copyright © ${variables.companyName} All rights reserved
     */
  }
}
