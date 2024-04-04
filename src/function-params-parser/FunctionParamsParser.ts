import * as vscode from 'vscode';
import { FunctionParamsInfo } from './types';

export abstract class FunctionParamsParser {
  public abstract getFunctionParamsAtCursor(activeEditor: vscode.TextEditor): FunctionParamsInfo;
}
