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
 * This command should run at the end of all file conversions , because it uses regular expressions.
 * @param content
 */
const mapCommand = (content: string): string  => {
  return content.replace(/Cypress\.Commands\.add\('([^']+)',\s*(?:async\s*)?\(([^)]*)?\)\s*=>\s*{([\s\S]+?)\n}\)/g, (match, functionName, params, body) => {
    params = params ? params.trim() : ''; // Handle empty params
    return `export async function ${functionName}(page${params ? `, ${params}` : ''}) {
        ${body} 
        }`;
  });
};
export default mapCommand;