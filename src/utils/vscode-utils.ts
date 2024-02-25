import { CustomError, ErrorCode } from '@/error';
import { errorHandler } from '@/extension';
import * as vscode from 'vscode';

export async function getActiveDocumentWorkspace(): Promise<vscode.WorkspaceFolder | undefined> {
  const activeDocumentUri = vscode.window.activeTextEditor?.document.uri;
  let activeWorkspace: vscode.WorkspaceFolder | undefined = undefined;

  if (activeDocumentUri) {
    activeWorkspace = vscode.workspace.getWorkspaceFolder(activeDocumentUri);
  } else {
    const workspaces = vscode.workspace.workspaceFolders;
    if (workspaces && workspaces.length > 0) {
      const picked = await vscode.window.showQuickPick(
        workspaces.map((workspace) => ({ label: workspace.name, workspace })),
        { title: 'Select which workspace for add custom fileheader template' },
      );
      activeWorkspace = picked?.workspace;
    } else {
      errorHandler.handle(new CustomError(ErrorCode.WorkspaceFolderNotFound));
    }
  }

  return activeWorkspace;
}
