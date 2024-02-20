import { escapeRegexString } from '@/utils/str';
import * as vscode from 'vscode';
import type { WorkspaceConfiguration } from 'vscode';
import { Configuration, ConfigurationFlatten, Tag, TagFlatten } from './types';

/**
 * Get better comments configuration
 */
function getConfiguration() {
  return vscode.workspace.getConfiguration('turbo-file-header') as Configuration &
    WorkspaceConfiguration;
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
