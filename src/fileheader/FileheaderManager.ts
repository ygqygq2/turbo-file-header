import vscode from 'vscode';
import output from '@/error/output';
import path from 'path';
import fs from 'fs';
import { initVCSProvider } from '@/init';
import { errorHandler } from '@/extension';
import { convertDateFormatToRegex, hasShebang } from '@/utils/utils';
import { getActiveDocumentWorkspace, isLineStartOrEnd } from '@/utils/vscode-utils';
import { withProgress } from '@/utils/with-progress';
import { FileheaderVariableBuilder } from './FileheaderVariableBuilder';
import { FileHashMemento } from './FileHashMemento';
import { CustomError } from '@/error/ErrorHandler';
import { ErrorCode, errorCodeMessages } from '@/error/ErrorCodeMessage.enum';
import { FileheaderProviderLoader } from './FileheaderProviderLoader';
import { LanguageProvider } from '@/language-providers';
import { VscodeInternalProvider } from '@/language-providers/VscodeInternalProvider';
import { IFileheaderVariables } from '../typings/types';
import { ConfigManager } from '@/configuration/ConfigManager';
import { Configuration } from '@/configuration/types';
import { ConfigSection } from '@/constants';
import { FileMatcher } from '@/extension-operate/FileMatcher';

type UpdateFileheaderManagerOptions = {
  // 是否错误提示
  silent?: boolean;
  // 是否允许插入
  allowInsert?: boolean;
  // 是否插入光标位置
  addSelection?: boolean;
};

type OriginFileheaderInfo = {
  range: vscode.Range;
  variables?: IFileheaderVariables | undefined;
  contentWithoutHeader: string;
};

export class FileheaderManager {
  private configManager: ConfigManager;
  private providers: LanguageProvider[] = [];
  private fileheaderProviderLoader: FileheaderProviderLoader;
  private fileHashMemento: FileHashMemento;
  private fileheaderVariableBuilder: FileheaderVariableBuilder;
  private cachedContent: { [key: string]: string } = {};

  constructor(
    configManager: ConfigManager,
    fileheaderProviderLoader: FileheaderProviderLoader,
    fileHashMemento: FileHashMemento,
    fileheaderVariableBuilder: FileheaderVariableBuilder,
  ) {
    this.configManager = configManager;
    this.fileheaderProviderLoader = fileheaderProviderLoader;
    this.fileHashMemento = fileHashMemento;
    this.fileheaderVariableBuilder = fileheaderVariableBuilder;
  }

  public async loadProviders(forceRefresh = false) {
    this.providers = await this.fileheaderProviderLoader.loadProviders(forceRefresh);
  }

  private getConfiguration() {
    return this.configManager.getConfiguration();
  }

  private getLanguageIdByExt(ext: string) {
    const config = this.getConfiguration();
    const languagesConfig = config.languages;
    const languageConfig = languagesConfig.find((languageConfig) =>
      languageConfig.extensions.includes(ext),
    );
    return languageConfig ? languageConfig.id : undefined;
  }

  private async findProvider(document: vscode.TextDocument) {
    let languageId = document.languageId;
    // 如果没有识别到自定义语言，则尝试使用后缀匹配
    if (languageId === 'plaintext') {
      const ext = path.extname(document.uri.fsPath).slice(1);
      const tmpLanguageId = this.getLanguageIdByExt(`.${ext}`);
      if (tmpLanguageId) {
        languageId = tmpLanguageId;
      }
    }

    for (const provider of this.providers) {
      // 只有自定义 provider 有 provider.workspaceScopeUri
      let isWorkspaceMatch: boolean;
      if (!provider.workspaceScopeUri) {
        isWorkspaceMatch = true;
      } else {
        const documentWorkspace = vscode.workspace.getWorkspaceFolder(document.uri)?.uri.path;
        const providerWorkspace = provider.workspaceScopeUri?.path;
        isWorkspaceMatch = documentWorkspace === providerWorkspace;
      }
      if (!isWorkspaceMatch) {
        continue;
      }

      const isLanguageMatch = await (async () => {
        if (provider instanceof VscodeInternalProvider) {
          await provider.getBlockCommentFromVscode(languageId);
          return true;
        }
        return provider.languages.includes(languageId);
      })();

      if (isLanguageMatch) {
        return provider;
      }
    }
    output.info(new CustomError(ErrorCode.LanguageProviderNotFound));
  }

  private getOriginFileheaderRange(document: vscode.TextDocument, provider: LanguageProvider) {
    const range = provider.getOriginFileheaderRange(document);
    return range;
  }

