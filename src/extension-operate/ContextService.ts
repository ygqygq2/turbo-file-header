import * as vscode from 'vscode';

export class ContextService {
  private context: vscode.ExtensionContext | undefined;

  setContext(context: vscode.ExtensionContext) {
    this.context = context;
  }

  getContext(): vscode.ExtensionContext | undefined {
    return this.context;
  }
}
