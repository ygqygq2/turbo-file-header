import * as vscode from 'vscode';

export type ParamType = {
  [key: string]: string;
};

export interface FunctionParamsInfo {
  matchedFunction: boolean;
  params: ParamType[];
  insertPosition: vscode.Position;
}
