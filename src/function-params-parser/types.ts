import ts from 'typescript';
import * as vscode from 'vscode';

export type ParamInfo = {
  type: string;
  description: string;
  optional?: boolean;
  defaultValue?: string;
};

export interface ParamsInfo {
  [key: string]: ParamInfo;
}

export interface ReturnInfo {
  [key: string]: {
    type: string;
    description: string;
  };
}

export interface FunctionParamsInfo {
  matchedFunction: boolean;
  returnType: string | ReturnInfo;
  params: ParamsInfo;
  insertPosition: vscode.Position;
}

export interface FunctionCommentInfo {
  paramsInfo: ParamsInfo;
  returnInfo: ReturnInfo;
  descriptionInfo: string;
}

export type TsFunctionNode =
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration
  | ts.ConstructorDeclaration;

export interface FunctionMatchResult {
  matched: boolean;
  returnType: string;
  params: ParamsInfo;
}
