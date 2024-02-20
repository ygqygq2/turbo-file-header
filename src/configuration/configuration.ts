import { escapeRegexString } from '@/utils/str';
import * as vscode from 'vscode';
import type { WorkspaceConfiguration } from 'vscode';
import { Configuration, ConfigurationFlatten, Tag, TagFlatten } from './types';
import { ErrorCode } from '@/error/ErrorCodeMessage.enum';
import { CustomError, errorHandler } from '@/error/ErrorHandler';

/**
 * Get better comments configuration
 */
function getConfiguration() {
  const config = vscode.workspace.getConfiguration('TurboFileHeader') as Configuration &
    WorkspaceConfiguration;
  if (!config) {
    errorHandler.handle(new CustomError(ErrorCode.GetConfigurationFail));
  }
  return config;
}

// Cache configuration
let configFlatten: ConfigurationFlatten;
/**
 * Get better comments configuration in flatten
 */
export function getConfigurationFlatten(forceRefresh = false) {
  if (configFlatten && !forceRefresh) {
    return configFlatten;
  }
  const orig = getConfiguration();

  if (!orig) {
    return;
  }

  configFlatten = {
    multilineComments: orig.multilineComments,
    useJSDocStyle: orig.useJSDocStyle,
    highlightPlainText: orig.highlightPlainText,
    tags: flattenTags(orig.tags),
    tagsLight: flattenTags(orig.tagsLight),
    tagsDark: flattenTags(orig.tagsDark),
  };

  return configFlatten;
}

/**
 * Flatten config tags
 */
function flattenTags(tags: Tag[]) {
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
