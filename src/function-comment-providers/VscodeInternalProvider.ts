import * as vscode from 'vscode';
import { FunctionCommentProvider } from './FunctionCommentProvider';

export class VscodeInternalProvider extends FunctionCommentProvider {
  public languages: string[] = [];
  public comments: vscode.CommentRule = { lineComment: '//', blockComment: ['/*', '*/'] };


}
