import { IFileheaderVariables } from '@/typings/types';
import * as vscode from 'vscode';

export type UpdateFileheaderManagerOptions = {
  // 是否允许插入
  allowInsert?: boolean;
  // 是否插入光标位置
  addSelection?: boolean;
  // 是否新建文件
  newFile?: boolean;
};

export type OriginFileheaderInfo = {
  range: vscode.Range;
  variables?: IFileheaderVariables | undefined;
  contentWithoutHeader: string;
};

export type VariableBuilder =
  | ((param?: string) => Promise<string | undefined>)
  | (() => Promise<string | undefined>);
