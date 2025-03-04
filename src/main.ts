/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { BabelAPI } from '@babel/helper-plugin-utils';

import * as babel from '@babel/core';
import fs from 'fs';
import path from 'path';
import cy2pw from '.';
import prettier from 'prettier';
import { Command } from 'commander';
import { execSync } from 'child_process';

const packageJSON = require('../package.json'); // @ts-ignore
import { convertConfigFiles } from './configConverter';

const isPlaywrightInstalled = () => {
  const packageJsonPath = path.join(process.cwd(), 'playwright.config.js');
  return fs.existsSync(packageJsonPath);
};

const processDirectory = async (sourceDir: string, targetDir: string, options: any, priorityFolders: string[]) => {
  if (!fs.existsSync(targetDir))
    fs.mkdirSync(targetDir, { recursive: true });


  const allowedExtensions = options?.filetype.split(',');
  const checkExtension = (ext: string) => allowedExtensions.includes(ext);

  // Read all files and directories
  const files = fs.readdirSync(sourceDir);

  // Split into priority folders and other folders
  const directories = files.filter(file => fs.statSync(path.join(sourceDir, file)).isDirectory());
  const priorityDirectories = directories.filter(dir => priorityFolders.includes(dir));  // Folders in priority list
  const otherDirectories = directories.filter(dir => !priorityFolders.includes(dir));  // Other folders

  // Process the priority folders first, in the given order
  for (const dir of priorityDirectories) {
    const sourcePath = path.join(sourceDir, dir);
    const targetPath = path.join(targetDir, dir);
    // Process the priority folder
    await processDirectory(sourcePath, targetPath, options, priorityFolders);
  }

  // Then, process the other folders
  for (const dir of otherDirectories) {
    const sourcePath = path.join(sourceDir, dir);
    const targetPath = path.join(targetDir, dir);
    // Process the non-priority folder
    await processDirectory(sourcePath, targetPath, options, priorityFolders);
  }

  // Process all files (after directories)
  for (const file1 of files.filter(file => fs.statSync(path.join(sourceDir, file)).isFile())) {
    const sourcePath = path.join(sourceDir, file1);
    const targetPath = path.join(targetDir, file1);

    // Process files based on extensions (js, ts, or 'all')
    if (checkExtension(file1.endsWith('.js') ? '.js' : '') || checkExtension(file1.endsWith('.ts') ? '.ts' : '') || checkExtension('all'))
      await processFile(file1, sourcePath, targetPath, options);

  }
};


const processFile = async (file: any, sourcePath: string, targetPath: any, options: any) => {
  console.log(`✅ Started : ${sourcePath} -> ${targetPath}`);

  let content = fs.readFileSync(sourcePath, 'utf8');
  const result = await cy2pw(babel as BabelAPI, prettier, sourcePath, content, options);
  let isError = false;
  if (!result.text && result.error) {
    console.log(`❌ Conversion Failed: ${sourcePath} -> ${targetPath}`);
    console.log(result.error.message);
    isError = true;
  }

  // @ts-ignore
  content = !isError ? result.text : content;
  fs.writeFileSync(targetPath, content, 'utf8');

  console.log(`✅ ${isError ? 'Copied' : 'Converted'}: ${sourcePath} -> ${targetPath}`);
};

const program = new Command();

program
    .version('Version ' + packageJSON.version)
    .name('npx cy2pwconvert')
    .usage('.cypress/ tests/')
    .argument('<src>', 'Source file or folder')
    .argument('<dst>', 'Target file or folder')
    .option(
        '-ft, --filetype <filetype>',
        'File types to convert default: .js, example: .js,.ts, current support: .js,.ts,.jsx',
        '.js,.ts'
    )
    .option(
        '-idp, --installDependency <installDependency>',
        'Installs Dependency after project clone',
        false
    )
    .option(
        '-sC, --skipConfig <skipConfig>',
        'Skips the config conversion from cypress to playwright',
        true
    )
    .option(
        '-ep, --enablePlugins <enablePlugins>',
        'If enabled, this packages takes plugins from babel config file or package file, which comes under plugins key.',
        false
    )
    .option(
        '-ep, --preserveBDD <preserveBDD>',
        'This option will help you to preserve bdd being converted to tdd',
        true
    )
    .showHelpAfterError()
    .action(async (src: string, dst: string, options) => {
      const SOURCE_DIR = src || './cypress/integration';
      const TARGET_DIR = dst || './playwright/tests';

      const installDep: boolean = options?.installDependency === '1' || options?.installDependency === 'true';

      if (!isPlaywrightInstalled() && installDep) {
        console.log('🚀 Installing Playwright...');

        // Run Playwright init with predefined JavaScript options
        execSync(`npm install playwright@latest @playwright/test --save-dev`, { stdio: 'inherit' });

        // Ensure JavaScript setup
        console.log('🔧 Configuring Playwright with JavaScript...');
        execSync(`npx create-playwright@latest --lang=js --install-deps=true --no-examples --test-dir="${TARGET_DIR}" --quiet`, { stdio: 'inherit' });

        console.log('✅ Playwright setup complete.');
      }

      const skipConfig: boolean = options?.skipConfig === '1' || options?.skipConfig === 'true' || options?.skipConfig === true;
      if (!skipConfig) {
        await convertConfigFiles({
          'testDir': `./${TARGET_DIR}`
        });
      }

      console.log(`🚀 Migrating Cypress tests from "${SOURCE_DIR}" to "${TARGET_DIR}"...`);
      await processDirectory(SOURCE_DIR, TARGET_DIR, options, ['support']);
      console.log('🎉 Migration complete!');
    })
    .parse(process.argv);
