import { Configuration } from '@/utils/configuration';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';
import { Parser } from '@/utils/parser';

export class VscodeInternalLanguageProvider extends FileheaderLanguageProvider {
  private parser: Parser;
  private configuration: Configuration;
  constructor() {
    super();
    this.configuration = new Configuration();
    this.parser = new Parser(this.configuration);
  }
  readonly languages: string[] = [];

  public getBlockComment = (languageId: string) => {
    this.parser.getBlockComment(languageId);
  };

  get blockCommentStart(): string {
    if (this.parser) {
      return this.parser.blockCommentStart;
    } else {
      return '';
    }
  }

  get blockCommentEnd(): string {
    if (this.parser) {
      return this.parser.blockCommentEnd;
    } else {
      return '';
    }
  }

  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
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
