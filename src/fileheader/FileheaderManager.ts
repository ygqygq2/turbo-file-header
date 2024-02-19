import vscode from 'vscode';
import { fileheaderProviderLoader } from './FileheaderProviderLoader';
import { FileheaderLanguageProvider } from '../fileheader-language-providers';
import { hasShebang } from '../utils/utils';
import { FileheaderVariableBuilder } from './FileheaderVariableBuilder';
import { IFileheaderVariables } from '../typings/types';
import { fileHashMemento } from './FileHashMemento';
import { vscProvider } from '../vsc-provider';
import { CustomError, errorHandler } from '@/error/ErrorHandler';
import { ErrorCode, errorCodeMessages } from '@/error/ErrorCodeMessage.enum';
import { VscodeInternalLanguageProvider } from '@/fileheader-language-providers/VscodeInternalLanguageProvider';

type UpdateFileheaderManagerOptions = {
  silent?: boolean;
  allowInsert?: boolean;
};

class FileheaderManager {
  private _providers: FileheaderLanguageProvider[] = [];

  public async loadProviders() {
    this._providers = await fileheaderProviderLoader.loadProviders();
  }

  private findProvider(document: vscode.TextDocument) {
    const languageId = document.languageId;
    return this._providers.find((provider) => {
      if (
        provider.workspaceScopeUri &&
        vscode.workspace.getWorkspaceFolder(document.uri)?.uri.path !==
          provider.workspaceScopeUri?.path
      ) {
        return false;
      }
      // provider.languages 是空数组时，使用 VscodeInternalLanguageProvider
      if (provider.languages.length === 0 && provider instanceof VscodeInternalLanguageProvider) {
        provider.getBlockComment(languageId);
        return true;
      }
      return provider.languages.some((l) => l === languageId);
    });
  }

  private getOriginFileheaderInfo(
    document: vscode.TextDocument,
    provider: FileheaderLanguageProvider,
  ) {
    const source = document.getText();
    const pattern = provider.getOriginFileheaderRegExp(document.eol);
    const range: {
      start: number;
      end: number;
      content?: string;
      variables?: IFileheaderVariables;
    } = {
      start: -1,
      end: -1,
      content: undefined,
      variables: undefined,
    };
    const result = source.match(pattern);
    if (result) {
      const match = result[0];
      range.content = match;
      range.start = result.index!;
      range.variables = result.groups;
      range.end = range.start + match.length;
    }
    return range;
  }

  private async shouldSkipReplace(document: vscode.TextDocument) {
    // if the file in vscode editor not dirty, we should skip the replace
    if (!document.isDirty) {
      return true;
    }

    // if there is a change in VCS provider, we should replace the fileheader
    const isTracked = await vscProvider.isTracked(document.fileName);
    const hasChanged = isTracked && (await vscProvider.hasChanged(document.fileName));

    return !hasChanged && fileHashMemento.has(document);
  }

  public async updateFileheader(
    document: vscode.TextDocument,
    { allowInsert = true, silent = false }: UpdateFileheaderManagerOptions = {},
  ) {
    const provider = this.findProvider(document);

    if (!provider) {
      !silent &&
        !allowInsert &&
        errorHandler.handle(
          new CustomError(
            ErrorCode.LanguageNotSupport,
            errorCodeMessages[ErrorCode.LanguageNotSupport],
          ),
        );
      return;
    }

    const startLine = provider.startLineOffset + (hasShebang(document.getText()) ? 1 : 0);

    const originFileheaderInfo = this.getOriginFileheaderInfo(document, provider);
    const config = vscode.workspace.getConfiguration();

    let fileheaderVariable: IFileheaderVariables;

    try {
      fileheaderVariable = await new FileheaderVariableBuilder().build(
        config,
        document.uri,
        provider,
        originFileheaderInfo.variables,
      );
    } catch (error) {
      !silent && errorHandler.handle(new CustomError(ErrorCode.VariableBuilderFail, error));
      return;
    }

    const editor = await vscode.window.showTextDocument(document);
    const fileheader = provider.getFileheader(fileheaderVariable);

    const shouldSkipReplace =
      originFileheaderInfo.start !== -1 &&
      (originFileheaderInfo.content?.replace(/\r\n/g, '\n') === fileheader ||
        (await this.shouldSkipReplace(document)));

    if (shouldSkipReplace) {
      return;
    }

    let originStart: vscode.Position;
    if (
      originFileheaderInfo.start !== -1 &&
      (originStart = document.positionAt(originFileheaderInfo.start)) &&
      originStart.line === startLine
    ) {
      const originEnd = document.positionAt(originFileheaderInfo.end);
      await editor.edit((editBuilder) => {
        editBuilder.replace(new vscode.Range(originStart, originEnd), fileheader);
      });
    } else if (allowInsert) {
      const onlyHasSingleLine = document.lineCount === 1;
      const isLeadingLineEmpty = document.lineAt(startLine).isEmptyOrWhitespace;
      const shouldInsertLineBreak = !isLeadingLineEmpty || onlyHasSingleLine;
      const value = shouldInsertLineBreak ? fileheader + '\n' : fileheader;
      await editor.edit((editBuilder) => {
        editBuilder.insert(new vscode.Position(startLine, 0), value);
      });
      await document.save();
    }

    fileHashMemento.set(document);
  }

  public recordOriginFileHash(documents: readonly vscode.TextDocument[]) {
    for (const document of documents) {
      fileHashMemento.set(document);
    }
  }
}

export const fileheaderManager = new FileheaderManager();