  private getOriginFileheaderInfo(document: vscode.TextDocument, provider: LanguageProvider) {
    const range = this.getOriginFileheaderRange(document, provider);
    const contentWithoutHeader = provider.getOriginContentWithoutFileheader(document, range);

    const pattern = provider.getOriginFileheaderRegExp(document.eol);
    const info: {
      range: vscode.Range;
      variables?: IFileheaderVariables;
      contentWithoutHeader: string;
    } = {
      range,
      variables: undefined,
      contentWithoutHeader,
    };

    const contentWithHeader = document.getText(range);
    const result = contentWithHeader.match(pattern);
    if (result) {
      info.variables = result.groups;
    }
    return info;
  }

  private async fileIsChanged(
    config: Configuration & vscode.WorkspaceConfiguration,
    document: vscode.TextDocument,
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
    return (isTracked && isChanged) || this.fileHashMemento.isHashUpdated(document);
  }

  private removeSpecialString(fileHeaderContent: string, regex: RegExp | RegExp[]): string {
    if (Array.isArray(regex)) {
      // 如果 regex 是一个数组，将所有正则表达式匹配到的内容替换为空字符串
      return regex.reduce((content, r) => content.replace(r, ''), fileHeaderContent);
    } else {
      // 如果 regex 是一个单独的正则表达式，将匹配到的内容替换为空字符串
      return fileHeaderContent.replace(regex, '');
    }
  }

