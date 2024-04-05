import { ConfigSection } from '@/constants';
import { initVCSProvider } from '@/init';
import { removeSpecialString } from '@/utils/str';
import { convertDateFormatToRegex } from '@/utils/utils';

import vscode from 'vscode';
import { Config } from '../typings/types';
import { FileHashManager } from './FileHashManager';

export async function fileChanged(
  config: Config,
  document: vscode.TextDocument,
  fileHashManager: FileHashManager,
) {
  // 只支持脏文档时，如果当前文档不是脏文档，则标记跳过
  if (config.updateHeaderForModifiedFilesOnly && !document.isDirty) {
    return true;
  }

  const vcsProvider = await initVCSProvider();
  // 是否跟踪
  const isTracked = await vcsProvider.isTracked(document.fileName);
  // 是否有修改
  const isChanged = isTracked ? await vcsProvider.isChanged(document.fileName) : false;
  // 有跟踪则判断是否有修改
  // 没有跟踪则判断是否有 hash 更新
  return (isTracked && isChanged) || fileHashManager.isHashUpdated(document);
}

// 避免 prettier 这类格式后处理空格，导致文件头内容变化影响判断
export function headerChanged(
  document: vscode.TextDocument,
  fileheaderRange: vscode.Range,
  newFileheader: string,
  config: Config,
) {
  const originContent = document.getText(fileheaderRange)?.replace(/\r\n/g, '\n');
  const originContentLineCount = originContent.split('\n').length;
  const dateformat = config.get(ConfigSection.dateFormat, 'YYYY-MM-DD HH:mm:ss');
  const dateRegex = new RegExp(convertDateFormatToRegex(dateformat), 'g');

  let headerSame: boolean = false;
  if (originContentLineCount > 1) {
    let originContentLines = originContent.split('\n').map((line) => line.trim());
    if (
      originContentLineCount > 3 &&
      !originContentLines[0].match(/[a-zA-Z0-9]/) &&
      !originContentLines[originContentLines.length - 1].match(/[a-zA-Z0-9]/)
    ) {
      originContentLines = originContentLines.slice(1, -1);
    }
    const originContentProcessed = removeSpecialString(originContentLines.join('\n'), [dateRegex]);

    let newFileheaderLines = newFileheader.split('\n').map((line) => line.trim());
    if (
      newFileheaderLines.length > 3 &&
      !newFileheaderLines[0].match(/[a-zA-Z0-9]/) &&
      !newFileheaderLines[newFileheaderLines.length - 1].match(/[a-zA-Z0-9]/)
    ) {
      newFileheaderLines = newFileheaderLines.slice(1, -1);
    }
    const newFileheaderProcessed = removeSpecialString(newFileheaderLines.join('\n'), [dateRegex]);

    headerSame = originContentProcessed === newFileheaderProcessed;
  } else {
    const originContentProcessed = removeSpecialString(originContent, dateRegex);
    const newFileheaderProcessed = removeSpecialString(newFileheader, dateRegex);
    headerSame = originContentProcessed === newFileheaderProcessed;
  }
  return !headerSame;
}
