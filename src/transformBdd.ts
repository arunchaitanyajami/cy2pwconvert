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
    name: 'transform-bdd',
    visitor: {
      CallExpression(callPath) {
        if (
          t.isIdentifier(callPath.node.callee) &&
            (callPath.node.callee.name === 'Given' ||
                callPath.node.callee.name === 'When' ||
                callPath.node.callee.name === 'Then')
        )
          callPath.node.callee.name = 'test';
      }
    },
  };
});
