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
import { declare } from '@babel/helper-plugin-utils';
import * as t from '@babel/types';

export default declare(api => {
  api.assertVersion(7);

  return {
    name: 'ArrowFunctionExpression',
    visitor: {
      ArrowFunctionExpression(path) {
        const { node } = path;

        // Helper function to extract parameter names
        const getParamNames = (params: any[]) => {
          return params.flatMap(param => {
            if (t.isIdentifier(param))
              return [param.name]; // Direct parameter (e.g., user)


            if (t.isObjectPattern(param)) {
              return param.properties.map(prop => {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key))
                  return prop.key.name; // Destructured parameter (e.g., { page })

                return null;
              }).filter(Boolean) as string[];
            }

            if (t.isObjectExpression(param)) {
              return param.properties.map(prop => {
                if (t.isObjectProperty(prop) && t.isIdentifier(prop.key))
                  return prop.key.name; // Object literal (e.g., { page: myPage })

                return null;
              }).filter(Boolean) as string[];
            }

            return [];
          }).filter(Boolean);
        };

        const paramNames = getParamNames(node.params);

        // Check if 'page' exists in parameters
        const hasPageParam = paramNames.includes('page');

        // Check if 'page' is used in the function body
        let usesPage = false;
        path.traverse({
          Identifier(innerPath) {
            if (innerPath.node.name === 'page' || innerPath.node.name === 'cy') {
              usesPage = true;
              innerPath.stop();
            }
          }
        });

        // Add 'page' as the first parameter if it's used but not present
        if (usesPage && !hasPageParam)
          node.params.unshift(t.identifier('page'));

        // Handle 'this: World' to 'World'
        node.params = node.params.map(param => {
          if (t.isTSParameterProperty(param)) { // @ts-ignore
            return t.identifier((param.parameter as t.Identifier).name);
          }

          return param;
        });
      }
    },
  };
});
