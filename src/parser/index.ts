/**
 * Comment Highlighting Parser
 *
 * This module implements comment highlighting functionality.
 * The design concept is inspired by Better Comments (https://github.com/aaron-bond/better-comments)
 * but the implementation is completely independent and original.
 *
 * @see ATTRIBUTIONS.md for full attribution details
 */
import * as vscode from 'vscode';

import { configEvent, configManager } from '@/extension';
import { TagFlatten } from '@/typings/types';

import { useBlockPicker } from './block-picker';
import { useLinePicker } from './line-picker';

export type LinePicker = ReturnType<typeof useLinePicker>;
export type BlockPicker = ReturnType<typeof useBlockPicker>;

export interface TagDecorationOptions extends vscode.DecorationOptions {
  tag: string;
}

export interface TagDecoration {
  tag: string;
  decorationType: vscode.TextEditorDecorationType;
}

function generateTagDecorations() {
  const configs = configManager.getConfigurationFlatten();
  const decorations: TagDecoration[] = [];
  for (const tag of configs.tags) {
    const opt = parseDecorationRenderOption(tag);

    const tagLight = configs.tagsLight.find((t) => t.tag === tag.tag);
    if (tagLight) {
      opt.light = parseDecorationRenderOption(tagLight);
    }

    const tagDark = configs.tagsDark.find((t) => t.tag === tag.tag);
    if (tagDark) {
      opt.dark = parseDecorationRenderOption(tagDark);
    }

    decorations.push({
      tag: tag.tag,
      decorationType: vscode.window.createTextEditorDecorationType(opt),
    });
  }

  return decorations;
}

/**
 * Parse decoration render option by tag configuration
 */
function parseDecorationRenderOption(tag: TagFlatten) {
  const options: vscode.DecorationRenderOptions = {
    color: tag.color,
    backgroundColor: tag.backgroundColor,
  };

  const textDecorations: string[] = [];
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  tag.strikethrough && textDecorations.push('line-through');
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  tag.underline && textDecorations.push('underline');
  options.textDecoration = textDecorations.join(' ');

  if (tag.bold) {
    options.fontWeight = 'bold';
  }

  if (tag.italic) {
    options.fontStyle = 'italic';
  }

  return options;
}

export function useParser() {
  // Vscode active editor
  let activeEditor: vscode.TextEditor | undefined;

  let tagDecorations: TagDecoration[] = generateTagDecorations();
  configEvent.onDidChange(() => {
    tagDecorations = generateTagDecorations();
  });

  const linePickers = new Map<string, LinePicker>();
  function getLinePicker(languageId: string) {
    let linePicker = linePickers.get(languageId);
    if (!linePicker) {
      linePicker = useLinePicker(languageId);
      linePickers.set(languageId, linePicker);
    }
    return linePicker;
  }

  const blockPickers = new Map<string, BlockPicker>();
  function getBlockPicker(languageId: string) {
    let blockPicker = blockPickers.get(languageId);
    if (!blockPicker) {
      blockPicker = useBlockPicker(languageId);
      blockPickers.set(languageId, blockPicker);
    }
    return blockPicker;
  }

  /**
   * Get active editor
   */
  function getEditor() {
    return activeEditor;
  }

  /**
   * Switch editor for parser and setup pickers
   */
  async function setEditor(editor: vscode.TextEditor) {
    activeEditor = editor;
  }

  /**
   * Apply decorations after finding all relevant comments
   */
  async function updateDecorationsDirectly(): Promise<void> {
    if (!activeEditor) {
      return;
    }

    const [linePicker, blockPicker] = await Promise.all([
      getLinePicker(activeEditor.document.languageId),
      getBlockPicker(activeEditor.document.languageId),
    ]);

    const blockPicked = await blockPicker.pick({ editor: activeEditor });
    const linePicked = await linePicker.pick({
      skipRanges: blockPicked.blockRanges,
      editor: activeEditor,
    });

    for (const td of tagDecorations) {
      const lowerTag = td.tag.toLowerCase();
      const blockOpts = (blockPicked?.decorationOptions.filter((opt) => opt.tag === lowerTag) ||
        []) as vscode.DecorationOptions[];
      const lineOpts = (linePicked?.decorationOptions.filter((opt) => opt.tag === lowerTag) ||
        []) as vscode.DecorationOptions[];

      activeEditor.setDecorations(td.decorationType, [...blockOpts, ...lineOpts]);
    }
  }

  // * IMPORTANT:
  // * To avoid calling update too often,
  // * set a timer for 100ms to wait before updating decorations
  let triggerUpdateTimeout: NodeJS.Timeout;
  function updateDecorations(time: true | number = 100) {
    if (triggerUpdateTimeout) {
      clearTimeout(triggerUpdateTimeout);
    }

    if (time === true) {
      updateDecorationsDirectly();
      return;
    }

    triggerUpdateTimeout = setTimeout(updateDecorationsDirectly, time);
  }

  // Update decorations when configuration changed
  configEvent.onDidChange(updateDecorationsDirectly);

  return {
    getEditor,
    setEditor,
    updateDecorations,
  };
}
