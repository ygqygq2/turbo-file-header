import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { logger } from '@/extension';
import { LanguageFunctionCommentSettings } from '@/typings/types';
import { escapeRegexString } from '@/utils/str';

import { extractFunctionParamsString } from './extractFunctionParamsString';
import { FunctionParamsParser } from './FunctionParamsParser';
import { splitParams } from './python-splitParams';
import { FunctionParamsInfo, ParamsInfo, ReturnInfo } from './types';

function matchNormalFunction(
  functionDefinition: string,
  languageSettings: LanguageFunctionCommentSettings,
): {
  matched: boolean;
  returnType: ReturnInfo;
  params: ParamsInfo;
} {
  const { defaultReturnName = 'default', defaultReturnType = 'Any' } = languageSettings;
  const returnType: ReturnInfo = {};
  let matched = false;
  let params: ParamsInfo = {};

  // 提取参数括号里的字符串
  const functionParamsStr = extractFunctionParamsString(functionDefinition);
  const functionParamsRegStr = escapeRegexString(functionParamsStr);
  const functionPattern = new RegExp(
    `def\\s+([a-zA-Z0-9_]+)\\s*\\(${functionParamsRegStr}\\)\\s*(->\\s*(.*))?\\s*:`,
    'm',
  );

  const match = functionPattern.exec(functionDefinition);

  if (match) {
    matched = true;
    const returnTypeStr = match[3] ? match[3].trim() : defaultReturnType;

    returnType[defaultReturnName] = {
      type: returnTypeStr,
      description: '',
    };

    params = splitParams(functionParamsStr, languageSettings);
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
  const { defaultReturnName = 'default', defaultReturnType = 'Any' } = languageSettings;
  let returnType: ReturnInfo = {
    [defaultReturnName]: { type: defaultReturnType, description: '' },
  };
  let matched = false;
  let params: ParamsInfo = {};

  const matchers = [matchNormalFunction];

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

export class PythonParser extends FunctionParamsParser {
  constructor(configManager: ConfigManager, languageId: string) {
    super(configManager, languageId);
  }

  private getFunctionString(document: vscode.TextDocument, startLine: number) {
    let functionDefinition = '';
    let bracketCount = 0; // 大括号计数
    let parenthesisCount = 0; // 小括号计数
    let colonDetected = false; // 函数冒号检测

    for (let i = startLine; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      functionDefinition += line.text + '\n';

      for (const char of line.text) {
        if (char === '(') {
          parenthesisCount++;
        } else if (char === ')') {
          parenthesisCount--;
        } else if (char === '{') {
          bracketCount++;
        } else if (char === '}') {
          bracketCount--;
        } else if (char === ':' && parenthesisCount === 0) {
          colonDetected = true;
        }
      }

      if (bracketCount === 0 && parenthesisCount === 0 && colonDetected) {
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