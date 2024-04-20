import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { logger } from '@/extension';
import { LanguageFunctionCommentSettings } from '@/typings/types';

import { FunctionParamsParser } from './FunctionParamsParser';
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
  let returnType = {};
  let matched = false;
  const params: ParamsInfo = {};

  // 普通写法，一个小括号一个大括号，可能有参数，可能有一个返回值，但返回值没有命令，没有括号
  const functionPattern = /func\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*([a-zA-Z0-9_]+)?\s*{[\s\S]*?}/m;

  const match = functionPattern.exec(functionDefinition);

  if (match) {
    matched = true;
    returnType = { [defaultReturnName]: { type: match[3], description: '' } };

    const paramsString = match[2];
    const paramsArray = paramsString.split(',');
    for (const param of paramsArray) {
      const [name, type] = param.trim().split(' ');
      params[name] = { type, description: '' };
    }
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
  const { defaultReturnName = 'default' } = languageSettings;
  const returnType: ReturnInfo = {};
  let matched = false;
  const params: ParamsInfo = {};

  // 函数可能有参数，一定有一个或多个返回值，返回值可能有命名，也可能无命名，但一定有括号包住返回值
  const functionPattern = /func\s+([a-zA-Z0-9_]+)\s*\((.*?)\)\s*\((.*?)\)\s*{[\s\S]*?}/m;
  const match = functionPattern.exec(functionDefinition);

  if (match) {
    matched = true;

    const paramsString = match[2];
    const paramsArray = paramsString.split(',');
    for (const param of paramsArray) {
      const [name, type] = param.trim().split(' ');
      params[name] = { type, description: '' };
    }

    const returnString = match[3];
    const returnArray = returnString.split(',');
    let defaultCount = 0;
    for (const ret of returnArray) {
      const [name, type] = ret.trim().split(' ');
      returnType[name || `${defaultReturnName}${defaultCount++}`] = { type, description: '' };
    }
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
  const { defaultReturnName = 'default' } = languageSettings;
  const returnType: ReturnInfo = {};
  let matched = false;
  const params: ParamsInfo = {};

  // 绑定到类型的函数，可能有参数，可能有一个或多个返回值，返回值可能有命名
  const functionPattern =
    /func\s+\((.*?)\s*\*\s*([a-zA-Z0-9_]+)\)\s*([a-zA-Z0-9_]+)\s*\((.*?)\)\s*\((.*?)\)\s*{[\s\S]*?}/m;

  const match = functionPattern.exec(functionDefinition);
  if (match) {
    matched = true;
    const paramsString = match[4];
    const paramsArray = paramsString.split(',');
    for (const param of paramsArray) {
      const [name, type] = param.trim().split(' ');
      params[name] = { type, description: '' };
    }

    const returnString = match[5];
    const returnArray = returnString.split(',');
    for (const ret of returnArray) {
      const [name, type] = ret.trim().split(' ');
      returnType[name || defaultReturnName] = { type, description: '' };
    }
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
  const result = matchers
    .map((matcher) => matcher(functionDefinition, languageSettings))
    .find((result) => result.matched);
  if (result?.matched) {
    matched = result.matched;
    params = result.params;
    if (
      Object.keys(result.returnType).length === 1 &&
      defaultReturnName in result.returnType &&
      result.returnType?.[defaultReturnName]?.type !== undefined
    ) {
      returnType = result.returnType;
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
