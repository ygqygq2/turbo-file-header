import upath from 'upath';
import { IFileheaderVariables, ITemplateFunction } from '../typings/types';
import { FileheaderLanguageProvider } from './FileheaderLanguageProvider';

export class VueTurboFileHeadervider extends FileheaderLanguageProvider {
  readonly languages: string[] = ['vue'];

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

    const componentLine =
      variables.fileName && tpl`\ncomponent:     ${upath.trimExt(variables.fileName)}`;
    // prettier-ignore
    return tpl
`<!--${authorLine}${ctimeLine}${lastModifiedLine}${componentLine}${companyNameLine}
-->`;

    // like this:
    /*
    <!--
    author:        ${variables.authorName} <${variables.authorEmail}>
    date:          ${variables.ctime}
    lastModified:  ${variables.mtime}
    component: ${upath.trimExt(variables.fileName)}
    Copyright © ${variables.companyName} All rights reserved
    -->
    */
  }
}
