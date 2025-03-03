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
import * as t from '@babel/types';

export default function declare(api: BabelAPI) {
  api.assertVersion(7);

  return {
    name: 'transformCyCommands',
    visitor: {
      CallExpression(callPath: any) {
        const { callee, arguments: args } = callPath.node;
        if (t.isMemberExpression(callee.object) &&
            t.isIdentifier(callee.object.object) &&
            callee.object.object.name === 'Cypress' &&
            callee.object.property.name === 'Commands'
        ) {
          const commandBody = args[1];
          const commandName = args[0].value;

          const declaration = {
            type: 'FunctionDeclaration',
            id: {
              type: 'Identifier',
              name: commandName,
            },
            async: true,
            body: commandBody.body,
            generator: false,
            params: [
              { type: 'Identifier', name: 'page' },
              ...commandBody.params,
            ]
          };

          // @ts-ignore
          callPath.replaceWithMultiple([declaration]);
        }
      }
    },
  };
}
