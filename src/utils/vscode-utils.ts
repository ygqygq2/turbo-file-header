import { CustomError, ErrorCode } from '@/error';
import { errorHandler } from '@/extension';
import * as vscode from 'vscode';

/**
 * 获取当前活动文档的工作区
 * 如果当前没有活动文档，则提示选择工作区
 * @returns
 */
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

/**
 * 将选定的文本区域在指定行数上下移动
 */
export function offsetSelection(selection: vscode.Selection, offsetLine: number) {
  const newAnchor = new vscode.Position(
    selection.anchor.line + offsetLine,
    selection.anchor.character,
  );
  const newActive = new vscode.Position(
    selection.active.line + offsetLine,
    selection.active.character,
  );
  return new vscode.Selection(newAnchor, newActive);
}

/**
 * 获取指定范围内的文本内容
 * @param document - 活动文档
 * @param startLine - 起始行
 * @param endLine - 结束行
 */
export function getSpecificLinesContent(
  document: vscode.TextDocument,
  startLine: number,
  endLine: number,
) {
  let content = '';
  for (let i = startLine; i <= endLine; i++) {
    const line = document.lineAt(i);
    content += line.text + '\n';
  }
  return content;
}

/**
 * 判断范围的终点是在行首、行尾、还是行中
 * @param document
 * @param range
 * @returns
 */
export function isLineStartOrEnd(document: vscode.TextDocument, range: vscode.Range) {
  // 获取range结束位置在其所在行中的偏移量（即列号）
  const endCharacter = range.end.character;
  // 获取当前行的总长度
  const lineLength = document.lineAt(range.end.line).range.end.character;

  if (endCharacter === 0) {
    // 如果偏移量为0，表示在行的开始位置
    return 0;
  } else if (endCharacter === lineLength) {
    // 如果偏移量等于行的长度，表示在行的结束位置
    return 1;
  } else {
    // 其他情况，表示既不在行的开始也不在行的结束
    return -1;
  }
}
