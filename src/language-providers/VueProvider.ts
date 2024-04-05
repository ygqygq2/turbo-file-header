import { getBlockComment } from '@/utils/vscode-utils';
import * as vscode from 'vscode';
import { ITemplateFunction, Template } from '../typings/types';
import { LanguageProvider } from './LanguageProvider';

export class VueProvider extends LanguageProvider {
  readonly languages: string[] = ['vue'];

  readonly comments: vscode.CommentRule = { blockComment: ['<!--', '-->'] };

  public override getTemplate(
    tpl: ITemplateFunction,
    variables: { [key: string]: string },
    useJSDocStyle: boolean = false,
  ): Template {
    const { blockCommentStart, blockCommentEnd } = getBlockComment(this.comments);

    const config = this.configManager.getConfiguration();
    const { fileheader } = config;
    let longestLabelLength = 0;
    for (const item of fileheader) {
      const { label } = item;
      longestLabelLength = Math.max(longestLabelLength, label.length);
    }

    const lines = fileheader.map((item) => {
      const { label, wholeLine = false } = item;
      const valueParts = this.replaceVariables(item.value, variables);
      return this.generateLine(tpl, label, valueParts, longestLabelLength, wholeLine);
    });

    if (this.comments && this.comments.blockComment && this.comments.blockComment.length) {
      const combinedLines = lines.reduce((prev, curr) => tpl`${prev}${curr}`, tpl``);
      return tpl`${blockCommentStart}${useJSDocStyle ? '*' : ''}\n${combinedLines}${blockCommentEnd}`;
    }
    const combinedLines = lines.reduce(
      (prev, curr) => tpl`${prev}${blockCommentStart}${curr}`,
      tpl``,
    );
    return tpl`${blockCommentStart}\n${combinedLines}${blockCommentEnd}`;
  }
}
