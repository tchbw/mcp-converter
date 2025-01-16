#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs';
import inquirer from 'inquirer';
import inquirerFileTreeSelection from 'inquirer-file-tree-selection-prompt';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import path from 'path';
import { z } from 'zod';
import { getMCPInstructions } from './prompts.js';
    
const __dirname = dirname(fileURLToPath(import.meta.url));

inquirer.registerPrompt('file-tree-selection', inquirerFileTreeSelection);

function getAllFiles(filePath: string): string[] {
  const stats = fs.lstatSync(filePath);
  if (stats.isFile()) {
    return [filePath];
  }
  if (stats.isDirectory()) {
    const files: string[] = [];
    fs.readdirSync(filePath).forEach(file => {
      files.push(...getAllFiles(path.join(filePath, file)));
    });
    return files;
  }
  return [];
}

function createFileContentString(files: string[]): string {
  const allFiles = files.reduce((acc: string[], file: string) => {
    return [...acc, ...getAllFiles(file)];
  }, []);

  return allFiles.map(file => {
    const content = fs.readFileSync(file, 'utf-8');
    return `\`\`\` ${file}\n${content}\n\`\`\``;
  }).join('\n\n');
}

const program = new Command();

program
  .name('mcp-converter')
  .description('MCP Converter CLI')
  .version('1.0.0')
  .requiredOption('--openai-api-key <key>', 'OpenAI API key for Claude');

program
  .argument('[filePath]', 'Path to start file selection from')
  .action(async (filePath: string, options) => {
    const answer = await inquirer.prompt([
        {
          type: 'file-tree-selection',
          name: 'files',
          message: 'Select files to add (space to select, right arrow to expand):',
          multiple: true,
          root: filePath,
        },
        {
          type: 'input',
          name: 'mcpDescription',
          message: 'Please describe your MCP server:',
        }
      ]);
      
      const fileContentString = createFileContentString(answer.files);
      // The API key is available in options.anthropicApiKey

      const prompt = getMCPInstructions({
        mcpServerDescription: answer.mcpDescription,
        allFileContents: fileContentString,
      });

      const openai = new OpenAI({
        apiKey: options.openaiApiKey
      });

      const outputSchema = z.object({
        "package.json": z.string(),
        "index.ts": z.string(),
      });

      const response = await openai.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "gpt-4o",
        response_format: zodResponseFormat(outputSchema, "output"),
      });

      const output = outputSchema.parse(JSON.parse(response.choices[0].message.content as string));
      const serverDir = path.join(process.cwd(), 'mcp-server');
      const srcDir = path.join(serverDir, 'src');
      
      fs.mkdirSync(serverDir, { recursive: true });
      fs.mkdirSync(srcDir, { recursive: true });
      
      fs.writeFileSync(path.join(serverDir, 'package.json'), output["package.json"]);
      fs.writeFileSync(path.join(srcDir, 'index.ts'), output["index.ts"]);
      fs.copyFileSync(
        path.join(__dirname, 'sample-mcp-server', 'tsconfig.json'),
        path.join(serverDir, 'tsconfig.json')
      );
      
      console.log('MCP server files created successfully in the mcp-server directory.');
    })

program.parse();
