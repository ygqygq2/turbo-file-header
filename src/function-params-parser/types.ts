import * as vscode from 'vscode';

export interface FunctionParamsInfo {
  params: string[];
  insertPosition: vscode.Position;
}
