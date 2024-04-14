import * as vscode from 'vscode';

import { isCommentLine, updateBlockCommentState } from '@/utils/vscode-utils';

import { FunctionCommentInfo, FunctionParamsInfo, ParamsInfo, ReturnInfo } from './types';

export abstract class FunctionParamsParser {
  public abstract getFunctionParamsAtCursor(activeEditor: vscode.TextEditor): FunctionParamsInfo;

  public generateFunctionCommentInfo(
    functionParamsInfo: FunctionParamsInfo,
    originFunctionInfo: FunctionCommentInfo,
  ): FunctionCommentInfo {
    const { params, returnType } = functionParamsInfo;
    const { paramsInfo, returnInfo, descriptionInfo } = originFunctionInfo;

    // 合并 params 和 paramsInfo
    const mergedParams: ParamsInfo = {};
    for (const key in params) {
      mergedParams[key] = {
        type: params[key].type,
        description: paramsInfo[key]?.description || '',
      };
    }

    // 合并 returnType 和 returnInfo
    let mergedReturnInfo: ReturnInfo;
    if (Array.isArray(returnType)) {
      mergedReturnInfo = returnType.reduce((acc, type, index) => {
        acc[`return${index + 1}`] = {
          type,
          description: returnInfo[`return${index + 1}`]?.description || '',
        };
        return acc;
      }, {} as ReturnInfo);
    } else {
      mergedReturnInfo = {
        default: {
          type: returnType || returnInfo.default?.type || '',
          description: returnInfo.default?.description || '',
        },
      };
    }

    return {
      paramsInfo: mergedParams,
      returnInfo: mergedReturnInfo,
      descriptionInfo,
    };
  }

  public getOriginFunctionCommentRange(
    comments: vscode.CommentRule,
    document: vscode.TextDocument,
    insertPosition: vscode.Position,
  ) {
    const endLine = insertPosition.line;
    const startLine = endLine;
    let startPosition = new vscode.Position(startLine, 0);
    const endPosition = new vscode.Position(endLine, 0);

    // 用于标记是否处于块注释内部
    let isInsideBlockComment = false;

    // 往上检查，直到找到非注释行
    for (let i = endLine - 1; i >= 0; i--) {
      const line = document.lineAt(i);
      const lineText = line.text;

      // 更新块注释的开始和结束状态
      isInsideBlockComment = updateBlockCommentState(
        comments,
        lineText,
        isInsideBlockComment,
        'up',
      );
      // 判断当前行是否是注释行
      if (isCommentLine(comments, lineText, isInsideBlockComment)) {
        startPosition = document.lineAt(i).range.start;
      } else {
        // 不在块注释中
        if (!isInsideBlockComment) {
          // 如果有多个空行，在往前最后一个空行 break
          if (
            line.isEmptyOrWhitespace &&
            i - 1 >= 0 &&
            !document.lineAt(i - 1).isEmptyOrWhitespace
          ) {
            startPosition = document.lineAt(i + 1).range.start;
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

  public parseFunctionComment(
    document: vscode.TextDocument,
    range: vscode.Range,
  ): FunctionCommentInfo {
    const descriptionPattern = /@description\s+(.*)/;
    const paramPattern = /@param\s+(\w+)\s*\{(.+?)\}\s*(.*)/;
    const returnPattern = /@return\s+(?:(\w+)\s*)?\{(.+?)\}\s*(.*)/;

    const functionCommentLines = document.getText(range).split('\n');

    const paramsInfo: ParamsInfo = {};
    const returnInfo: ReturnInfo = {};
    let descriptionInfo = '';
    for (const line of functionCommentLines) {
      let match;
      if ((match = paramPattern.exec(line)) !== null) {
        const [_, name, type = 'any', description = ''] = match;
        paramsInfo[name] = { type, description };
      } else if ((match = returnPattern.exec(line)) !== null) {
        const [_, key = 'default', type = 'any', description = ''] = match;
        returnInfo[key] = { type, description };
      } else if ((match = descriptionPattern.exec(line)) !== null) {
        const [_, description] = match;
        descriptionInfo = description.trim();
      }
    }

    return { paramsInfo, returnInfo, descriptionInfo };
  }
}
