import { logger } from '@/extension';
import * as ts from 'typescript';
import * as vscode from 'vscode';
import { FunctionParamsParser } from './FunctionParamsParser';
import { FunctionParamsInfo, ParamType } from './types';

export class TypescriptParser extends FunctionParamsParser {
  public getFunctionParamsAtCursor(activeEditor: vscode.TextEditor): FunctionParamsInfo {
    const cursorLine = activeEditor.selection.start.line;
    const document = activeEditor.document;
    let matchedFunction = false;

    // Check the current line and the next line
    for (let i = 0; i <= 1; i++) {
      const targetLine = cursorLine + i;
      if (targetLine >= document.lineCount) {
        break;
      }
      const line = document.lineAt(targetLine);
      const functionString = line.text;

      const sourceFile = ts.createSourceFile(
        'temp.ts',
        functionString,
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS,
      );

      const functionParams: ParamType[] = [];

      const visit = (node: ts.Node) => {
        if (
          ts.isFunctionDeclaration(node) ||
          ts.isMethodDeclaration(node) ||
          ts.isArrowFunction(node) ||
          (ts.isVariableDeclaration(node) &&
            ts.isArrowFunction(node.initializer as ts.ArrowFunction)) ||
          (ts.isPropertyAssignment(node) &&
            ts.isArrowFunction(node.initializer as ts.ArrowFunction))
        ) {
          matchedFunction = true;
        }
        if (ts.isParameter(node)) {
          const paramName = node.name.getText(sourceFile);
          const paramType = node.type ? node.type.getText(sourceFile) : 'any';
          functionParams.push({ [paramName]: paramType });
        }
        ts.forEachChild(node, visit);
      };

      ts.forEachChild(sourceFile, visit);

      if (functionParams.length > 0) {
        return {
          matchedFunction,
          params: functionParams,
          insertPosition: new vscode.Position(cursorLine + i, 0),
        };
      }
    }

    logger.info(vscode.l10n.t('No function found at the cursor'));
    return {
      matchedFunction,
      params: [],
      insertPosition: new vscode.Position(cursorLine, 0),
    };
  }
}
