import * as vscode from 'vscode';
import { escapeRegexString } from '@/utils/str';
import { configEvent, configManager, languageEvent, languageManager } from '@/extension';
import { TagDecorationOptions } from '.';

export interface BlockPicker {
  markStart: string;
  markEnd: string;
  blockPicker: RegExp;
  linePicker: RegExp;
  docLinePicker: RegExp;
  docLinePrefix: string;
}

async function parseBlockPickers(languageId: string): Promise<BlockPicker[]> {
  const comments = await languageManager.getAvailableCommentRules(languageId);
  if (!comments.blockComments || comments.blockComments.length === 0) {
    return [];
  }

  const configs = configManager.getConfigurationFlatten();
  const escapedTags = configs.tags.map((tag) => escapeRegexString(tag.tagEscaped));

  const pickers: BlockPicker[] = comments.blockComments.map((marks) => {
    const start = escapeRegexString(marks[0]);
    const end = escapeRegexString(marks[1]);
    const linePrefix = marks[0].slice(-1);
    const prefix = escapeRegexString(linePrefix);
    return {
      markStart: marks[0],
      markEnd: marks[1],
      blockPicker: new RegExp(
        `(${start}+)([ \\t]?)(.*?)(${end})|(${start}+)([ \\t\\r\\n]?)([\\s\\S]*?)(${end})`,
        'gm',
      ),
      linePicker: new RegExp(`(^([ \\t]*))((${escapedTags.join('|')})[^^\\r^\\n]*)`, 'igm'),
      docLinePicker: new RegExp(
        `(^[ \\t]*${prefix}([ \\t]))((${escapedTags.join('|')})[^^\\r^\\n]*)`,
        'igm',
      ),
      docLinePrefix: linePrefix,
    };
  });

  return pickers;
}

interface _BlockPickOptions {
  text?: string;
  editor: vscode.TextEditor;
  picker?: BlockPicker;
  highlight?: boolean;
}

function _pick(options: _BlockPickOptions) {
  const { editor, picker, highlight = true, text = editor.document.getText() } = options;

  if (!editor || !picker) {
    return;
  }

  if (!options.text) {
    options.text = editor.document.getText();
  }

  const blockRanges: [number, number][] = [];

  const decorationOptions: TagDecorationOptions[] = [];

  // Find the multiline comment block
  let block: RegExpExecArray | null;
  while ((block = picker.blockPicker.exec(text))) {
    blockRanges.push([block.index, block.index + block[0].length]);

    if (!highlight) {
      continue;
    }

    // if the regex of block as line success
    const isLineComment = block[1] !== undefined;

    const comment = isLineComment ? block[3] : block[7];
    const space = isLineComment ? block[2] : block[6];

    if (!comment || !space) {
      continue;
    }

    const markStart = isLineComment ? block[1] : block[5];
    // const markEnd = isLineComment ? block[4] : block[8];
    const isDocComment = !isLineComment && markStart === '/**';
    const linePicker = isDocComment ? picker.docLinePicker : picker.linePicker;

    // Find the matched line
    let line: RegExpExecArray | null;
    while ((line = linePicker.exec(comment))) {
      const startIdx = block.index + markStart.length + space.length + line.index + line[1].length;
      const startPos = editor.document.positionAt(startIdx);
      const endPos = editor.document.positionAt(startIdx + line[3].length);
      const range = new vscode.Range(startPos, endPos);

      const tag = line![4].toLowerCase();

      decorationOptions.push({ tag, range });
    }
  }

  return {
    blockRanges,
    decorationOptions,
  };
}

interface _BlockPickManyOptions extends Omit<_BlockPickOptions, 'picker'> {
  pickers: BlockPicker[];
}

function _pickMany(options: _BlockPickManyOptions) {
  const { editor, pickers, text = editor.document.getText(), highlight = true } = options;
  const blockRanges: [number, number][] = [];
  const decorationOptions: TagDecorationOptions[] = [];

  for (const picker of pickers) {
    const picked = _pick({ editor, text, highlight, picker });
    if (picked) {
      blockRanges.push(...(picked.blockRanges || []));
      decorationOptions.push(...(picked.decorationOptions || []));
    }
  }

  return {
    blockRanges,
    decorationOptions,
  };
}

export interface PickOptions {
  editor: vscode.TextEditor;
}

export function useBlockPicker(languageId: string) {
  let _pickers: BlockPicker[] | undefined;
  async function getPickers() {
    if (!_pickers) {
      _pickers = await parseBlockPickers(languageId);
    }
    return _pickers;
  }

  languageEvent.onDidChange(() => {
    _pickers = undefined;
    getPickers(); // Init pickers once
  });

  configEvent.onDidChange(() => {
    _pickers = undefined;
    getPickers(); // Init pickers once
  });

  async function pick({ editor }: PickOptions) {
    const text = editor.document.getText();
    const configs = configManager.getConfigurationFlatten();
    const comments = await languageManager.getAvailableCommentRules(languageId);

    const highlight = comments.blockComments.length > 0 && configs.multilineComments;

    const pickers = await getPickers();

    return await _pickMany({
      text,
      editor,
      pickers,
      highlight: highlight,
    });
  }

  return {
    pick,
  };
}
