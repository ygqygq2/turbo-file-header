import * as vscode from 'vscode';

const channel = vscode.window.createOutputChannel('Turbo File Header');

const log = (...args: any[]) => {
  const line = args.map((obj) => (typeof obj === 'object' ? JSON.stringify(obj) : obj)).join(' ');
  channel.appendLine(line);
};

const output = {
  info: (...args: any[]) => {
    log('[INFO] ', ...args);
  },
  error: (...args: any[]) => {
    log('[ERROR] ', ...args);
  },
};

export default output;
