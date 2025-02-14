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
import fs from 'fs';
import path from 'path';
import prettier from 'prettier';

// Define Cypress and Playwright config file paths
const cypressConfigPaths = {
  ts: path.resolve('cypress.config.ts'),
  js: path.resolve('cypress.config.js'),
  json: path.resolve('cypress.json'),
};

const playwrightConfigPaths = {
  ts: path.resolve('playwright.config.ts'),
  js: path.resolve('playwright.config.js'),
};

// Interface for Cypress Config
interface CypressConfig {
  baseUrl?: string;
  viewportWidth?: number;
  viewportHeight?: number;
  defaultCommandTimeout?: number;
  screenshotOnRunFailure?: boolean;
  video?: boolean;
}

// Function to read Cypress config
const readCypressConfig = (): CypressConfig => {
  if (fs.existsSync(cypressConfigPaths.ts)) {
    try {
      require('ts-node').register();
      return require(cypressConfigPaths.ts).default || require(cypressConfigPaths.ts);
    } catch (error) {
      console.error('❌ Error reading `cypress.config.ts`. Ensure `ts-node` is installed.');
      process.exit(1);
    }
  } else if (fs.existsSync(cypressConfigPaths.js)) {
    return require(cypressConfigPaths.js);
  } else if (fs.existsSync(cypressConfigPaths.json)) {
    return JSON.parse(fs.readFileSync(cypressConfigPaths.json, 'utf-8'));
  } else {
    console.error('❌ No Cypress config found!');
    process.exit(1);
  }
};

// Function to determine existing Playwright config format
const getExistingPlaywrightConfigPath = (): string | null => {
  if (fs.existsSync(playwrightConfigPaths.ts)) return playwrightConfigPaths.ts;
  if (fs.existsSync(playwrightConfigPaths.js)) return playwrightConfigPaths.js;
  return null;
};

// Function to format using Prettier
const formatWithPrettier = async (text: string, isTs: boolean): Promise<string> => {
  try {
    return await prettier.format(text, {
      parser: isTs ? 'typescript' : 'babel',
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
    });
  } catch (error) {
    console.warn('⚠️ Prettier formatting failed:', error);
    return text;
  }
};

// Function to safely extract the Playwright config object
// Function to safely extract the Playwright config object
const extractPlaywrightConfig = (config: string, filePath: string): Record<string, any> => {
  try {
    let match = config.match(/export default defineConfig\(([\s\S]*?)\);/m);
    if (match)
      return eval(`(${match[1]})`) as Record<string, any>;

    match = config.match(/export default (.*);/m);
    if (match)
      match = require(filePath);
    // @ts-ignore
    return match && match['default'] ? match['default'] : {};
  } catch (error) {
    console.warn('⚠️ Failed to parse existing Playwright config. Using empty object.');
    return {};
  }
};

// **Function to convert Cypress config to Playwright with dynamic variables**
export const convertConfigFiles = async (parsedVar: Record<string, any>): Promise<void> => {
  console.log('🚀 Converting Cypress config to Playwright...');

  // Read Cypress config
  const cypressConfig: CypressConfig = readCypressConfig();

  // Map Cypress settings to Playwright settings
  const cypressToPlaywright = {
    use: {
      baseURL: cypressConfig.baseUrl,
      viewport: {
        width: cypressConfig.viewportWidth ?? 1280,
        height: cypressConfig.viewportHeight ?? 720,
      },
      timeout: cypressConfig.defaultCommandTimeout ?? 10000,
      headless: cypressConfig.video === false,
      trace: cypressConfig.screenshotOnRunFailure ? 'on' : 'off',
    }
  };

  // Get the existing Playwright config path
  const existingPlaywrightConfigPath = getExistingPlaywrightConfigPath();
  let playwrightConfigContent = '';

  if (existingPlaywrightConfigPath) {
    playwrightConfigContent = fs.readFileSync(existingPlaywrightConfigPath, 'utf-8');

    const existingConfig = extractPlaywrightConfig(playwrightConfigContent, existingPlaywrightConfigPath);

    // Merge Cypress settings with existing Playwright config
    const mergedConfig = {
      ...parsedVar,
      ...existingConfig,
      ...cypressToPlaywright, // Merge new settings
      use: {
        ...existingConfig.use,
        ...cypressToPlaywright.use, // Merge `use` settings separately
      },
    };

    console.log(mergedConfig);

    // Generate new config string
    const updatedConfig = `
import { defineConfig } from '@playwright/test';

export default defineConfig(${JSON.stringify(mergedConfig, null, 4)});
        `;

    // Format before writing
    const formattedConfig = await formatWithPrettier(updatedConfig, existingPlaywrightConfigPath.endsWith('.ts'));
    fs.writeFileSync(existingPlaywrightConfigPath, formattedConfig, 'utf-8');
    console.log(`✅ Playwright config updated: ${existingPlaywrightConfigPath}`);
  } else {
    const newPlaywrightConfigPath = fs.existsSync(cypressConfigPaths.ts) ? playwrightConfigPaths.ts : playwrightConfigPaths.js;
    const isTs = newPlaywrightConfigPath.endsWith('.ts');

    const newConfig = `
import { defineConfig } from '@playwright/test';

export default defineConfig(${JSON.stringify(cypressToPlaywright, null, 4)});
        `;

    // Format before writing
    const formattedConfig = await formatWithPrettier(newConfig, isTs);
    fs.writeFileSync(newPlaywrightConfigPath, formattedConfig, 'utf-8');
    console.log(`✅ New Playwright config created: ${newPlaywrightConfigPath}`);
  }
};
