import vscode from 'vscode';
import { difference } from 'lodash';
import { getStringHash } from '../utils/utils';

export class FileHashMemento {
  originRecords: Map<string, string> = new Map();
  records: Map<string, string> = new Map();

  private calculate(source: string) {
    return getStringHash(source);
  }

  set(document: vscode.TextDocument) {
    const fsPath = document.uri.fsPath;
    const hash = this.calculate(document.getText());
    if (!this.originRecords.has(fsPath)) {
      this.originRecords.set(fsPath, hash);
    } else {
      this.records.set(fsPath, hash);
    }
  }

  update(documents: vscode.TextDocument[]) {
    const originKeys = Array.from(this.records.keys());
    const newDocumentMap = new Map(documents.map((d) => [d.uri.fsPath, d] as const));
    const newDocumentKey = Array.from(newDocumentMap.keys());
    const removedKeys = difference(originKeys, newDocumentKey);
    const newInsertKeys = difference(newDocumentKey, originKeys);

    removedKeys.forEach((key) => this.records.delete(key));
    newInsertKeys.forEach((key) => this.set(newDocumentMap.get(key)!));
  }

  remove(document: vscode.TextDocument) {
    const fsPath = document.uri.fsPath;
    this.records.delete(fsPath);
    this.originRecords.delete(fsPath);
  }

  isHashUpdated(document: vscode.TextDocument, skipCheckHash = false) {
    const fsPath = document.uri.fsPath;
    const content = document.getText();
    // 第一次记录的 hash
    const originHash = this.originRecords.get(fsPath);

    if (!originHash || !content) {
      return !content;
    }

    const hash = this.records.get(fsPath);
    return skipCheckHash || hash !== originHash;
  }
}
