import { Project, SyntaxKind } from 'ts-morph';
import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';
import { LanguageFunctionCommentSettings } from '@/typings/types';

import { FunctionParamsParser } from './FunctionParamsParser';
import { splitParams } from './ts-splitParams';
import { FunctionParamsInfo, ParamsInfo } from './types';

function matchClassMethod(functionDefinition: string): boolean {
  const classMethodPattern =
    /(public|private|protected)?\s*(async)?\s*([a-zA-Z0-9_]+)\s*\((.*?)\)\s*{[\s\S]*?}/m;
  return classMethodPattern.test(functionDefinition);
}

function matchConstructFunction(functionDefinition: string): boolean {
  const constructorPattern = /constructor\s*\((.*?)\)\s*{[\s\S]*?}/m;
  return constructorPattern.test(functionDefinition);
}

function matchGetterSetterFunction(functionDefinition: string): boolean {
  const getterSetterPattern = /(get|set)\s+(\w+)\s*\((.*?)\)\s*{[\s\S]*?}/m;
  return getterSetterPattern.test(functionDefinition);
}

function matchFunction(
  functionDefinition: string,
  languageSettings: LanguageFunctionCommentSettings,
): { matched: boolean; type: string } {
  const returnType: string = languageSettings.defaultReturnType || 'auto';
  const project = new Project();
  try {
    const sourceFile = project.createSourceFile('temp.js', functionDefinition);
    const functionTypes = {
      normalFunction: () => sourceFile.getFunctions(),
      arrowFunction: () =>
        sourceFile.getStatements().flatMap((s) => s.getDescendantsOfKind(SyntaxKind.ArrowFunction)),
      variableFunction: () =>
        sourceFile
          .getVariableDeclarations()
          .filter((v) => v.getInitializerIfKind(SyntaxKind.FunctionExpression)),
      classMethod: () => (matchClassMethod(functionDefinition) ? [functionDefinition] : []),
      constructMethod: () =>
        matchConstructFunction(functionDefinition) ? [functionDefinition] : [],
      getSetFunction: () =>
        matchGetterSetterFunction(functionDefinition) ? [functionDefinition] : [],
      generatorFunction: () => sourceFile.getFunctions().filter((f) => f.isGenerator()),
    };

    for (const [_tag, getFunctions] of Object.entries(functionTypes)) {
      const functions = getFunctions();
      if (functions.length > 0) {
        return { matched: true, type: returnType };
      }
    }
  } catch (error) {
    logger.handleError(new CustomError(ErrorCode.ParserFunctionFail, error));
  }

  return { matched: false, type: returnType };
}

export class JavascriptParser extends FunctionParamsParser {
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
    const { defaultReturnType = 'auto' } = languageSettings;

    let functionParams: ParamsInfo = {};
    let matchedFunction = false;
    let returnType = defaultReturnType;
    const document = activeEditor.document;
    const cursorLine = activeEditor.selection.start.line;
    let startLine = cursorLine;
    // 如果光标所在行为空行或者注释，则从下一行开始
    const cursorLineText = document.lineAt(cursorLine).text.trim();
    if (cursorLineText === '' || cursorLineText === '//' || cursorLineText === '*/') {
      startLine = cursorLine + 1;
    }

    const functionDefinition = this.getFunctionString(document, startLine);
    const { matched, type } = matchFunction(functionDefinition, this.languageSettings);
    if (matched) {
      matchedFunction = true;
      returnType = type;
      // 过滤出函数括号里的内容
      const functionParamsStr = functionDefinition.match(/\(([\s\S]*?)\)/)?.[1] || '';
      // 分离出参数
      if (functionParamsStr.trim() !== '') {
        functionParams = splitParams(functionParamsStr, languageSettings);
      }
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
