import { Project, SyntaxKind } from 'ts-morph';
import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';
import { LanguageFunctionCommentSettings } from '@/typings/types';

import { FunctionParamsParser } from './FunctionParamsParser';
import { splitParams } from './ts-splitParams';
import { FunctionParamsInfo, ParamsInfo } from './types';

function matchFunction(
  functionDefinition: string,
  languageSettings: LanguageFunctionCommentSettings,
): { matched: boolean; type: string } {
  let returnType: string = languageSettings.defaultReturnType || 'auto';
  const project = new Project();
  try {
    const sourceFile = project.createSourceFile('temp.ts', functionDefinition);
    // 普通函数
    const functions = sourceFile.getFunctions();
    // 箭头函数
    const arrowFunctions = sourceFile
      .getStatements()
      .flatMap((s) => s.getDescendantsOfKind(SyntaxKind.ArrowFunction));
    // 类方法
    const classMethods = sourceFile.getClasses().flatMap((c) => c.getMethods());
    // 构造方法
    const constructors = sourceFile.getClasses().flatMap((c) => c.getConstructors());

    const allFunctions = [...functions, ...arrowFunctions, ...classMethods, ...constructors];
    if (allFunctions.length > 0) {
      returnType = allFunctions[0].getReturnType().getText();
      return { matched: true, type: returnType };
    }
  } catch (error) {
    logger.handleError(new CustomError(ErrorCode.ParserFunctionFail, error));
  }

  return { matched: false, type: languageSettings.defaultReturnType || 'auto' };
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
      if (functionParamsStr.trim() !== '') {
        functionParams = splitParams(functionParamsStr, this.languageSettings);
      }
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
