import ts from 'typescript';
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

export type TsFunctionNode =
  | ts.FunctionDeclaration
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration
  | ts.ConstructorDeclaration;
