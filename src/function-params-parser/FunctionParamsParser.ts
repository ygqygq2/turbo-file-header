import { LanguageProvider } from '@/language-providers';
import { getBlockComment, isCommentLine } from '@/utils/vscode-utils';
import * as vscode from 'vscode';
import { FunctionParamsInfo } from './types';

export abstract class FunctionParamsParser {
  private languageProvider: LanguageProvider;

  constructor(languageProvider: LanguageProvider) {
    this.languageProvider = languageProvider;
  }

  public abstract getFunctionParamsAtCursor(activeEditor: vscode.TextEditor): FunctionParamsInfo;

  public generateJSDoc(functionParamsInfo: FunctionParamsInfo) {
    const { params } = functionParamsInfo;
    let doc = '/**\n';
    for (const param of params) {
      const [paramName, paramType] = Object.entries(param)[0];
      doc += ` * @param {${paramType}} ${paramName} - description\n`;
    }
    doc += ' */\n';
    console.log('🚀 ~ file: TypescriptProvider.ts:74 ~ doc:', doc);
    return doc;
  }

  public getOriginJSDoc(document: vscode.TextDocument, insertPosition: vscode.Position) {
    const endLine = insertPosition.line;
    const startLine = endLine;
    const startPosition = new vscode.Position(startLine, 0);
    let endPosition = new vscode.Position(endLine, 0);

    // 用于标记是否处于块注释内部
    let isInsideBlockComment = false;

    // 往上检查，直到找到非注释行
    for (let i = endLine; i >= 0; i--) {
      const line = document.lineAt(i);
      const lineText = line.text;

      // 更新块注释的开始和结束状态
      isInsideBlockComment = this.updateBlockCommentState(lineText, isInsideBlockComment);
      // 判断当前行是否是注释行
      if (isCommentLine(this.languageProvider?.comments, lineText, isInsideBlockComment)) {
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

  public parseJSDoc(jsdoc: string) {
    const paramPattern = /@param\s+\{(.+?)\}\s+(\w+)\s+-\s+(.+)/g;
    const returnPattern = /@return\s+\{(.+?)\}\s+(.+)/g;

    const params: { [key: string]: string }[] = [];
    let match;
    while ((match = paramPattern.exec(jsdoc)) !== null) {
      const [_, type, name, description] = match;
      params.push({ [name]: `${type} - ${description}` });
    }

    let returnType = '';
    if ((match = returnPattern.exec(jsdoc)) !== null) {
      const [_, type, description] = match;
      returnType = `${type} - ${description}`;
    }

    return { params, returnType };
  }

  protected updateBlockCommentState(lineText: string, isInsideBlockComment: boolean): boolean {
    const { blockCommentStart, blockCommentEnd } = getBlockComment(this.languageProvider?.comments);

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
}
