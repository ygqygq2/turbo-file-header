import { IFileheaderVariables, ITemplateFunction } from '@/typings/types';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';

export class CustomLanguageProvider extends FileheaderLanguageProvider {
  /**
   * @type {string[]}
   */
  languages = ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'];

  /**
   * @type {string=} the language block comment start string.
   * this is for future feature: support detect old custom template when custom template changes
   */
  blockCommentStart = '/*';

  /**
   * @type {string=}
   */
  blockCommentEnd = '*/';

  /**
   * get your template when document language matched
   * @param {ITemplateFunction} tpl template function, it is a tagged function, support nested interpolation
   * @param {FileheaderVariable} variables template variables
   * @returns {Template}
   */
  getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    // prettier-ignore
    return tpl
`/*
 * @author        ${variables.authorName} <${variables.authorEmail}>
 * @date          ${variables.ctime}
 * @lastModified  ${variables.mtime}
 * Copyright © ${variables.companyName} All rights reserved
 */`;
  }
}
