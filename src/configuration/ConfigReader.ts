import fs from 'fs';
import path from 'path';
import YAML from 'yaml';

import { CUSTOM_CONFIG_FILE_NAME } from '@/constants';
import { CustomError, ErrorCode } from '@/error';
import { contextService, logger } from '@/extension';
import { ConfigYaml } from '@/typings/types';
import { getActiveDocumentWorkspace } from '@/utils/vscode-utils';

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

    const context = contextService?.getContext();
    const activeWorkspace = await getActiveDocumentWorkspace(context);
    if (!activeWorkspace) {
      return defaultConfig;
    }

    const configPath = path.join(activeWorkspace.uri.fsPath, '.vscode', CUSTOM_CONFIG_FILE_NAME);
    if (!fs.existsSync(configPath)) {
      return defaultConfig;
    }

    try {
      // 读取 yaml 配置
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config: ConfigYaml = YAML.parse(configContent);
      return { ...defaultConfig, ...config };
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
