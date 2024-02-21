import vscode from 'vscode';
import { evaluateTemplate, getTaggedTemplateInputs } from '../utils/utils';
import { IFileheaderVariables, ITemplateFunction, Template } from '../typings/types';
import {
  TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER,
  TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER,
  WILDCARD_ACCESS_VARIABLES,
} from '../constants';

export abstract class LanguageProvider {
  /**
   *
   * @param workspaceScopeUri the custom loader workspace folder uri
   */
  constructor(public readonly workspaceScopeUri?: vscode.Uri) {
    this.calculateVariableAccessInfo();
  }

  public get isCustomProvider() {
    return !!this.workspaceScopeUri;
  }

  abstract readonly languages: string[];

  readonly startLineOffset = 0;

  abstract blockCommentStart: string;
  abstract blockCommentEnd: string;

  protected abstract getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables): Template;

  private getTemplateInternal(variables: IFileheaderVariables) {
    return this.getTemplate(getTaggedTemplateInputs, variables);
  }

  public getFileheader(variables: IFileheaderVariables): string {
    const { strings: _strings, interpolations } = this.getTemplateInternal(variables);
    const strings = Array.from(_strings);

    return evaluateTemplate(strings, interpolations);
  }

  public getOriginFileheaderRegExp(eol: vscode.EndOfLine): RegExp {
    const template = this.getTemplateInternal(WILDCARD_ACCESS_VARIABLES as IFileheaderVariables);

    const templateValue = evaluateTemplate(template.strings, template.interpolations, true);
    const pattern = templateValue
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

      // user custom template may have `\r\n`, for example, read a file in Windows.
      // We should normalize it to `\n`
      .replace(/\r\n/g, '\n')
      .replace(new RegExp(`${TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER.start}`, 'g'), '(?:')
      .replace(new RegExp(`${TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER.end}`, 'g'), ')?')
      .replace(
        new RegExp(
          `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_(\\w+)_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
          'g',
        ),
        '(?<$1>.*)',
      )
      .replace(/\n/g, eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n');

    return new RegExp(pattern, 'm');
  }

  public getSourcefileWithoutFileheader(document: vscode.TextDocument): string {
    const regexp = new RegExp(this.getOriginFileheaderRegExp(document.eol), 'mg');
    const source = document.getText();
    return source.replace(regexp, '');
  }

  public readonly accessVariableFields = new Set<keyof IFileheaderVariables>();
  private calculateVariableAccessInfo() {
    const addVariableAccess = (p: string) =>
      this.accessVariableFields.add(p as keyof IFileheaderVariables);

    const proxyVariables = new Proxy(WILDCARD_ACCESS_VARIABLES, {
      get(target, p, _receiver) {
        addVariableAccess(p as string);
        return Reflect.get(target, p);
      },
    });

    this.getTemplateInternal(proxyVariables);
  }
}
