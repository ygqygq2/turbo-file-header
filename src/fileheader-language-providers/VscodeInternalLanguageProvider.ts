import { Configuration } from '@/utils/configuration';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';
import { Parser } from '@/utils/parser';
import * as vscode from 'vscode';

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
      hasAuthor && tpl`\n * @author        ${variables.authorName} ${authorEmailPart}`;

    const ctimeLine = variables.ctime && tpl`\n * @date          ${variables.ctime}`;

    const lastModifiedLine = variables.mtime && tpl`\n * @lastModified  ${variables.mtime}`;

    const companyNameLine =
      variables.companyName && tpl`\n * Copyright © ${variables.companyName} All rights reserved`;

    vscode.window.showInformationMessage(
      '🚀 ~ file: VscodeInternalLanguageProvider.ts:46 ~ blockCommentStart:',
      this.blockCommentStart,
    );
    // prettier-ignore
    return tpl `${this.blockCommentStart}\n${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}\n${this.blockCommentEnd}`;

    // like this:
    /**
     * @author        ${variables.authorName} <${variables.authorEmail}>
     * @date          ${variables.ctime}
     * @lastModified  ${variables.mtime}
     * Copyright © ${variables.companyName} All rights reserved
     */
  }
}