  // 避免 prettier 这类格式后处理空格，导致文件头内容变化影响判断
  private headerChanged(
    document: vscode.TextDocument,
    fileheaderRange: vscode.Range,
    newFileheader: string,
    config: Configuration & vscode.WorkspaceConfiguration,
  ) {
    const originContent = document.getText(fileheaderRange)?.replace(/\r\n/g, '\n');
    const originContentLineCount = originContent.split('\n').length;
    const dateformat = config.get(ConfigSection.dateFormat, 'YYYY-MM-DD HH:mm:ss');
    const dateRegex = new RegExp(convertDateFormatToRegex(dateformat), 'g');
    const descriptionRegex = new RegExp('description.*');

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
      const originContentProcessed = this.removeSpecialString(originContentLines.join('\n'), [
        dateRegex,
        descriptionRegex,
      ]);

      let newFileheaderLines = newFileheader.split('\n').map((line) => line.trim());
      if (
        newFileheaderLines.length > 3 &&
        !newFileheaderLines[0].match(/[a-zA-Z0-9]/) &&
        !newFileheaderLines[newFileheaderLines.length - 1].match(/[a-zA-Z0-9]/)
      ) {
        newFileheaderLines = newFileheaderLines.slice(1, -1);
      }
      const newFileheaderProcessed = this.removeSpecialString(newFileheaderLines.join('\n'), [
        dateRegex,
        descriptionRegex,
      ]);

      headerSame = originContentProcessed === newFileheaderProcessed;
    } else {
      const originContentProcessed = this.removeSpecialString(originContent, dateRegex);
      const newFileheaderProcessed = this.removeSpecialString(newFileheader, dateRegex);
      headerSame = originContentProcessed === newFileheaderProcessed;
    }
    return !headerSame;
  }

  private async shouldUpdate(
    document: vscode.TextDocument,
    originFileheaderInfo: OriginFileheaderInfo,
    newFileheader: string,
    config: Configuration & vscode.WorkspaceConfiguration,
    allowInsert: boolean,
  ) {
    const { range, contentWithoutHeader } = originFileheaderInfo;
    const content = document.getText();
    // 没有内容，认可可以增加文件头
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
      const isMainTextChange = this.fileHashMemento.isMainTextUpdated(
        document,
        contentWithoutHeader,
      );
      const fileIsChanged = await this.fileIsChanged(config, document);
      if (!noHeader && fileIsChanged && isMainTextChange) {
        // 文件有修改且是正文，则直接返回
        // 文件有修改，则第一次认为是有修改，缓存起来
        return true;
      } else if (!noHeader && fileIsChanged && !isMainTextChange) {
        // 文件有修改，不是正文，就判断文件头是否相同
        return this.headerChanged(document, range, newFileheader, config);
      }

      // 都不是，则认为都没有修改
      return false;
    }
  }

  private async processFileheaderInsertionOrReplacement(
    document: vscode.TextDocument,
    provider: LanguageProvider,
    originFileheaderInfo: OriginFileheaderInfo,
    fileheaderVariable: IFileheaderVariables,
    config: Configuration & vscode.WorkspaceConfiguration,
    allowInsert: boolean,
    _silent: boolean,
  ) {
    const editor = await vscode.window.showTextDocument(document);
    const { useJSDocStyle } = config;
    const isJsTs = provider.languages.some((lang) =>
      ['typescript', 'javascript', 'javascriptreact', 'typescriptreact'].includes(lang),
    );
    const useJSDocStyleParam = isJsTs && useJSDocStyle;
    const fileheader = provider.generateFileheader(fileheaderVariable, useJSDocStyleParam);
    const startLine = provider.startLineOffset + (hasShebang(document.getText()) ? 1 : 0);
    const { range } = originFileheaderInfo;

    const shouldUpdate = await this.shouldUpdate(
      document,
      originFileheaderInfo,
      fileheader,
      config,
      allowInsert,
    );
    if (!shouldUpdate) {
      output.info('Not need update filer header:', document.uri.fsPath);
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
    output.info('File header updated:', document.uri.fsPath);
    return true;
  }

  public async updateFileheader(
    document: vscode.TextDocument,
    {
      allowInsert = true,
      silent = false,
      addSelection = false,
    }: UpdateFileheaderManagerOptions = {},
  ) {
    // console.log("🚀 ~ file: FileheaderManager.ts:243 ~ allowInsert:", allowInsert);
    const config = this.getConfiguration();
    const provider = await this.findProvider(document);

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

    const originFileheaderInfo = this.getOriginFileheaderInfo(document, provider);
    let fileheaderVariable: IFileheaderVariables;
    try {
      fileheaderVariable = await this.fileheaderVariableBuilder?.build(
        config,
        document.uri,
        provider,
        originFileheaderInfo.variables,
      );
    } catch (error) {
      !silent && errorHandler.handle(new CustomError(ErrorCode.VariableBuilderFail, error));
      return;
    }

    const result = await this.processFileheaderInsertionOrReplacement(
      document,
      provider,
      originFileheaderInfo,
      fileheaderVariable,
      config,
      allowInsert,
      silent,
    );
    if (result && addSelection) {
      this.addSelectionAfterDescription(document);
    }

    this.fileHashMemento.set(document);
  }

  private addSelectionAfterDescription(document: vscode.TextDocument) {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
      // 匹配 description 单词
      // 光标位置设置为 description 这一行的最后
      for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i);
        if (line.text.includes('description')) {
          const position = line.range.end;
          editor.selection = new vscode.Selection(position, position);
          break;
        }
      }
    }
  }

  public recordOriginFileHash(documents: readonly vscode.TextDocument[]) {
    for (const document of documents) {
      this.fileHashMemento.set(document);
    }
  }

  public updateOriginFileHash(document: vscode.TextDocument) {
    this.fileHashMemento.set(document);
  }

  private async findFiles() {
    const activeWorkspace = await getActiveDocumentWorkspace();
    if (!activeWorkspace) {
      output.info('Please check your workspace');
      return;
    }

    const configDir = path.join(activeWorkspace.uri.fsPath, '.vscode');
    // 确保目标目录存在
    if (!fs.existsSync(configDir)) {
      try {
        fs.mkdirSync(configDir, { recursive: true });
      } catch (error) {
        errorHandler.handle(new CustomError(ErrorCode.CreateDirFail, configDir, error));
      }
    }

    const config = await this.configManager.getConfigurationFromCustomConfig();
    if (!config || !config.findFilesConfig) {
      errorHandler.handle(new CustomError(ErrorCode.GetCustomConfigFail));
      return;
    }

    const findFilesConfig = config?.findFilesConfig || {
      include: '**/tmp/*.{ts,js}',
      exclude: '**/{node_modules,dist}/**',
    };
    const fileMatcher = new FileMatcher(findFilesConfig);
    const files = await fileMatcher.findFiles();
    return files;
  }

  public async batchUpdateFileheader() {
    let failedFiles = (await this.findFiles()) || [];
    let reprocessedFiles: vscode.Uri[] = [];

    await withProgress(
      'Processing schedule',
      async () => {
        while (failedFiles.length > 0) {
          for (const file of failedFiles) {
            try {
              const document = await vscode.workspace.openTextDocument(file);
              await this.updateFileheader(document);
              await document.save();
              vscode.commands.executeCommand('workbench.action.closeActiveEditor');
            } catch (error) {
              reprocessedFiles.push(file);
              errorHandler.handle(
                new CustomError(ErrorCode.UpdateFileHeaderFail, file.fsPath, error),
              );
            }
          }

          failedFiles = reprocessedFiles;
          reprocessedFiles = [];

          if (failedFiles.length === 0) {
            break;
          }
        }
      },
      failedFiles.length,
    );
  }
}
