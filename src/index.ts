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
import mapCommand from './mapCommands';
import mapImports from './mapImports';
import mapCucumber from './mapCucumber';
import cucumber from './cucumber';

type Result = {
  text?: string;
  error?: { message: string, line: number, column: number };
};

export default async function(api: BabelAPI, prettier: typeof import('prettier'), filePath: string, text: string, plugins?: any): Promise<Result> {
  try {
    text = api.transform(text, {
      filename: filePath,
      plugins: [transform, cucumber],
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

  text = mapCommand(text);
  text = mapImports(text);
  text = mapCucumber(text, filePath);

  try {
    text = await prettier.format(text, {
      parser: 'typescript',
      semi: true,
      trailingComma: 'es5',
      singleQuote: true,
      plugins
    });
  } catch (e) {
    console.log(e);
  }
  return { text };
}
