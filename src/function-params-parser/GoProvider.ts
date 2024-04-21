import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { logger } from '@/extension';
import { LanguageFunctionCommentSettings } from '@/typings/types';
import { escapeRegexString } from '@/utils/str';

import { extractFunctionParamsString } from './extractFunctionParamsString';
import { FunctionParamsParser } from './FunctionParamsParser';
import { splitParams } from './go-splitParams';
import { FunctionParamsInfo, ParamsInfo, ReturnInfo } from './types';

function matchNormalFunction(
  functionDefinition: string,
  languageSettings: LanguageFunctionCommentSettings,
): {
  matched: boolean;
  returnType: ReturnInfo;
  params: ParamsInfo;
} {
  const { defaultReturnName = 'default' } = languageSettings;
  const returnType: ReturnInfo = {};
  let matched = false;
  let params: ParamsInfo = {};

  // 提取参数括号里的字符串
  const functionParamsStr = extractFunctionParamsString(functionDefinition);
  const functionParamsRegStr = escapeRegexString(functionParamsStr);
  // 普通写法，一个小括号一个大括号，参数使用上面变量，可能有一个返回值，但返回值没有命名，没有括号
  const functionPattern = new RegExp(
    `func\\s+([a-zA-Z0-9_]+)\\s*\\(${functionParamsRegStr}\\)\\s*([a-zA-Z0-9_]+)?\\s*{[\\s\\S]*?}`,
    'm',
  );

  const match = functionPattern.exec(functionDefinition);

  if (match) {
    matched = true;
    const returnString = match[2];
    if (returnString) {
      const returnTypeStr = returnString.trim();
      returnType[defaultReturnName] = { type: returnTypeStr, description: '' };
    }

    params = splitParams(functionParamsStr, languageSettings);
  }

  return { matched, returnType, params };
}

function matchMultiReturnTypeFunction(
  functionDefinition: string,
  languageSettings: LanguageFunctionCommentSettings,
): {
  matched: boolean;
  returnType: ReturnInfo;
  params: ParamsInfo;
} {
  let returnType: ReturnInfo = {};
  let matched = false;
  let params: ParamsInfo = {};

  const functionParamsStr = extractFunctionParamsString(functionDefinition);
  const functionParamsRegStr = escapeRegexString(functionParamsStr);
  // 函数参数使用上面变量，一定有一个或多个返回值，返回值可能有命名，也可能无命名，但一定有括号包住返回值
  const functionPattern = new RegExp(
    `func\\s+([a-zA-Z0-9_]+)\\s*\\(${functionParamsRegStr}\\)\\s*\\((.*?)\\)\\s*{[\\s\\S]*?}`,
    'm',
  );
  const match = functionPattern.exec(functionDefinition);

  if (match) {
    matched = true;
    params = splitParams(functionParamsStr, languageSettings);

    const returnString = match[2] || '';
    returnType = splitParams(returnString, languageSettings);
  }

  return { matched, returnType, params };
}

function matchBindTypeFunction(
  functionDefinition: string,
  languageSettings: LanguageFunctionCommentSettings,
): {
  matched: boolean;
  returnType: ReturnInfo;
  params: ParamsInfo;
} {
  let returnType: ReturnInfo = {};
  let matched = false;
  let params: ParamsInfo = {};

  const functionParamsStr = extractFunctionParamsString(functionDefinition);
  const functionParamsRegStr = escapeRegexString(functionParamsStr);
  // 绑定到类型的函数，参数使用上面变量，可能有一个或多个返回值，返回值可能有命名
  const functionPattern = new RegExp(
    `func\\s+([a-zA-Z0-9_]+)\\s*\\(${functionParamsRegStr}\\)\\s*\\((.*?)\\)\\s*{[\\s\\S]*?}`,
    'm',
  );

  const match = functionPattern.exec(functionDefinition);
  if (match) {
    matched = true;
    const functionParamsStr = match[4] || '';
    params = splitParams(functionParamsStr, languageSettings);

    const returnString = match[5];
    returnType = splitParams(returnString, languageSettings);
  }

  return { matched, returnType, params };
}

/**
 * @description
 * @return default {auto}
 */
function matchFunction(
  functionDefinition: string,
  languageSettings: LanguageFunctionCommentSettings,
): { matched: boolean; returnType: ReturnInfo; params: ParamsInfo } {
  const { defaultReturnName = 'default', defaultReturnType = 'auto' } = languageSettings;
  let returnType: ReturnInfo = {
    [defaultReturnName]: { type: defaultReturnType, description: '' },
  };
  let matched = false;
  let params: ParamsInfo = {};

  const matchers = [matchNormalFunction, matchMultiReturnTypeFunction, matchBindTypeFunction];

  for (const matcher of matchers) {
    const result = matcher(functionDefinition, languageSettings);
    if (result.matched) {
      matched = result.matched;
      params = result.params;
      returnType = result.returnType;
      break;
    }
  }

  return { matched, returnType, params };
}

export class GoParser extends FunctionParamsParser {
  constructor(configManager: ConfigManager, languageId: string) {
    super(configManager, languageId);
  }

  private getFunctionString(document: vscode.TextDocument, startLine: number) {
    let functionDefinition = '';
    let bracketCount = 0; // 大括号计数
    let parenthesisCount = 0; // 小括号计数

    for (let i = startLine; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      functionDefinition += line.text + '\n';

      if (line.text.includes('=>') && !line.text.match(/=>\s*{/)) {
        break;
      }

      for (const char of line.text) {
        if (char === '(') {
          parenthesisCount++;
        } else if (char === ')') {
          parenthesisCount--;
        } else if (char === '{') {
          bracketCount++;
        } else if (char === '}') {
          bracketCount--;
        }
      }

      if (bracketCount === 0 && parenthesisCount === 0) {
        break;
      }
    }

    return functionDefinition;
  }

  public getFunctionParamsAtCursor(
    activeEditor: vscode.TextEditor,
    languageSettings: LanguageFunctionCommentSettings = this.languageSettings,
  ): FunctionParamsInfo {
    let functionParams: ParamsInfo = {};
    let matchedFunction = false;
    let returnType: ReturnInfo = {};
    const document = activeEditor.document;
    const cursorLine = activeEditor.selection.start.line;
    let startLine = cursorLine;
    // 如果光标所在行为空行或者注释，则从下一行开始
    const cursorLineText = document.lineAt(cursorLine).text.trim();
    if (cursorLineText === '' || cursorLineText === '//' || cursorLineText === '*/') {
      startLine = cursorLine + 1;
    }

    const functionDefinition = this.getFunctionString(document, startLine);
    const {
      matched,
      returnType: returnTypeTmp,
      params,
    } = matchFunction(functionDefinition, languageSettings);
    if (matched) {
      matchedFunction = true;
      returnType = returnTypeTmp;
      functionParams = params;
    }

    if (!matchFunction) {
      logger.info(vscode.l10n.t('No function found at the cursor'));
    }

    return {
      matchedFunction,
      returnType,
      params: functionParams,
      insertPosition: new vscode.Position(startLine, 0),
    };
  }
}
