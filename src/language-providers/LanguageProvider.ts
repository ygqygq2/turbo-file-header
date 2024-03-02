import vscode from 'vscode';
import { evaluateTemplate, getTaggedTemplateInputs, hasShebang } from '../utils/utils';
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

  protected abstract getTemplate(tpl: ITemplateFunction, variables: IFileheaderVariables): Template;

  private getTemplateInternal(variables: IFileheaderVariables) {
    return this.getTemplate(getTaggedTemplateInputs, variables);
  }

  public generateFileheader(variables: IFileheaderVariables): string {
    const { strings, interpolations } = this.getTemplateInternal(variables);
    const copiedStrings = Array.from(strings);

    const r = evaluateTemplate(copiedStrings, interpolations);
    console.log('🚀 ~ file: LanguageProvider.ts:53 ~ r:', r);
    return r;
    // return evaluateTemplate(copiedStrings, interpolations);
  }

  public getOriginFileheaderRegExp(eol: vscode.EndOfLine): RegExp {
    const template = this.getTemplateInternal(WILDCARD_ACCESS_VARIABLES as IFileheaderVariables);
    const templateValue = evaluateTemplate(template.strings, template.interpolations, true);

    const pattern = templateValue
      .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
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

  public getSourceFileWithoutFileheader(document: vscode.TextDocument): string {
    const startLine = hasShebang(document.getText()) ? 1 : 0;
    // 获取整个文档的文本，然后按行分割
    const lines = document.getText().split(/\r?\n/);
    // 从startLine开始获取文本
    const textFromStartLine = lines.slice(startLine).join('\n');
    // 用于匹配文件头的正则表达式
    const regexp = new RegExp(this.getOriginFileheaderRegExp(document.eol), 'mg');
    // 只替换从startLine开始的部分
    const sourceWithoutHeader = textFromStartLine.replace(regexp, '');
    // 如果有shebang，需要将它加回到文本的开始处
    const shebang = startLine > 0 ? lines.slice(0, startLine).join('\n') + '\n' : '';
    // 返回去掉文件头的文本，如果有shebang，它会被加回
    return shebang + sourceWithoutHeader;
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
