import { Command } from '@/typings/types';
import { addFileheader } from './addFileheader';
import { addFunctionComment } from './addFunctionComment';
import { batchUpdateFileheader } from './batchUpdateFileheader';
import { generateTemplateConfig } from './generateTemplateFile';
import { reloadCustomTemplateProvider } from './reloadCustomProvider';

export function getAllCommands(): Array<Command> {
  return [
    addFileheader(),
    generateTemplateConfig(),
    reloadCustomTemplateProvider(),
    batchUpdateFileheader(),
    addFunctionComment(),
  ];
}
