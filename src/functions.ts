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
