import * as vscode from 'vscode';
import { log } from '@/utils/log';

const channel = vscode.window.createOutputChannel('Turbo File Header', { log: true });

const output = {
  info: (...args: any[]) => {
    channel.info(log(...args));
  },
  error: (...args: any[]) => {
    channel.error(log(...args));
  },
};

export default output;
