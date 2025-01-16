#!/usr/bin/env node
import { Command } from 'commander';
import { greet } from './index.js';
import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import fs from 'fs';

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

const program = new Command();

program
  .name('mcp-converter')
  .description('MCP Converter CLI')
  .version('1.0.0');

program
  .argument('[path]', 'Path to start file selection from')
  .action(async (path: string, options) => {
    const answer = await inquirer.prompt([
        {
          type: 'file-tree-selection',
          name: 'files',
          message: 'Select files to convert:',
          multiple: true,
          root: path,
        //   onlyShowValid: true,
        //   validate: (item: string) => {
        //     return item.endsWith('.json') || fs.lstatSync(item).isDirectory();
        //   }
        }
      ]);
      console.log('Selected files:', answer.files);
  });

program.parse();
