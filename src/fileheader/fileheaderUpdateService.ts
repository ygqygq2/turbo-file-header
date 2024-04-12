import vscode from 'vscode';

import { logger } from '@/extension';
import { FileMatcher } from '@/extension-operate/FileMatcher';
import { LanguageProvider } from '@/language-providers';
import { hasShebang } from '@/utils/utils';
import { isLineStartOrEnd } from '@/utils/vscode-utils';

import { Config, IFileheaderVariables } from '../typings/types';
import { FileHashManager } from './FileHashManager';
import { fileChanged, headerChanged } from './fileheaderChangeService';
import { OriginFileheaderInfo } from './types';

export async function shouldUpdate(
  fileMatcher: FileMatcher,
  fileHashManager: FileHashManager,
  document: vscode.TextDocument,
  originFileheaderInfo: OriginFileheaderInfo,
  newFileheader: string,
  config: Config,
  allowInsert: boolean,
  newFile: boolean,
) {
  // 新文件先根据匹配模式判断是否添加文件头，新文件肯定是没内容
  if (newFile) {
    return fileMatcher.shouldAddHeader(document.uri.fsPath);
  }

  const { range, contentWithoutHeader } = originFileheaderInfo;
  const content = document.getText();
  // 没有内容，认为可以增加文件头
  if (!content) {
    return true;
  }

  // 只有文件头时，认为没有修改
  if (!contentWithoutHeader) {
    return false;
  }

  // 范围开始和结束不相同（有文件头）
  const noHeader = range.start.isEqual(range.end);

  if (!allowInsert && noHeader) {
    // 不允许插入，且范围开始和结束相同（没有文件头的空间）
    return false;
  } else if (noHeader) {
    // 没文件头，允许插入，直接返回 true
    return true;
  } else {
    const isMainTextChange = fileHashManager.isMainTextUpdated(document, contentWithoutHeader);
    const fileIsChanged = await fileChanged(config, document, fileHashManager);
    if (!noHeader && fileIsChanged && isMainTextChange) {
      // 文件有修改且是正文，则直接返回
      // 文件有修改，则第一次认为是有修改，缓存起来
      return true;
    } else if (!noHeader && fileIsChanged && !isMainTextChange) {
      // 文件有修改，不是正文，就判断文件头是否相同
      return headerChanged(document, range, newFileheader, config);
    }

    // 都不是，则认为都没有修改
    return false;
  }
}

export async function processFileheaderInsertionOrReplacement(
  fileMatcher: FileMatcher,
  fileHashManager: FileHashManager,
  editor: vscode.TextEditor,
  provider: LanguageProvider,
  originFileheaderInfo: OriginFileheaderInfo,
  fileheaderVariable: IFileheaderVariables,
  config: Config,
  allowInsert: boolean,
  newFile: boolean,
) {
  const document = editor?.document;
  const { useJSDocStyle } = config;
  const isJsTs = provider.languages.some((lang) =>
    ['typescript', 'javascript', 'javascriptreact', 'typescriptreact'].includes(lang),
  );
  const useJSDocStyleParam = isJsTs && useJSDocStyle;
  const fileheader = provider.generateFileheader(fileheaderVariable, useJSDocStyleParam);
  const startLine = provider.startLineOffset + (hasShebang(document.getText()) ? 1 : 0);
  const { range } = originFileheaderInfo;

  const isShouldUpdate = await shouldUpdate(
    fileMatcher,
    fileHashManager,
    document,
    originFileheaderInfo,
    fileheader,
    config,
    allowInsert,
    newFile,
  );
  if (!isShouldUpdate) {
    logger.info('Not need update filer header:', document.uri.fsPath);
    return false;
  }

  // 确保文件头信息后只有一行空行
  const endIsLinePosition = isLineStartOrEnd(document, range);
  let lineAfterHeader = endIsLinePosition === 0 ? range.end.line : range.end.line + 1;
  while (
    lineAfterHeader < document.lineCount - 1 &&
    document.lineAt(lineAfterHeader).isEmptyOrWhitespace
  ) {
    lineAfterHeader++;
  }

  // 哪个位置在前面，则为替换开始位置
  const start = range.start.line;
  const replaceStartLine = start >= startLine ? startLine : start;
  // 当文件头信息开始位置在后面些时，则使用空行补上，以达到文件头往后移的效果
  const emptyLines = '\n'.repeat(startLine - start);
  const replaceFileheader = start <= startLine ? emptyLines + fileheader : fileheader;

  // 原来有文件头（文件开头的注释都当作文件头信息）
  // 原来没有文件头
  // 都可以用 replace
  const rangeToReplace = new vscode.Range(
    document.lineAt(replaceStartLine).range.start,
    document.lineAt(lineAfterHeader).range.start,
  );
  await editor.edit((editBuilder) => {
    editBuilder.replace(rangeToReplace, replaceFileheader + '\n\n');
  });

  await document.save();
  logger.info('File header updated:', document.uri.fsPath);
  return true;
}
