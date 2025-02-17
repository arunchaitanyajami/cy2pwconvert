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
              const identifier: string = 'this';
              const replacer: string  = 'context';
              renameThisParam(argPath, identifier, replacer);

              // Also update the function's return type annotation if it exists.
              if (node.returnType)
                replaceThisInTypeAnnotation(node.returnType, identifier, replacer);


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

/**
 * Replaces the parameter named `identifier` (e.g. "this") with a new identifier (e.g. "context").
 * The new parameter will preserve the original type annotation.
 */
function renameThisParam(funcPath: any, identifier: string, newName: string) {
  const node = funcPath.node;
  // Find a parameter whose name matches the identifier.
  const index = node.params.findIndex(
      (param: any) => t.isIdentifier(param) && param.name === identifier
  );
  if (index !== -1) {
    const oldParam = node.params[index] as t.Identifier;
    // Create a new identifier with the new name and preserve the type annotation.
    const newParam = t.identifier(newName);
    if (oldParam.typeAnnotation) {
      // Replace any occurrence of the old identifier inside the type annotation.
      newParam.typeAnnotation = t.cloneDeep(oldParam.typeAnnotation);
      replaceThisInTypeAnnotation(newParam.typeAnnotation, identifier, newName);
    }
    node.params[index] = newParam;
  }
}

/**
 * Recursively replaces any type references to `identifier` with `newName` inside type annotations.
 */
function replaceThisInTypeAnnotation(node: any, identifier: string, newName: string): void {
  if (!node) return;

  // Handle TS style type references.
  if (
    typeof t.isTSTypeReference === 'function' &&
      t.isTSTypeReference(node) &&
      t.isIdentifier(node.typeName) &&
      node.typeName.name === identifier
  )
    node.typeName.name = newName;


  // Handle Flow style generic type annotations.
  if (
    typeof t.isGenericTypeAnnotation === 'function' &&
      t.isGenericTypeAnnotation(node) &&
      t.isIdentifier(node.id) &&
      node.id.name === identifier
  )
    node.id.name = newName;


  // Recursively process all properties of the node.
  for (const key in node) {
    if (Object.prototype.hasOwnProperty.call(node, key)) {
      const child = node[key];
      if (Array.isArray(child)) {
        child.forEach(item => {
          if (item && typeof item === 'object' && item.type)
            replaceThisInTypeAnnotation(item, identifier, newName);

        });
      } else if (child && typeof child === 'object' && child.type) {
        replaceThisInTypeAnnotation(child, identifier, newName);
      }
    }
  }
}

