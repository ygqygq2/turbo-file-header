import { FunctionCommentInfo } from '@/function-params-parser/types';
import { Config } from '@/typings/types';
import * as fs from 'fs-extra';
import path from 'path';
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
    if (workspaces && workspaces.length === 1) {
      activeWorkspace = workspaces[0];
    } else if (workspaces && workspaces.length > 0) {
      const picked = await vscode.window.showQuickPick(
        workspaces.map((workspace) => ({ label: workspace.name, workspace })),
        { title: 'Select which workspace for add custom fileheader template' },
      );
      activeWorkspace = picked?.workspace;
    } else {
      return undefined;
    }
  }

  return activeWorkspace;
}

/**
 * gets the workspace folder by name
 * @param workspaceFolderName Workspace folder name
 */
export const getWorkspaceFolderUri = (workspaceFolderName: string) => {
  const workspaceFolder = vscode.workspace.workspaceFolders!.find((folder) => {
    return folder.name === workspaceFolderName;
  });
  if (!workspaceFolder) {
    throw new Error(
      'Folder not found in workspace. Did you forget to add the test folder to test.code-workspace?',
    );
  }
  return workspaceFolder!.uri;
};

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

/**
 * 在指定匹配单词最后添加光标
 * @param document
 * @param string
 */
export function addSelectionAfterString(document: vscode.TextDocument, string: string) {
  const editor = vscode.window.activeTextEditor;
  if (editor) {
    // 匹配 string 单词
    // 光标位置设置为 string 这一行的最后
    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i);
      if (line.text.includes(string)) {
        const position = line.range.end;
        editor.selection = new vscode.Selection(position, position);
        break;
      }
    }
  }
}

export function getLanguageIdByExt(config: Config, ext: string) {
  const languagesConfig = config.languages;
  const languageConfig = languagesConfig.find((languageConfig) =>
    languageConfig.extensions.includes(ext),
  );
  return languageConfig ? languageConfig.id : undefined;
}

export function getBlockComment(comments: vscode.CommentRule): {
  blockCommentStart: string;
  blockCommentEnd: string;
} {
  let blockCommentStart: string = '';
  let blockCommentEnd: string = '';
  // 确保 this.comments 和 this.comments.blockComments 都不是 undefined
  if (comments && comments.blockComment && comments.blockComment.length) {
    // 当存在块注释时使用块注释
    blockCommentStart = comments.blockComment[0];
    blockCommentEnd = comments.blockComment[1];
  } else if (comments && comments.lineComment) {
    // 当不存在块注释但存在行注释时，使用行注释作为块注释的开始和结束
    blockCommentStart = comments.lineComment;
    blockCommentEnd = comments.lineComment;
  }
  return { blockCommentStart, blockCommentEnd };
}

export function isCommentLine(
  comments: vscode.CommentRule,
  lineText: string,
  isInsideBlockComment: boolean,
): boolean {
  const { blockCommentStart, blockCommentEnd } = getBlockComment(comments);
  const { lineComment } = comments;

  // 块注释
  if (comments && comments.blockComment && comments.blockComment.length) {
    // 处于块注释中，不管有没有结束，则为注释行
    if (isInsideBlockComment) {
      return true;
    }

    // 块注释开始、结束都属于注释行
    return lineText.includes(blockCommentStart) || lineText.includes(blockCommentEnd);
  } else if (lineComment) {
    return lineText.trim().startsWith(lineComment);
  }
  return false;
}

export function updateBlockCommentState(
  comments: vscode.CommentRule,
  lineText: string,
  isInsideBlockComment: boolean,
  direction: 'up' | 'down' = 'down',
): boolean {
  const { blockCommentStart, blockCommentEnd } = getBlockComment(comments);

  // 检查是否为Python或其他使用相同标记作为块注释开始和结束的语言
  if (blockCommentStart === blockCommentEnd) {
    // 如果找到块注释标记，并且我们当前不在块注释内，那么这表示块注释的开始
    if (direction === 'down') {
      if (lineText.includes(blockCommentStart) && !isInsideBlockComment) {
        isInsideBlockComment = true;
      } else if (lineText.includes(blockCommentEnd) && isInsideBlockComment) {
        // 如果我们已经在块注释内，并且再次遇到块注释标记，那么这表示块注释的结束
        isInsideBlockComment = false;
      }
    } else {
      if (lineText.includes(blockCommentEnd) && !isInsideBlockComment) {
        isInsideBlockComment = true;
      } else if (lineText.includes(blockCommentStart) && isInsideBlockComment) {
        isInsideBlockComment = false;
      }
    }
  } else {
    // 对于开始和结束标记不同的常规情况
    if (direction === 'down') {
      if (lineText.includes(blockCommentStart)) {
        isInsideBlockComment = true;
      }
      if (lineText.includes(blockCommentEnd)) {
        isInsideBlockComment = false;
      }
    } else {
      if (lineText.includes(blockCommentEnd)) {
        isInsideBlockComment = true;
      }
      if (lineText.includes(blockCommentStart)) {
        isInsideBlockComment = false;
      }
    }
  }

  return isInsideBlockComment;
}

export function generateFunctionComment(functionCommentInfo: FunctionCommentInfo): string {
  const { paramsInfo, returnInfo, descriptionInfo } = functionCommentInfo;

  let functionComment = '/**\n';
  functionComment += ` * @description ${descriptionInfo}\n`;

  for (const returnKey in returnInfo) {
    functionComment += ` * @return ${returnKey} {${returnInfo[returnKey].type}} ${returnInfo[returnKey].description}\n`;
  }

  for (const paramName in paramsInfo) {
    functionComment += ` * @param ${paramName} {${paramsInfo[paramName].type}} ${paramsInfo[paramName].description}\n`;
  }

  functionComment += ' */';
  return functionComment;
}

export async function getText(workspaceFolderName: string, expectedFile: string) {
  const base = getWorkspaceFolderUri(workspaceFolderName);
  const expectedPath = path.join(base.fsPath, expectedFile);
  const expected = await fs.readFile(expectedPath, 'utf8');
  return expected;
}
