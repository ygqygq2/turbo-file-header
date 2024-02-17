import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';

export class HTMLTurboFileHeadervider extends FileheaderLanguageProvider {
  readonly languages: string[] = ['html', 'xml'];

  blockCommentStart: string = '<!--';
  blockCommentEnd: string = '-->';

  override getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables) {
    const authorEmailPart = variables.authorEmail && `<${variables.authorEmail}>`;
    const authorLine =
      variables.authorName && `\nauthor:        ${variables.authorName} ${authorEmailPart}`;
    const ctimeLine = variables.ctime && `\ndate:          ${variables.ctime}`;
    const lastModifiedLine = variables.mtime && `\nlastModified  ${variables.mtime}`;
    const companyNameLine =
      variables.companyName && `\nCopyright © ${variables.companyName} All rights reserved`;

    // prettier-ignore
    return tpl
`<!--${authorLine}${ctimeLine}${lastModifiedLine}${companyNameLine}
-->`;

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
