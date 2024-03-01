import vscode from 'vscode';
import { evaluateTemplate, getTaggedTemplateInputs } from '../utils/utils';
import { IFileheaderVariables, ITemplateFunction, Template } from '../typings/types';
import { WILDCARD_ACCESS_VARIABLES } from '../constants';

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
    const { blockCommentStart, blockCommentEnd } = this.getBlockComment();
    const eolPattern = eol === vscode.EndOfLine.CRLF ? '\\r\\n' : '\\n';

    // 转义注释符号，以便在正则表达式中使用
    const blockCommentStartEscaped = blockCommentStart.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const blockCommentEndEscaped = blockCommentEnd.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let commentPattern;

    // 判断是块注释还是单行注释
    if (blockCommentStart === blockCommentEnd) {
      // 单行注释
      commentPattern = `${blockCommentStartEscaped}.*(?:${eolPattern}|$)`;
    } else {
      // 块注释
      commentPattern = `${blockCommentStartEscaped}[^]*?${blockCommentEndEscaped}(?:${eolPattern}|$)`;
    }

    // 构建最终的正则表达式，匹配文件开头的注释段
    const pattern = `^${commentPattern}`;

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
