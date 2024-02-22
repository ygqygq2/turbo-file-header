import * as vscode from 'vscode';
import { escapeRegexString } from '@/utils/str';
import { ErrorCode } from '@/error/ErrorCodeMessage.enum';
import { CustomError } from '@/error/ErrorHandler';
import { ConfigSection, ConfigTag } from '../constants';
import { Configuration, ConfigurationFlatten, Tag, TagFlatten } from './types';
import { errorHandler } from '@/extension';

export class ConfigManager {
  private static instance: ConfigManager;
  private configFlatten: ConfigurationFlatten;

  private constructor() {
    this.configFlatten = this.getConfigurationFlatten();
  }

  public static getInstance(): ConfigManager {
    return ConfigManager.instance || new ConfigManager();
  }

  private get _config() {
    return vscode.workspace.getConfiguration();
  }

  get<T>(section: ConfigSection): T | undefined {
    return this._config.get<T>(section);
  }

  async set<T>(section: ConfigSection, value: T) {
    await this._config.update(section, value);
  }

  private getConfiguration(): Configuration {
    const config = vscode.workspace.getConfiguration(ConfigTag) as Configuration &
      vscode.WorkspaceConfiguration;
    if (!config) {
      errorHandler.handle(new CustomError(ErrorCode.GetConfigurationFail));
    }
    return config;
  }

  public getConfigurationFlatten(forceRefresh = false): ConfigurationFlatten {
    if (this.configFlatten && !forceRefresh) {
      return this.configFlatten;
    }
    const orig = this.getConfiguration();

    this.configFlatten = {
      multilineComments: orig.multilineComments || true,
      useJSDocStyle: orig.useJSDocStyle || true,
      highlightPlainText: orig.highlightPlainText || true,
      tags: this.flattenTags(orig.tags || []),
      tagsLight: this.flattenTags(orig.tagsLight || []),
      tagsDark: this.flattenTags(orig.tagsDark || []),
    };
    return this.configFlatten;
  }

  private flattenTags(tags: Tag[]): TagFlatten[] {
    const flatTags: TagFlatten[] = [];
    for (const tag of tags) {
      if (!Array.isArray(tag.tag)) {
        flatTags.push({ ...tag, tagEscaped: escapeRegexString(tag.tag) } as TagFlatten);
        continue;
      }
      for (const tagName of tag.tag) {
        flatTags.push({
          ...tag,
          tag: tagName,
          tagEscaped: escapeRegexString(tagName),
        });
      }
    }
    return flatTags;
  }
}
