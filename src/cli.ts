#!/usr/bin/env node
import { Command } from 'commander';
import { greet } from './index';

const program = new Command();

program
  .name('mcp-converter')
  .description('MCP Converter CLI')
  .version('1.0.0');

program
  .argument('[name]', 'name to greet', 'World')
  .action((name: string) => {
    console.log(greet(name));
  });

program.parse();
