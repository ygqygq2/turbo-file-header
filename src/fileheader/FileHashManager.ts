import { difference } from 'lodash';
import vscode from 'vscode';

import { getStringHash } from '../utils/utils';

export class FileHashManager {
  // 刚打开文件时的 hash
  originRecords: Map<string, string> = new Map();
  // 当前的 hash
  records: Map<string, string> = new Map();
  // 正文 hash
  mainTextRecords: Map<string, string> = new Map();

  private calculate(source: string) {
    return getStringHash(source);
  }

  public set(document: vscode.TextDocument) {
    const fsPath = document.uri.fsPath;
    const hash = this.calculate(document.getText());
    if (!this.originRecords.has(fsPath)) {
      this.originRecords.set(fsPath, hash);
    } else {
      this.records.set(fsPath, hash);
    }
  }

  public update(documents: vscode.TextDocument[]) {
    const originKeys = Array.from(this.records.keys());
    const newDocumentMap = new Map(documents.map((d) => [d.uri.fsPath, d] as const));
    const newDocumentKey = Array.from(newDocumentMap.keys());
    const removedKeys = difference(originKeys, newDocumentKey);
    const newInsertKeys = difference(newDocumentKey, originKeys);

    removedKeys.forEach((key) => this.records.delete(key));
    newInsertKeys.forEach((key) => this.set(newDocumentMap.get(key)!));
  }

  public remove(document: vscode.TextDocument) {
    const fsPath = document.uri.fsPath;
    this.records.delete(fsPath);
    this.originRecords.delete(fsPath);
  }

  public isHashUpdated(document: vscode.TextDocument, skipCheckHash = false) {
    const fsPath = document.uri.fsPath;
    const content = document.getText();
    // 第一次记录的 hash
    const originHash = this.originRecords.get(fsPath);

    if (!originHash || !content) {
      return !content;
    }

    const hash = this.records.get(fsPath);
    // 当前文件的 hash 没有时，说明文件没有更新，因为文件更新时会更新当前 hash
    if (hash === undefined) {
      return false;
    }
    return skipCheckHash || hash !== originHash;
  }

  public isMainTextUpdated(document: vscode.TextDocument, mainText: string) {
    const fsPath = document.uri.fsPath;
    if (this.mainTextRecords.get(fsPath) === this.calculate(mainText)) {
      return false;
    }
    this.mainTextRecords.set(fsPath, this.calculate(mainText));
    return true;
  }

  /**
   * Clear all hash records
   * Should be called when extension is deactivated
   */
  public clear() {
    this.originRecords.clear();
    this.records.clear();
    this.mainTextRecords.clear();
  }
}
