import { BaseProvider } from "@/base/BaseProvider";
import { ITemplateFunction, Template } from "@/typings/types";
import * as vscode from 'vscode';

export abstract class FunctionCommentProvider {
  protected getFunctionParams(document: vscode.TextDocument, range: vscode.Range): string[] {
  }
}
