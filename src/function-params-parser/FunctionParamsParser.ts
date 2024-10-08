import * as vscode from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { LanguageFunctionCommentSettings } from '@/typings/types';
import { isCommentLine, updateBlockCommentState } from '@/utils/vscode-utils';

import { FunctionCommentInfo, FunctionParamsInfo, ParamsInfo, ReturnInfo } from './types';

export abstract class FunctionParamsParser {
  protected configManager: ConfigManager;
  protected languageId: string;
  protected languageSettings: LanguageFunctionCommentSettings;

  constructor(configManager: ConfigManager, languageId: string) {
    this.configManager = configManager;
    this.languageId = languageId;
    this.languageSettings = this.getLanguageSettings();
  }

  public abstract getFunctionParamsAtCursor(
    activeEditor: vscode.TextEditor,
    languageSettings?: LanguageFunctionCommentSettings,
  ): FunctionParamsInfo;

  public getLanguageSettings() {
    const configuration = this.configManager.getConfiguration();
    const languagesSettings = configuration.functionComment?.languagesSettings || [];
    const currentLanguageSetting = languagesSettings.find(
      (settings) => settings.languageId === this.languageId,
    );
    if (!currentLanguageSetting) {
      return {
        languageId: this.languageId,
        defaultReturnName: 'default',
        defaultReturnType: 'auto',
        defaultParamType: 'any',
      };
    }

    return currentLanguageSetting;
  }

  public generateFunctionCommentInfo(
    functionParamsInfo: FunctionParamsInfo,
    originFunctionInfo: FunctionCommentInfo,
  ): FunctionCommentInfo {
    const { params, returnType } = functionParamsInfo;
    const { paramsInfo, returnInfo, descriptionInfo } = originFunctionInfo;

    // 合并 params 和 paramsInfo
    const mergedParams: ParamsInfo = {};
    for (const key in params) {
      mergedParams[key] = {
        // 因为默认值无法确认类型，所以以用户修改的类型为准
        type:
          (params[key]?.defaultValue && paramsInfo[key]?.defaultValue
            ? paramsInfo[key]?.type
            : params[key].type) ?? params[key].type,
        description: paramsInfo[key]?.description || '',
        ...(params[key]?.optional && { optional: true }),
        ...(params[key]?.defaultValue && { defaultValue: params[key].defaultValue }),
      };
    }

    // 合并 returnType 和 returnInfo
    let mergedReturnInfo: ReturnInfo = {};
    if (typeof returnType === 'string') {
      mergedReturnInfo = {
        default: {
          type: returnType || returnInfo.default?.type || '',
          description: returnInfo.default?.description || '',
        },
      };
    } else {
      for (const key in returnType) {
        mergedReturnInfo[key] = {
          type: returnType[key].type,
          description: returnInfo[key]?.description || '',
        };
      }
    }

    return {
      paramsInfo: mergedParams,
      returnInfo: mergedReturnInfo,
      descriptionInfo,
    };
  }

  public getOriginFunctionCommentRange(
    comments: vscode.CommentRule,
    document: vscode.TextDocument,
    insertPosition: vscode.Position,
  ) {
    const endLine = insertPosition.line;
    const startLine = endLine;
    let startPosition = new vscode.Position(startLine, 0);
    const endPosition = new vscode.Position(endLine, 0);

    // 用于标记是否处于块注释内部
    let isInsideBlockComment = false;

    // 往上检查，直到找到非注释行
    for (let i = endLine - 1; i >= 0; i--) {
      const line = document.lineAt(i);
      const lineText = line.text;

      // 更新块注释的开始和结束状态
      isInsideBlockComment = updateBlockCommentState(
        comments,
        lineText,
        isInsideBlockComment,
        'up',
      );
      // 判断当前行是否是注释行
      if (isCommentLine(comments, lineText, isInsideBlockComment)) {
        startPosition = document.lineAt(i).range.start;
      } else {
        // 不在块注释中
        if (!isInsideBlockComment) {
          // 如果有多个空行，在往前最后一个空行 break
          if (
            line.isEmptyOrWhitespace &&
            i - 1 >= 0 &&
            !document.lineAt(i - 1).isEmptyOrWhitespace
          ) {
            startPosition = document.lineAt(i + 1).range.start;
            break;
          }
          // 如果当前行不是空行，结束循环
          if (!line.isEmptyOrWhitespace) {
            break;
          }
        }
      }
    }

    const range = new vscode.Range(startPosition, endPosition);
    return range;
  }

