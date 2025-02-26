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
import { types as t } from '@babel/core';

export function getImportType(filePath: string): 'import' | 'require' {
  const ext = path.extname(filePath);
  const isTS = ext === '.ts' || ext === '.tsx';

  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');

    // Check for import and require usage
    const usesImport = /\bimport\s+[^;]+;?/g.test(fileContent);
    const usesRequire = /\brequire\(['"][^'"]+['"]\)/g.test(fileContent);

    if (isTS || usesImport) return 'import';
    if (usesRequire) return 'require';

    // Default fallback
    return isTS ? 'import' : 'require';
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return 'require'; // Safe fallback
  }
}

/**
 * Create object patterns.
 *
 * @param params
 * @param isObjectPattern
 */
export function createObjectPattern(params: string[], isObjectPattern: boolean = true) {
  return t.objectPattern(params.map(param => {
    return t.objectProperty(t.identifier(param === 'this' ? 'context' : param), t.identifier(param === 'this' ? 'context' : param), false, true);
  }));
}

/**
 * Recursively replaces any type references to `identifier` with `newName` inside type annotations.
 */
export function replaceThisInTypeAnnotation(node: any, identifier: string, newName: string): void {
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

/**
 * Append Page playwright Object.
 *
 * @param funcPath
 */
export function appendPlayWrightObjectArgs(funcPath: any) {
  const node = funcPath.node;
  // Ensure page is added to parameters

  const newParams = ['page', ...node.params.map((p: { name: any; }) => p.name)];

  node.params = [createObjectPattern(newParams)];
}