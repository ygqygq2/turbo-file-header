import vscode from 'vscode';
import { evaluateTemplate, getTaggedTemplateInputs, hasShebang } from '../utils/utils';
import {
  IFileheaderVariables,
  ITemplateFunction,
  Template,
  TemplateInterpolation,
} from '../typings/types';
import { TEMPLATE_NAMED_GROUP_WILDCARD_PLACEHOLDER, WILDCARD_ACCESS_VARIABLES } from '../constants';
import { escapeRegexString } from '@/utils/str';
import { ConfigManager } from '@/configuration/ConfigManager';
import { LanguageProviderOptions } from './types';

export abstract class LanguageProvider {
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

  public get isCustomProvider() {
    return !!this.workspaceScopeUri;
  }

  abstract readonly languages: string[];
  abstract comments: vscode.CommentRule;
  // 文件头偏移量，即文件头从这行开始插入或更新
  readonly startLineOffset: number = 0;

  public getBlockComment(): { blockCommentStart: string; blockCommentEnd: string } {
    let blockCommentStart: string = '';
    let blockCommentEnd: string = '';
    // 确保 this.comments 和 this.comments.blockComments 都不是 undefined
    if (this.comments && this.comments.blockComment && this.comments.blockComment.length) {
      // 当存在块注释时使用块注释
      blockCommentStart = this.comments.blockComment[0];
      blockCommentEnd = this.comments.blockComment[1];
    } else if (this.comments && this.comments.lineComment) {
      // 当不存在块注释但存在行注释时，使用行注释作为块注释的开始和结束
      blockCommentStart = this.comments.lineComment;
      blockCommentEnd = this.comments.lineComment;
    }
    return { blockCommentStart, blockCommentEnd };
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
        return index === 0 ? tpl`${curr}` : tpl`${prev} ${curr}`;
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

  public getOriginFileheaderRegExp(eol: vscode.EndOfLine): RegExp {
    const { wildcardAccessVariables } = this.generateWildcardAccessVariables();
    const template = this.getTemplateInternal(wildcardAccessVariables);
    console.log('🚀 ~ file: LanguageProvider.ts:114 ~ template:', template);
    const templateValue = evaluateTemplate(template.strings, template.interpolations, true);
    console.log('🚀 ~ file: LanguageProvider.ts:116 ~ templateValue:', templateValue);

    // 替换特殊字符和处理换行符
    const pattern = templateValue
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // 转义正则特殊字符
      .replace(/\s*→\s*|\s*←\s*/g, '\\s*') // 将“→”和“←”转换为对应的空白字符匹配
      .replace(/这是分界符_(\w+)_这是分界符/g, '(?<$1>.*?)'); // 转换变量部分为捕获组，注意这里用.*?进行非贪婪匹配

    // 创建正则表达式，使用'm'标志进行多行匹配
    const regex = new RegExp(pattern, 'm');

    console.log(regex);
    return regex;
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
      isInsideBlockComment = this.updateBlockCommentState(lineText, isInsideBlockComment);
      // 判断当前行是否是注释行
      if (this.isCommentLine(lineText, isInsideBlockComment)) {
        // endLine = i;
        endPosition = document.lineAt(i).range.end;
      } else {
        // 遇到非注释行且不在块注释中，且不是空行，结束循环
        if (!isInsideBlockComment && !line.isEmptyOrWhitespace) {
          break;
        }
      }
    }

    const range = new vscode.Range(startPosition, endPosition);
    return range;
  }

  private isCommentLine(lineText: string, isInsideBlockComment: boolean): boolean {
    const { blockCommentStart, blockCommentEnd } = this.getBlockComment();
    const { lineComment } = this.comments;

    // 块注释
    if (this.comments && this.comments.blockComment && this.comments.blockComment.length) {
      // 处于块注释中，不管有没有结束，则为注释行
      if (isInsideBlockComment) {
        return true;
      }

      // 块注释开始、结束都属于注释行
      return lineText.includes(blockCommentStart) || lineText.includes(blockCommentEnd);
    } else if (lineComment) {
      return lineText.trim().startsWith(lineComment);
    }
    return false;
  }

  private updateBlockCommentState(lineText: string, isInsideBlockComment: boolean): boolean {
    const { blockCommentStart, blockCommentEnd } = this.getBlockComment();

    // 检查是否为Python或其他使用相同标记作为块注释开始和结束的语言
    if (blockCommentStart === blockCommentEnd) {
      // 如果找到块注释标记，并且我们当前不在块注释内，那么这表示块注释的开始
      if (lineText.includes(blockCommentStart) && !isInsideBlockComment) {
        isInsideBlockComment = true;
      } else if (lineText.includes(blockCommentEnd) && isInsideBlockComment) {
        // 如果我们已经在块注释内，并且再次遇到块注释标记，那么这表示块注释的结束
        isInsideBlockComment = false;
      }
    } else {
      // 对于开始和结束标记不同的常规情况
      if (lineText.includes(blockCommentStart)) {
        isInsideBlockComment = true;
      }
      if (lineText.includes(blockCommentEnd)) {
        isInsideBlockComment = false;
      }
    }

    return isInsideBlockComment;
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

  private calculateVariableAccessInfo() {
    const { wildcardAccessVariables, customVariables } = this.generateWildcardAccessVariables();
    customVariables.forEach((variable) => {
      this.accessVariableFields.add(variable.name);
    });
    const addVariableAccess = (p: string) =>
      this.accessVariableFields.add(p as keyof IFileheaderVariables);

    const proxyVariables = new Proxy(wildcardAccessVariables, {
      get(target, p, _receiver) {
        addVariableAccess(p as string);
        return Reflect.get(target, p);
      },
    });

    this.getTemplateInternal(proxyVariables);
  }
}
