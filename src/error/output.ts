import * as vscode from 'vscode';

const channel = vscode.window.createOutputChannel('Turbo File Header', { log: true });

const log = (...args: any[]) => {
  const line = args.map((obj) => (typeof obj === 'object' ? JSON.stringify(obj) : obj)).join(' ');
  return line;
};

const output = {
  info: (...args: any[]) => {
    channel.info(log(...args));
  },
  error: (...args: any[]) => {
    channel.error(log(...args));
  },
};

export default output;
