import { logger } from '@/extension';
import * as vscode from 'vscode';
import { FunctionParamsParser } from './FunctionParamsParser';
import { FunctionParamsInfo, ParamsInfo } from './types';

function splitParams(paramsStr: string): ParamsInfo {
  let bracketCount = 0;
  let paramStartIndex = 0;
  const params: ParamsInfo = {};
  for (let i = 0; i < paramsStr.length; i++) {
    const char = paramsStr[i];
    if (char === '(' || char === '[' || char === '{') {
      bracketCount++;
    } else if (char === ')' || char === ']' || char === '}') {
      bracketCount--;
    } else if (char === ',' && bracketCount === 0) {
      const paramStr = paramsStr.slice(paramStartIndex, i);
      const colonIndex = paramStr.indexOf(':');
      const name = paramStr.slice(0, colonIndex).trim();
      const type = paramStr.slice(colonIndex + 1).trim();
      params[name] = { type, description: '' };
      paramStartIndex = i + 1;
    }
  }
  const paramStr = paramsStr.slice(paramStartIndex);
  const colonIndex = paramStr.indexOf(':');
  const name = paramStr.slice(0, colonIndex).trim();
  const type = paramStr.slice(colonIndex + 1).trim();
  params[name] = { type, description: '' };
  return params;
}

function matchFunction(functionDefinition: string): { matched: boolean; type: string } {
  const functionRegex = /\bfunction\b\s*([A-Za-z_]\w*?)\s*[^()]*\(([\s\S]*?)\)/m;
  const arrowFunctionRegex = /(?:([A-Za-z_]\w*)\s*=\s*)?\(([\s\S]*?)\)\s*:\s*(\w+)\s*=>/m;
  const anonymousArrowFunctionRegex = /\((.*?)\)\s*=>/m;
  const classFunctionRegex = /^(\s*\w*?\s+)?\s*([A-Za-z_]\w*?)[^()]*\(([\s\S]*?)\)\s*.*?{/m;
  const objFunctionRegex = /^\s*([A-Za-z_]\w*?)\s*:\s*\bfunction\b[^()]*\(([\s\S]*?)\)/m;

  const match =
    functionRegex.exec(functionDefinition) ||
    arrowFunctionRegex.exec(functionDefinition) ||
    anonymousArrowFunctionRegex.exec(functionDefinition) ||
    classFunctionRegex.exec(functionDefinition) ||
    objFunctionRegex.exec(functionDefinition);

  if (match) {
    const returnType = match[3] || 'void';
    return { matched: true, type: returnType };
  }

  return { matched: false, type: 'void' };
}

export class TypescriptParser extends FunctionParamsParser {
  public getFunctionParamsAtCursor(activeEditor: vscode.TextEditor): FunctionParamsInfo {
    const cursorLine = activeEditor.selection.start.line;
    const document = activeEditor.document;
    let functionParams: ParamsInfo = {};
    let matchedFunction = false;
    let returnType = 'void';

    let functionDefinition = '';
    let bracketCount = 0;
    let startLine = cursorLine;
    // 如果光标所在行为空行或者注释，则从下一行开始
    const cursorLineText = document.lineAt(cursorLine).text.trim();
    if (cursorLineText === '' || cursorLineText === '//' || cursorLineText === '*/') {
      startLine = cursorLine + 1;
    }
    for (let i = startLine; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      functionDefinition += line.text + '\n';

      if (line.text.includes('=>')) {
        break;
      }

      for (const char of line.text) {
        if (char === '{') {
          bracketCount++;
        } else if (char === '}') {
          bracketCount--;
        }
      }

      if (bracketCount === 0) {
        break;
      }
    }

    const { matched, type } = matchFunction(functionDefinition);
    if (matched) {
      matchedFunction = true;
      returnType = type;
      // 过滤出函数括号里的内容
      const functionParamsStr = functionDefinition.match(/\(([\s\S]*?)\)/)?.[1] || '';
      // 分离出参数
      functionParams = splitParams(functionParamsStr);
    }

    if (Object.keys(functionParams).length > 0) {
      return {
        matchedFunction,
        returnType,
        params: functionParams,
        insertPosition: new vscode.Position(startLine, 0),
      };
    }

    logger.info(vscode.l10n.t('No function found at the cursor'));
    return {
      matchedFunction,
      returnType,
      params: functionParams,
      insertPosition: new vscode.Position(startLine, 0),
    };
  }
}