  public parseFunctionComment(
    document: vscode.TextDocument,
    range: vscode.Range,
  ): FunctionCommentInfo {
    const { paramNameBeforeType = true } = this.languageSettings;
    const functionCommentLines = document.getText(range).split('\n');

    return paramNameBeforeType
      ? this.parseFunctionCommentNameFirst(functionCommentLines)
      : this.parseFunctionCommentTypeFirst(functionCommentLines);
  }

  protected parseFunctionCommentNameFirst(functionCommentLines: string[]): FunctionCommentInfo {
    const paramPattern =
      /@param\s+(?:\[\s*([^=\]]+)(?:=(.*?))?\s*\]|([^=\]]+))\s*\{((?:[^}]|\}(?!\s*$))*)\}\s*(.*)/;
    const returnPattern = /@return\s+(\w+)\s*\{((?:[^}]|\}(?!\s*$))*)\}\s*(.*)/;
    return this.parseFunctionCommentLines(functionCommentLines, paramPattern, returnPattern, true);
  }

  protected parseFunctionCommentTypeFirst(functionCommentLines: string[]): FunctionCommentInfo {
    const paramPattern =
      /@param\s+\{((?:[^}]|\}(?!\s*$))*)\}\s*(?:\[\s*([^=\]]+)(?:=(.*?))?\s*\]|([^=\]]+))\s*(.*)/;
    const returnPattern = /@return\s+\{((?:[^}]|\}(?!\s*$))*)\}\s*(\w+)\s*(.*)/;

    return this.parseFunctionCommentLines(functionCommentLines, paramPattern, returnPattern, false);
  }

  protected parseFunctionCommentLines(
    functionCommentLines: string[],
    paramPattern: RegExp,
    returnPattern: RegExp,
    paramNameBeforeType: boolean,
  ): FunctionCommentInfo {
    const paramsInfo: ParamsInfo = {};
    const returnInfo: ReturnInfo = {};
    let descriptionInfo = '';
    const {
      defaultReturnName = 'default',
      defaultReturnType = 'auto',
      defaultParamType = 'any',
    } = this.languageSettings;
    const descriptionPattern = /@description\s+(.*)/;

    const handleParamNameBeforeType = (match: RegExpExecArray) => {
      const [
        _,
        optionalName,
        defaultValue,
        name,
        type = defaultParamType as string,
        description = '',
      ] = match;
      const realName = optionalName || name;
      paramsInfo[realName] = {
        type,
        description,
        ...(defaultValue && { defaultValue }),
        ...(!defaultValue && optionalName && { optional: true }),
      };
    };

    const handleParamTypeBeforeName = (match: RegExpExecArray) => {
      const [
        _,
        type = defaultParamType as string,
        optionalName,
        defaultValue,
        name,
        description = '',
      ] = match;
      const realName = optionalName || name;
      paramsInfo[realName] = {
        type,
        description,
        ...(defaultValue && { defaultValue }),
        ...(!defaultValue && optionalName && { optional: true }),
      };
    };

    const handleReturn = (match: RegExpExecArray) => {
      let [_, name, type, description = ''] = match;
      if (!paramNameBeforeType) {
        [_, type, name, description = ''] = match;
      }
      returnInfo[name || defaultReturnName] = { type: type || defaultReturnType, description };
    };

    for (const line of functionCommentLines) {
      let match;
      if ((match = paramPattern.exec(line)) !== null) {
        if (paramNameBeforeType) {
          handleParamNameBeforeType(match);
        } else {
          handleParamTypeBeforeName(match);
        }
      } else if ((match = returnPattern.exec(line)) !== null) {
        handleReturn(match);
      } else if ((match = descriptionPattern.exec(line)) !== null) {
        const [_, description] = match;
        descriptionInfo = description.trim();
      }
    }

    return { paramsInfo, returnInfo, descriptionInfo };
  }
}
