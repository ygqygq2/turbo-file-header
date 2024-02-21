import { languageManager } from '@/extension';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';

export class VscodeInternalLanguageProvider extends FileheaderLanguageProvider {
  readonly languages: string[] = [];
  private _blockCommentStart: string = '';
  private _blockCommentEnd: string = '';

  public getBlockComment = async (languageId: string) => {
    const comments = await languageManager.getAvailableCommentRules(languageId);
    if (!comments.blockComments || !comments.blockComments.length) {
      this._blockCommentStart = '';
      this._blockCommentEnd = '';
      return;
    }
    this._blockCommentStart = comments.blockComments[0][0];
    this._blockCommentEnd = comments.blockComments[0][1];
  };

  get blockCommentStart(): string {
    return this._blockCommentStart;
  }

  get blockCommentEnd(): string {
    return this._blockCommentEnd;
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
