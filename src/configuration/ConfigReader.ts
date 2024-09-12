import fs from 'fs';
import path from 'path';
import * as vscode from 'vscode';
import YAML from 'yaml';

import { CUSTOM_CONFIG_FILE_NAME } from '@/constants';
import { CustomError, ErrorCode } from '@/error';
import { logger } from '@/extension';
import { ConfigYaml } from '@/typings/types';
import { getWorkspaceRoot } from '@/utils/vscode-utils';

export class ConfigReader {
  private static instance: ConfigReader;

  public static getInstance(): ConfigReader {
    if (!this.instance) {
      this.instance = new ConfigReader();
    }
    return this.instance;
  }

  public getConfigYaml = async (): Promise<ConfigYaml> => {
    const defaultConfig: ConfigYaml = {
      providers: [],
      findFilesConfig: {
        include: '**/tmp/*.{ts,js}',
        exclude: '**/{node_modules,dist}/**',
      },
    };

    // 这里初始化时，很容易 undefined
    const activeWorkspaceUri = vscode.window.activeTextEditor?.document?.uri;
    if (!activeWorkspaceUri) {
      return defaultConfig;
    }

    const projectRoot = getWorkspaceRoot(activeWorkspaceUri);
    if (!projectRoot) {
      return defaultConfig;
    }

    const configPath = path.join(projectRoot, '.vscode', CUSTOM_CONFIG_FILE_NAME);
    if (!fs.existsSync(configPath)) {
      return defaultConfig;
    }

    try {
      // 读取 yaml 配置
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config: ConfigYaml = YAML.parse(configContent);
      return { ...defaultConfig, ...config };
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      logger.handleError(new CustomError(ErrorCode.GetCustomConfigFail));
    }
    return defaultConfig;
  };

  public getAllLanguages = async (): Promise<string[]> => {
    const config = await this.getConfigYaml();
    const languages = config?.providers.flatMap((provider) => provider.languages) || [];
    return languages;
  };
}
