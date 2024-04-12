import vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { escapeRegexString } from '@/utils/str';
import { isCommentLine, updateBlockCommentState } from '@/utils/vscode-utils';

import {
  TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER,
  TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER,
  WILDCARD_ACCESS_VARIABLES,
} from '../constants';
import {
  IFileheaderVariables,
  ITemplateFunction,
  Template,
  TemplateInterpolation,
} from '../typings/types';
import { evaluateTemplate, getTaggedTemplateInputs, hasShebang } from '../utils/utils';
import { LanguageProviderOptions } from './types';

export abstract class LanguageProvider {
  public abstract readonly languages: string[];
  public abstract comments: vscode.CommentRule;
  protected configManager: ConfigManager;
  public readonly workspaceScopeUri?: vscode.Uri;
  public readonly accessVariableFields = new Set<string>();

  /**
   *
   * @param workspaceScopeUri the custom loader workspace folder uri
   */
  constructor(options: LanguageProviderOptions) {
    this.configManager = options.configManager;
    this.workspaceScopeUri = options.workspaceScopeUri;
    this.calculateVariableAccessInfo();
  }

  // 文件头偏移量，即文件头从这行开始插入或更新
  readonly startLineOffset: number = 0;

  public get isCustomProvider() {
    return !!this.workspaceScopeUri;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getTemplateInternal(variables: any, useJSDocStyle: boolean = false) {
    return this.getTemplate(getTaggedTemplateInputs, variables, useJSDocStyle);
  }

  public generateFileheader(
    variables: IFileheaderVariables,
    useJSDocStyle: boolean = false,
  ): string {
    const { strings, interpolations } = this.getTemplateInternal(variables, useJSDocStyle);
    const copiedStrings = Array.from(strings);

    return evaluateTemplate(copiedStrings, interpolations);
  }

  private calculateVariableAccessInfo() {
    const { wildcardAccessVariables, customVariables } = this.generateWildcardAccessVariables();
    customVariables.forEach((variable) => {
      this.accessVariableFields.add(variable.name);
    });
    const addVariableAccess = (p: string) =>
      this.accessVariableFields.add(p as keyof IFileheaderVariables);

    const proxyVariables = new Proxy(wildcardAccessVariables, {
      get(target, p, _receiver) {
        if (p === '__isProxy') {
          return true;
        }
        addVariableAccess(p as string);
        return Reflect.get(target, p);
      },
    });

    this.getTemplateInternal(proxyVariables);
  }

  protected generateWildcardAccessVariables() {
    const config = this.configManager.getConfiguration();
    const { customVariables } = config;
    // 创建一个新的对象，将 WILDCARD_ACCESS_VARIABLES 对象和新的属性合并到这个新的对象中
    const newVariables: { [key: string]: string } = { ...WILDCARD_ACCESS_VARIABLES };
    // 将 customVariables 的 name 属性添加到 newVariables 对象中
    customVariables.forEach((variable) => {
      newVariables[variable.name] =
        `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_${variable.name}_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`;
    });
    return { customVariables, wildcardAccessVariables: newVariables };
  }

  private generatePattern(content: string, eol: vscode.EndOfLine): string {
    const pattern = content
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符
      .replace(new RegExp(`${TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER.start}`, 'g'), '')
      .replace(new RegExp(`${TEMPLATE_OPTIONAL_GROUP_PLACEHOLDER.end}`, 'g'), '')
      .replace(
        new RegExp(
          `${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}_(\\w+)_${TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER}`,
          'g',
        ),
        '(?<$1>.*)'.replace(/\n/g, eol === vscode.EndOfLine.CRLF ? '\r\n' : '\n'),
      );
    return pattern;
  }

  public getOriginFileheaderRegExp(
    eol: vscode.EndOfLine,
    patternMultiline: boolean = false,
  ): RegExp | RegExp[] {
    const { wildcardAccessVariables } = this.generateWildcardAccessVariables();
    const template = this.getTemplateInternal(wildcardAccessVariables);
    const templateValue = evaluateTemplate(template.strings, template.interpolations, true);

    if (patternMultiline) {
      const pattern = this.generatePattern(templateValue, eol);
      return new RegExp(pattern, 'm');
    } else {
      const lines = templateValue.split('\n');
      const regexps = lines
        .filter((line) => line.includes(TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER))
        .map((line) => new RegExp(this.generatePattern(line, eol)));
      return regexps;
    }
  }

  public getOriginFileheaderRange(document: vscode.TextDocument) {
    const startLine = hasShebang(document.lineAt(0).text) ? 1 : 0;
    const endLine = startLine;

    const startPosition = new vscode.Position(startLine, 0);
    let endPosition = new vscode.Position(endLine, 0);

    // 用于标记是否处于块注释内部
    let isInsideBlockComment = false;

    for (let i = startLine; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      const lineText = line.text;

      // 更新块注释的开始和结束状态
      isInsideBlockComment = updateBlockCommentState(this.comments, lineText, isInsideBlockComment);
      // 判断当前行是否是注释行
      if (isCommentLine(this.comments, lineText, isInsideBlockComment)) {
        // endLine = i;
        endPosition = document.lineAt(i).range.end;
      } else {
        // 不在块注释中
        if (!isInsideBlockComment) {
          // 如果有多个空行，在最后一个空行 break
          if (
            line.isEmptyOrWhitespace &&
            i + 1 < document.lineCount &&
            !document.lineAt(i + 1).isEmptyOrWhitespace
          ) {
            break;
          }
          // 如果当前行不是空行，结束循环
          if (!line.isEmptyOrWhitespace) {
            break;
          }
        }
      }
    }

    const range = new vscode.Range(startPosition, endPosition);
    return range;
  }

  public getOriginContentWithoutFileheader(
    document: vscode.TextDocument,
    range: vscode.Range = this.getOriginFileheaderRange(document),
  ): string {
    const documentText = document.getText();
    const rangeText = document.getText(range);

    if (rangeText === '') {
      return documentText;
    }

    const escapedRangeText = escapeRegexString(rangeText);
    const pattern = new RegExp(`${escapedRangeText}\n?(\r?\n)*`);
    const sourceWithoutHeader = documentText.replace(pattern, '');
    return sourceWithoutHeader;
  }

  protected generateLine(
    tpl: ITemplateFunction,
    label: string,
    values: (string | TemplateInterpolation)[],
    longestLabelLength: number,
    wholeLine = false,
  ): Template {
    if (values.length === 0) {
      return tpl``;
    }
    const spaces = ' '.repeat(longestLabelLength - label.length);
    const combinedValues = values.reduce(
      (prev, curr, index) => {
        return index === 0 ? tpl`${curr}` : tpl`${prev}${curr}`;
      },
      tpl``,
    );
    return wholeLine ? tpl`${combinedValues}\n` : tpl`${label}${spaces}    ${combinedValues}\n`;
  }

  protected abstract getTemplate(
    tpl: ITemplateFunction,
    variables: IFileheaderVariables,
    useJSDocStyle?: boolean,
  ): Template;

  protected replaceVariables(
    value: string,
    variables: { [key: string]: string },
  ): (string | TemplateInterpolation)[] {
    return value.split(/(\{\{\w+\}\})/g).map((part) => {
      return part.replace(/\{\{(\w+)\}\}/, (_match, p1) => {
        return variables[p1] || '';
      });
    });
  }
}
