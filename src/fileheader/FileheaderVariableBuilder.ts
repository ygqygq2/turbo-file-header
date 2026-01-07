import dayjs from 'dayjs';
import { stat } from 'fs/promises';
import { basename, dirname, relative } from 'path';
import upath from 'upath';
import vscode, { WorkspaceFolder } from 'vscode';

import { ConfigManager } from '@/configuration/ConfigManager';
import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';
import { initVCSProvider } from '@/init';
import { LanguageProvider } from '@/language-providers';
import { simpleEval } from '@/utils/simple-eval';
import { BaseVCSProvider } from '@/vcs-provider/BaseVCSProvider';

import { WILDCARD_ACCESS_VARIABLES } from '../constants';
import { Config } from '../typings/types';
import { VariableBuilder } from './types';

export class FileheaderVariableBuilder {
  private config: Config;
  private variableBuilders: { [key: string]: VariableBuilder };
  private workspace?: WorkspaceFolder;
  private vcsProvider?: BaseVCSProvider;
  private variableRegex = /{{(.*?)}}/g;
  private fileUri?: vscode.Uri;
  private dateFormat: string;

  constructor(configManager: ConfigManager) {
    this.config = configManager.getConfiguration();
    this.dateFormat = this.config.dateFormat || 'YYYY-MM-DD HH:mm:ss';
    this.variableBuilders = {
      ...Object.keys(WILDCARD_ACCESS_VARIABLES).reduce(
        (obj, key) => {
          const methodName = `build${
            key.charAt(0).toUpperCase() + key.slice(1)
          }` as keyof FileheaderVariableBuilder;
          if (typeof this[methodName] === 'function') {
            obj[key] = (this[methodName] as unknown as VariableBuilder).bind(this);
          }
          return obj;
        },
        {} as { [key: string]: VariableBuilder },
      ),
    };
  }

  public async build(
    fileUri: vscode.Uri,
    _provider: LanguageProvider,
    variables: { [key: string]: string } | undefined,
  ): Promise<{ [key: string]: string }> {
    this.fileUri = fileUri;
    const fsPath = fileUri.fsPath;
    this.workspace = vscode.workspace.getWorkspaceFolder(fileUri);
    try {
      this.vcsProvider = await initVCSProvider();
      if (!this.vcsProvider) {
        logger.throw(new CustomError(ErrorCode.VCSInvalid));
      }
      await this.vcsProvider.validate(dirname(fsPath));
    } catch (error) {
      logger.throw(new CustomError(ErrorCode.VCSInvalid, error));
    }

    const { fileheader, disableLabels } = this.config;
    const disableLabelsSet = new Set(disableLabels);
    const newVariables: { [key: string]: string } = {};

    for (const item of fileheader) {
      const { label, value, usePrevious = false } = item;
      // 如果没有在禁用列表里，就进行变量替换
      if (!disableLabelsSet.has(label)) {
        const matches = value.match(this.variableRegex);
        if (matches) {
          await Promise.all(
            matches.map(async (match) => {
              const variable = match.slice(2, -2);
              if (usePrevious && variables?.[variable]) {
                newVariables[variable] = variables[variable];
                return;
              }
              const builder = this.variableBuilders[variable];
              const result = builder ? await builder() : await this.buildCustomVariable(variable);
              newVariables[variable] = result || '';
            }),
          );
        }
      }
    }

    return newVariables;
  }

  private async handleCustomVariableBuilder(
    builderName: string,
    param: string,
    calculation: string | undefined,
    match: string,
    value: string,
  ): Promise<string> {
    const builder = this.variableBuilders[builderName];
    if (builder) {
      let result: string | undefined;
      // 支持 now 自定义格式并计算出结果，当然格式后的值是能够计算的
      if (typeof builder === 'function' && builderName === 'now') {
        result = await builder(param);
        if (calculation) {
          result = simpleEval(result + calculation);
        }
      } else {
        result = await builder();
      }
      value = value.replace(match, result || '');
    } else {
      logger.handleError(new CustomError(ErrorCode.UnknownVariable, builderName));
    }
    return value;
  }

  private async buildCustomVariable(variable: string): Promise<string> {
    const { customVariables } = this.config;
    const customVariable = customVariables.find((item) => item.name === variable);
    let { value = '' } = customVariable || {};
    const matches = value.match(this.variableRegex);

    if (matches) {
      for (const match of matches) {
        const variableName = match.slice(2, -2);
        const calculationRegex = /(\w+)\s*([+\-*/]\s*\d+)?\s*(.*)/;
        const calculationMatch = variableName.match(calculationRegex);
        if (calculationMatch) {
          const [_, builderName, calculation, param] = calculationMatch;
          value = await this.handleCustomVariableBuilder(
            builderName,
            param,
            calculation,
            match,
            value,
          );
        }
      }
    }
    return value;
  }

  private buildNow = async (param: string = '') => {
    const cleanedParam = param.trim().replace(/^['"]+|['"]+$/g, '');
    return dayjs().format(cleanedParam || this.dateFormat);
  };

  private buildAuthorName = async () => {
    const fsPath = this.fileUri!.fsPath;
    let authorName = this.vcsProvider ? await this.vcsProvider.getAuthorName(fsPath) : '';
    if (!authorName) {
      authorName = await this.buildUserName();
    }
    return authorName;
  };

  private buildAuthorEmail = async () => {
    const fsPath = this.fileUri!.fsPath;
    let authorEmail = this.vcsProvider ? await this.vcsProvider.getAuthorEmail(fsPath) : '';
    if (!authorEmail) {
      authorEmail = await this.buildUserEmail();
    }
    return authorEmail;
  };

  private buildBirthtime = async () => {
    const fsPath = this.fileUri!.fsPath;
    const fileStat = await stat(fsPath);
    const isTracked = await this.vcsProvider!.isTracked(fsPath);
    const birthtime = isTracked
      ? dayjs((await this.vcsProvider?.getBirthtime(fsPath)) ?? fileStat.birthtime).format(
          this.dateFormat,
        )
      : dayjs(fileStat.birthtime).format(this.dateFormat);
    return birthtime;
  };

  private async buildMtime() {
    const fsPath = this.fileUri!.fsPath;
    const fileStat = await stat(fsPath);
    return dayjs(fileStat.mtime).format(this.dateFormat);
  }

  private async buildUserName() {
    const fsPath = this.fileUri!.fsPath;
    const userName = this.vcsProvider ? await this.vcsProvider.getUserName(dirname(fsPath)) : '';
    return userName || this.config?.userName || '';
  }

  private async buildUserEmail() {
    const fsPath = this.fileUri!.fsPath;
    const userEmail = this.vcsProvider ? await this.vcsProvider.getUserEmail(dirname(fsPath)) : '';
    return userEmail || this.config?.userEmail || '';
  }

  private buildCompanyName() {
    return this.config?.companyName || this.config?.userName || '';
  }

  private buildProjectName() {
    const projectName = upath.normalize(basename(this.workspace!.uri.path));
    return projectName;
  }

  private buildFilePath() {
    const filePath = upath.normalize(relative(this.workspace!.uri.path, this.fileUri!.path));
    return filePath;
  }

  private buildDirPath() {
    const dirPath =
      upath.normalize(relative(this.workspace!.uri.path, dirname(this.fileUri!.path))) || '';
    return dirPath;
  }

  private buildFileName() {
    return basename(this.fileUri!.path);
  }
}
