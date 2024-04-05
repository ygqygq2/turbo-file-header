import { logger } from '@/extension';
import { Project, SyntaxKind } from 'ts-morph';
import * as vscode from 'vscode';
import { FunctionParamsParser } from './FunctionParamsParser';
import { FunctionParamsInfo, ParamsInfo } from './types';

export class TypescriptParser extends FunctionParamsParser {
  public getFunctionParamsAtCursor(activeEditor: vscode.TextEditor): FunctionParamsInfo {
    const cursorLine = activeEditor.selection.start.line;
    const document = activeEditor.document;

    let matchedFunction = false;
    let returnType = 'void';
    const functionParams: ParamsInfo = {};

    // Create a new TypeScript project
    const project = new Project();

    // Check the current line and the next line
    for (let i = 0; i <= 1; i++) {
      let targetLine = cursorLine + i;
      if (targetLine >= document.lineCount) {
        break;
      }

      let functionString = '';
      let line = document.lineAt(targetLine);
      while (!line.text.trim().endsWith('}') && targetLine < document.lineCount) {
        functionString += line.text + '\n';
        targetLine++;
        line = document.lineAt(targetLine);
      }
      functionString += line.text;

      // Create a new source file
      const sourceFile = project.createSourceFile('temp.ts', functionString, { overwrite: true });

      // Get all functions in the source file
      const functions = sourceFile.getDescendantsOfKind(SyntaxKind.FunctionDeclaration);
      const arrowFunctions = sourceFile.getDescendantsOfKind(SyntaxKind.ArrowFunction);
      const allFunctions = [...functions, ...arrowFunctions];
      for (const func of allFunctions) {
        matchedFunction = true;
        returnType = func.getReturnTypeNode()?.getText() || 'void';
        const parameters = func.getParameters();
        for (const param of parameters) {
          if (param) {
            const name = param.getName();
            const type = param.getTypeNode()?.getText() || 'any';
            functionParams[name] = { type, description: '' };
          }
        }
      }

      if (Object.keys(functionParams).length > 0) {
        return {
          matchedFunction,
          returnType,
          params: functionParams,
          insertPosition: new vscode.Position(cursorLine + i, 0),
        };
      }
    }

    logger.info(vscode.l10n.t('No function found at the cursor'));
    return {
      matchedFunction,
      returnType,
      params: functionParams,
      insertPosition: new vscode.Position(cursorLine, 0),
    };
  }
}
