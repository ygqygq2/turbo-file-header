import { logger } from '@/extension';
import * as ts from 'typescript';
import * as vscode from 'vscode';
import { FunctionParamsInfo } from './types';

export class TypescriptParser {
  public getFunctionParamsAtCursor(activeEditor: vscode.TextEditor): FunctionParamsInfo {
    const cursorLine = activeEditor.selection.start.line;
    const document = activeEditor.document;

    // Check the current line and the next line
    for (let i = 0; i <= 1; i++) {
      const line = document.lineAt(cursorLine + i);
      const functionString = line.text;

      const sourceFile = ts.createSourceFile(
        'temp.ts',
        functionString,
        ts.ScriptTarget.Latest,
        false,
        ts.ScriptKind.TS,
      );

      const functionParams: string[] = [];

      const visit = (node: ts.Node) => {
        if (ts.isParameter(node)) {
          functionParams.push(node.name.getText(sourceFile));
        }
        ts.forEachChild(node, visit);
      };

      ts.forEachChild(sourceFile, visit);

      if (functionParams.length > 0) {
        return {
          params: functionParams,
          insertPosition: new vscode.Position(cursorLine + i, 0),
        };
      }
    }

    logger.info(vscode.l10n.t('No function found at the cursor'));
    return { params: [], insertPosition: new vscode.Position(cursorLine, 0) };
  }
}
