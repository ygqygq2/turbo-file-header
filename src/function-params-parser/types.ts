import * as vscode from 'vscode';

export type ParamType = { type: string; description: string };

export interface FunctionParamsInfo {
  matchedFunction: boolean;
  returnType: string | string[];
  params: ParamsInfo;
  insertPosition: vscode.Position;
}

export interface ParamsInfo {
  [key: string]: { type: string; description: string };
}

export interface ReturnInfo {
  [key: string]: {
    type: string;
    description: string;
  };
}

export interface FunctionCommentInfo {
  paramsInfo: ParamsInfo;
  returnInfo: ReturnInfo;
  descriptionInfo: string;
}
