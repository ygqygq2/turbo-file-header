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

    return evaluateTemplate(copiedStrings, interpolations);
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
