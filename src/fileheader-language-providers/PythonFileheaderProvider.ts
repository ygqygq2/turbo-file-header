import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';

export class PythonTurboFileHeadervider extends FileheaderLanguageProvider {
  readonly languages: string[] = ['python'];

  blockCommentStart: string = "'''";
  blockCommentEnd: string = "'''";

  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    const authorEmailPart = variables.authorEmail && `<${variables.authorEmail}>`;
    const authorLine =
      variables.authorName && `\nauthor:        ${variables.authorName} ${authorEmailPart}`;
    const ctimeLine = variables.ctime && `\ndate:          ${variables.ctime}`;
    const lastModifiedLine = variables.mtime && `\nlastModified:  ${variables.mtime}`;
    const companyNameLine =
      variables.companyName && `\nCopyright © ${variables.companyName} All rights reserved`;

    // prettier-ignore
    return tpl
`'''${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}
'''`;
    /*
    '''
    author:        ${variables.authorName} <${variables.authorEmail}>
    date:          ${variables.ctime}
    lastModified:  ${variables.mtime}
    Copyright © ${variables.companyName} All rights reserved
    '''
     */
  }
}
