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
import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';
import { replaceThisInTypeAnnotation, appendPlayWrightObjectArgs } from './functions';

export default declare((api: BabelAPI) => {
  api.assertVersion(7);

  return {
    name: 'cucumber',
    visitor: {
      CallExpression(callPath) {
        // Check if the callee is Given, When, or Then.
        if (
          t.isIdentifier(callPath.node.callee) &&
            (callPath.node.callee.name === 'Given' ||
                callPath.node.callee.name === 'When' ||
                callPath.node.callee.name === 'Then')
        ) {
          // Process each argument
          callPath.get('arguments').forEach(argPath => {
            const node = argPath.node;
            if (t.isFunctionExpression(node) || t.isArrowFunctionExpression(node)) {
              // Replace the "this" parameter (if present) with "context" while preserving its type.
              appendPlayWrightObjectArgs(argPath);
              const replacer: string  = 'context';

              // Also update the function's return type annotation if it exists.
              if (node.returnType)
                replaceThisInTypeAnnotation(node.returnType, 'this', replacer);

              // Make the function async.
              node.async = true;

              // Replace all `this` references in the function body with `context`.
              // Using Babel's built-in traversal so we properly handle all scopes.
              argPath.traverse({
                ThisExpression(path) {
                  path.replaceWith(t.identifier(replacer));
                },
              });
            }
          });
        }
      },
    },
  };
});

