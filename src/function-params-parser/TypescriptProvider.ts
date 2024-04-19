import * as ts from 'typescript';
import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';
import { LanguageFunctionCommentSettings } from '@/typings/types';

import { FunctionParamsParser } from './FunctionParamsParser';
import { FunctionParamsInfo, ParamsInfo, TsFunctionNode } from './types';

function getRealType(node: TsFunctionNode): { returnType: string; params: ParamsInfo } {
  let returnType = '';
  const params: ParamsInfo = {};
  const program = ts.createProgram({
    rootNames: ['temp.ts'],
    options: {},
  });

  const checker = program.getTypeChecker();
  const returnTypeNode = node.type;

  if (returnTypeNode) {
    const tsType = checker.getTypeAtLocation(returnTypeNode);
    returnType = checker.typeToString(tsType);
  }

  node.parameters.forEach((param) => {
    const paramName = param.name.getText();
    const tsType = param.type ? checker.getTypeAtLocation(param.type) : null;
    const paramType = tsType ? checker.typeToString(tsType) : '';
    params[paramName] = { type: paramType, description: '' };
  });

  return { returnType, params };
}

function matchFunction(
  functionDefinition: string,
  languageSettings: LanguageFunctionCommentSettings,
): { matched: boolean; returnType: string; params: ParamsInfo } {
  const {
    typesUsingDefaultReturnType = [],
    useTypeAlias = true,
    defaultParamType = 'any',
  } = languageSettings;
  let returnType: string = languageSettings.defaultReturnType || 'auto';
  let matched = false;
  let params: ParamsInfo = {};

  const sourceFile = ts.createSourceFile(
    'temp.ts',
    functionDefinition,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );

  const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
    if (
      ts.isFunctionDeclaration(node) ||
      ts.isFunctionExpression(node) ||
      ts.isArrowFunction(node) ||
      ts.isMethodDeclaration(node) ||
      ts.isGetAccessor(node) ||
      ts.isSetAccessor(node) ||
      ts.isConstructorDeclaration(node)
    ) {
      matched = true;
      let returnTypeTmp;
      if (useTypeAlias) {
        returnTypeTmp = node.type?.getText();
        node.parameters.forEach((param) => {
          const paramName = param.name.getText();
          const paramType = param.type ? param.type.getText() : defaultParamType;
          params[paramName] = { type: paramType, description: '' };
        });
      } else {
        const { returnType: realReturnType, params: realPrams } = getRealType(node);
        returnTypeTmp = realReturnType;
        params = realPrams;
      }
      if (returnTypeTmp && !typesUsingDefaultReturnType.includes(returnTypeTmp)) {
        returnType = returnTypeTmp;
      }

      return node;
    }
    return ts.visitEachChild(node, visitor, undefined);
  };

  try {
    ts.visitNode(sourceFile, visitor);
  } catch (error) {
    logger.handleError(new CustomError(ErrorCode.ParserFunctionFail, error));
  }

  return { matched, returnType, params };
}

export class TypescriptParser extends FunctionParamsParser {
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
    const {
      matched,
      returnType: returnTypeTmp,
      params,
    } = matchFunction(functionDefinition, this.languageSettings);
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
