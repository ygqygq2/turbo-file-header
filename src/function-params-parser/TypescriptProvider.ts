import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { logger } from '@/extension';
import { LanguageFunctionCommentSettings } from '@/typings/types';

import { FunctionParamsParser } from './FunctionParamsParser';
import { FunctionParamsInfo, ParamsInfo } from './types';

function splitParams(
  paramsStr: string,
  languageSettings: LanguageFunctionCommentSettings,
): ParamsInfo {
  const { defaultParamType = 'any' } = languageSettings;
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
      const name = paramStr.slice(0, colonIndex !== -1 ? colonIndex : paramStr.length).trim();
      const type = colonIndex !== -1 ? paramStr.slice(colonIndex + 1).trim() : defaultParamType;
      params[name] = { type, description: '' };
      paramStartIndex = i + 1;
    }
  }
  const paramStr = paramsStr.slice(paramStartIndex);
  const colonIndex = paramStr.indexOf(':');
  const name = paramStr.slice(0, colonIndex !== -1 ? colonIndex : paramStr.length).trim();
  const type = colonIndex !== -1 ? paramStr.slice(colonIndex + 1).trim() : defaultParamType;
  params[name] = { type, description: '' };
  return params;
}

function matchFunction(
  functionDefinition: string,
  languageSettings: LanguageFunctionCommentSettings,
): { matched: boolean; type: string } {
  const { defaultReturnType = 'auto' } = languageSettings;
  // 普通函数
  const functionRegex = /function\s+([A-Za-z_]\w*?)\s*\(([\s\S]*?)\)\s*:\s*(\w+)/m;
  // 箭头函数
  const arrowFunctionRegex = /(?:([A-Za-z_]\w*)\s*=\s*)?\(([\s\S]*?)\)\s*:\s*(\w+)\s*=>/m;
  // 匿名箭头函数
  const anonymousArrowFunctionRegex = /\((.*?)\)\s*=>/m;
  // 类方法
  const classFunctionRegex = /^(\s*\w*?\s+)?\s*([A-Za-z_]\w*?)[^()]*\(([\s\S]*?)\)\s*.*?{/m;
  // 对象方法
  const objFunctionRegex = /^\s*([A-Za-z_]\w*?)\s*:\s*\bfunction\b[^()]*\(([\s\S]*?)\)/m;
  // 类的 getter 和 setter 方法
  const classGetterSetterRegex =
    /(get|set)\s+([A-Za-z_]\w*?)[^()]*\(([\s\S]*?)\)\s*:\s*(\w+)\s*.*?{/m;
  // 对象的简写方法
  const objectShorthandMethodRegex = /([A-Za-z_]\w*?)\s*\(([\s\S]*?)\)\s*:\s*(\w+)\s*.*?{/m;
  // Generator 函数
  const generatorFunctionRegex =
    /\bfunction\s*\*\s*([A-Za-z_]\w*?)\s*[^()]*\(([\s\S]*?)\)\s*:\s*(\w+)/m;

  const match =
    functionRegex.exec(functionDefinition) ||
    arrowFunctionRegex.exec(functionDefinition) ||
    anonymousArrowFunctionRegex.exec(functionDefinition) ||
    classFunctionRegex.exec(functionDefinition) ||
    objFunctionRegex.exec(functionDefinition) ||
    classGetterSetterRegex.exec(functionDefinition) ||
    objectShorthandMethodRegex.exec(functionDefinition) ||
    generatorFunctionRegex.exec(functionDefinition);

  if (match) {
    const returnType = match[3] || defaultReturnType;
    return { matched: true, type: returnType };
  }

  return { matched: false, type: defaultReturnType };
}

export class TypescriptParser extends FunctionParamsParser {
  constructor(configManager: ConfigManager, languageId: string) {
    super(configManager, languageId);
  }

  public getFunctionParamsAtCursor(
    activeEditor: vscode.TextEditor,
    languageSettings: LanguageFunctionCommentSettings = this.languageSettings,
  ): FunctionParamsInfo {
    const { defaultReturnType = 'auto' } = languageSettings;

    const cursorLine = activeEditor.selection.start.line;
    const document = activeEditor.document;
    let functionParams: ParamsInfo = {};
    let matchedFunction = false;
    let returnType = defaultReturnType;

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

    const { matched, type } = matchFunction(functionDefinition, this.languageSettings);
    if (matched) {
      matchedFunction = true;
      returnType = type;
      // 过滤出函数括号里的内容
      const functionParamsStr = functionDefinition.match(/\(([\s\S]*?)\)/)?.[1] || '';
      // 分离出参数
      functionParams = splitParams(functionParamsStr, this.languageSettings);
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
