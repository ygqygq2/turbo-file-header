import { IFileheaderVariables, ITemplateFunction, Template, TemplateInterpolation } from '@/typings/types';
import * as vscode from 'vscode';

export abstract class BaseProvider {
  abstract readonly languages: string[];
  abstract comments: vscode.CommentRule;

  protected abstract getTemplate(
    tpl: ITemplateFunction,
    variables: IFileheaderVariables,
    useJSDocStyle?: boolean,
  ): Template;

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
        return index === 0 ? tpl`${curr}` : tpl`${prev}${curr}`;
      },
      tpl``,
    );
    return wholeLine ? tpl`${combinedValues}\n` : tpl`${label}${spaces}    ${combinedValues}\n`;
  }

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
