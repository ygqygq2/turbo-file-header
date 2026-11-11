import * as vscode from 'vscode';

import { IFileheaderVariables } from '@/typings/types';

export type UpdateFileheaderManagerOptions = {
  // 是否允许插入
  allowInsert?: boolean;
  // 是否插入光标位置
  addSelection?: boolean;
  // 是否新建文件
  newFile?: boolean;
  // 更新后是否自动保存（默认 true；在 onWillSave 事务内更新时应关闭，避免二次写盘）
  autoSave?: boolean;
};

export type OriginFileheaderInfo = {
  range: vscode.Range;
  variables?: IFileheaderVariables | undefined;
  contentWithoutHeader: string;
};

export type VariableBuilder =
  | ((param?: string) => Promise<string | undefined>)
  | (() => Promise<string | undefined>);
