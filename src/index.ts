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

import { transform } from './transform';
import type { BabelAPI } from '@babel/helper-plugin-utils';
import mapImports from './mapImports';
import mapCucumber from './mapCucumber';
import cucumber from './cucumber';
import path from 'path';
import fs from 'fs';
import transformBdd from './transformBdd';
import ArrowFunctionExpression from './ArrowFunctionExpression';
import transformCyCommands from './transformCyCommands';

type Result = {
  text?: string;
  error?: { message: string, line: number, column: number };
};

/**
 * Get custom Babel plugins from package.json or babel.config.js
 */
function getCustomBabelPlugins(): any {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  const babelConfigPath = path.resolve(process.cwd(), 'babel.config.js');

  try {
    // Check for babel plugins in package.json
    if (fs.existsSync(packageJsonPath)) {
      const pkg = require(packageJsonPath);
      if (pkg.babel && pkg.babel.plugins)
        return pkg.babel.plugins;

    }

    // Check for babel.config.js
    if (fs.existsSync(babelConfigPath)) {
      const babelConfig = require(babelConfigPath);
      if (babelConfig.plugins)
        return babelConfig.plugins;

    }
  } catch (err) {
    console.error('Error loading Babel configuration:', err);
  }

  return [];
}
export default async function(api: BabelAPI, prettier: typeof import('prettier'), filePath: string, text: string, option?: any): Promise<Result> {
  let pluginsList = [
    transform,
    cucumber,
    ArrowFunctionExpression,
    transformCyCommands,
  ];

  const preserveBDD: boolean = option?.preserveBDD === '1' || option?.preserveBDD === 'true';
  if (!preserveBDD){
    // @ts-ignore
    pluginsList.push(transformBdd);
  }

  const enablePlugins: boolean = option?.enablePlugins === '1' || option?.enablePlugins === 'true';
  if (enablePlugins) {
    const customPlugins = getCustomBabelPlugins();

    pluginsList = [...pluginsList, ...customPlugins];
  }

  try {
    text = api.transform(text, {
      filename: filePath,
      plugins: pluginsList,
      retainLines: true,
      presets: ['@babel/preset-typescript'],
    })!.code!;
  } catch (e: any) {
    if (!e.loc)
      throw e;
    return {
      error: {
        message: e.message.split('\n')[0],
        line: e.loc.line,
        column: e.loc.column
      }
    };
  }

  text = mapImports(text);
  text = mapCucumber(text, filePath);

  try {
    text = await prettier.format(text, {
      parser: 'typescript',
      semi: true,
      trailingComma: 'es5',
      singleQuote: true
    });
  } catch (e) {
    console.log(e);
  }
  return { text };
}
