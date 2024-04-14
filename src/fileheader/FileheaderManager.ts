import vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';
import { FileMatcher } from '@/extension-operate/FileMatcher';
import { FunctionParserLoader } from '@/function-params-parser/FunctionParserLoader';
import { FunctionCommentInfo, FunctionParamsInfo } from '@/function-params-parser/types';
import { LanguageProvider } from '@/language-providers';
import { addSelectionAfterString, generateFunctionComment } from '@/utils/vscode-utils';
import { updateProgress, withProgress } from '@/utils/with-progress';

import { IFileheaderVariables } from '../typings/types';
import { FileHashManager } from './FileHashManager';
import { FileheaderProviderLoader } from './FileheaderProviderLoader';
import { findProvider } from './fileheaderProviderLoaderService';
import { getOriginFileheaderInfo } from './fileheaderProviderService';
import { processFileheaderInsertionOrReplacement } from './fileheaderUpdateService';
import { FileheaderVariableBuilder } from './FileheaderVariableBuilder';
import { UpdateFileheaderManagerOptions } from './types';

export class FileheaderManager {
  private configManager: ConfigManager;
  private fileMatcher: FileMatcher;
  private providers: LanguageProvider[] = [];
  private fileheaderProviderLoader: FileheaderProviderLoader;
  private fileHashManager: FileHashManager;
  private fileheaderVariableBuilder: FileheaderVariableBuilder;
  private functionParserLoader: FunctionParserLoader;

  constructor(
    configManager: ConfigManager,
    fileMatcher: FileMatcher,
    fileheaderProviderLoader: FileheaderProviderLoader,
    fileHashManager: FileHashManager,
    fileheaderVariableBuilder: FileheaderVariableBuilder,
    functionParserLoader: FunctionParserLoader,
  ) {
    this.configManager = configManager;
    this.fileMatcher = fileMatcher;
    this.fileheaderProviderLoader = fileheaderProviderLoader;
    this.fileHashManager = fileHashManager;
    this.fileheaderVariableBuilder = fileheaderVariableBuilder;
    this.functionParserLoader = functionParserLoader;
  }

  public async loadProviders(forceRefresh = false) {
    this.providers = await this.fileheaderProviderLoader.loadProviders(forceRefresh);
  }

  public async updateFileheader(
    document: vscode.TextDocument,
    {
      allowInsert = true,
      addSelection = false,
      newFile = false,
    }: UpdateFileheaderManagerOptions = {},
  ) {
    const config = this.configManager.getConfiguration();
    const provider = await findProvider(this.configManager, this.providers, document);

    if (!provider) {
      !allowInsert && logger.handleError(new CustomError(ErrorCode.LanguageNotSupport));
      return;
    }

    const originFileheaderInfo = getOriginFileheaderInfo(
      document,
      provider,
      config.patternMultiline,
    );
    let fileheaderVariable: IFileheaderVariables;
    try {
      fileheaderVariable = await this.fileheaderVariableBuilder?.build(
        document.uri,
        provider,
        originFileheaderInfo.variables,
      );
    } catch (error) {
      logger.handleError(new CustomError(ErrorCode.VariableBuilderFail, error));
      return;
    }

    const editor = await vscode.window.showTextDocument(document, vscode.ViewColumn.Active, true);
    const result = await processFileheaderInsertionOrReplacement(
      this.fileMatcher,
      this.fileHashManager,
      editor,
      provider,
      originFileheaderInfo,
      fileheaderVariable,
      config,
      allowInsert,
      newFile,
    );
    if (!result) {
      return false;
    }

    if (addSelection) {
      addSelectionAfterString(document, 'description');
    }

    this.updateOriginFileHash(document);
    return true;
  }

  public async batchUpdateFileheader() {
    let failedFiles = (await this.fileMatcher.findFiles()) || [];
    const totalFiles = failedFiles.length;
    let processedFiles = 0;

    await withProgress(
      'Updating File Header',
      async (progress) => {
        while (failedFiles.length > 0) {
          let reprocessedFiles: vscode.Uri[] = [];
          for (const file of failedFiles) {
            try {
              const document = await vscode.workspace.openTextDocument(file);
              await this.updateFileheader(document);
              await document.save();
              vscode.commands.executeCommand('workbench.action.closeActiveEditor');
              processedFiles++;
              updateProgress(progress, processedFiles, totalFiles);
            } catch (error) {
              reprocessedFiles.push(file);
              logger.handleError(
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
      totalFiles,
    );
  }

  // 要被 DocumentHandler 调用
  public recordOriginFileHash(documents: readonly vscode.TextDocument[]) {
    for (const document of documents) {
      this.fileHashManager.set(document);
    }
  }

  // 要被 DocumentHandler 调用
  public updateOriginFileHash(document: vscode.TextDocument) {
    this.fileHashManager.set(document);
  }

  public async updateFunctionComment(activeEditor: vscode.TextEditor) {
    const document = activeEditor.document;
    const parser = await this.functionParserLoader.loadParser(document.languageId);
    const functionParamsInfo = parser?.getFunctionParamsAtCursor(activeEditor);

    // 查找操作文件的 provider
    const provider = await findProvider(this.configManager, this.providers, document);
    if (!provider) {
      logger.handleError(new CustomError(ErrorCode.LanguageNotSupport));
      return;
    }

    const { matchedFunction, insertPosition } = functionParamsInfo || {};
    if (matchedFunction && insertPosition) {
      const comments = provider.comments;
      const range = parser?.getOriginFunctionCommentRange(comments, document, insertPosition);
      // 原来有函数注释
      if (range) {
        const originFunctionInfo: FunctionCommentInfo = parser?.parseFunctionComment(
          document,
          range,
        ) || {
          paramsInfo: {},
          returnInfo: { default: { type: '', description: '' } },
          descriptionInfo: '',
        };
        const functionCommentInfo = parser?.generateFunctionCommentInfo(
          functionParamsInfo as unknown as FunctionParamsInfo,
          originFunctionInfo,
        );

        if (functionCommentInfo) {
          const originFunctionComment = generateFunctionComment(originFunctionInfo);
          const functionComment = generateFunctionComment(functionCommentInfo);
          // 函数注释没有变化
          if (originFunctionComment === functionComment) {
            logger.info('Not need update function comment:', document.uri.fsPath);
            return false;
          }

          await activeEditor.edit((editBuilder) => {
            editBuilder.replace(range, functionComment + '\n');
          });

          await document.save();
          logger.info('Function comment updated:', document.uri.fsPath);
          return true;
        }
      }
    }
    logger.info('Not need update function comment:', document.uri.fsPath);
    return false;
  }
}
