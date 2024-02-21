import * as vscode from 'vscode';
import { Language } from './Language';

export interface AvailableCommentRules {
  lineComments: string[];
  blockComments: vscode.CharacterPair[];
}

export type Languages = Map<string, Language>;

export interface AvailableComments {
  lineComments: string[];
  blockComments: vscode.CharacterPair[];
}

export type OnDidChangeCallback = () => void;
