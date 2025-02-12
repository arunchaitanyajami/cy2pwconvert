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
const packageJSON = require('../package.json');

const mapCucumber = (content: string): string => {

  const regx = /^\s*(Then|When|Given|And)\b/gm;
  let importStatementBefore = '';
  if (content.match(regx)) {
    if (packageJSON?.type && packageJSON?.type === 'module') {
      importStatementBefore += `import { Given, When, Then, Before, After, setDefaultTimeout } from "@cucumber/cucumber";\n\n`;
      importStatementBefore += `import { chromium, Browser, Page, BrowserContext, defineConfig, expect} from "@playwright/test";\n\n`;
    } else {
      importStatementBefore += `const { Given, When, Then, Before, After, setDefaultTimeout } = require("@cucumber/cucumber");\n\n`;
      importStatementBefore += `const { chromium, Browser, Page, BrowserContext, defineConfig, expect} = require("@playwright/test");\n\n`;
    }

    importStatementBefore += `let page,browser,context;\n\n`;

    if (!content.match(/^\s*(Before)\b/gm)) {
      importStatementBefore += `Before(async function () {
      const isHeadless = process.env.HEADLESS !== "false"; 
    browser = await chromium.launch({ headless: isHeadless });
  context = await browser.newContext();
  page = await context.newPage();
});\n\n`;
    }
  }

  let importStatementAfter = '';
  if (content.match(regx)) {
    if (!content.match(/^\s*(After)\b/gm)) {
      importStatementAfter += `After(async () => {
  await browser.close();
});\n\n`;
    }
  }

  return importStatementBefore + `${content}\n\n` + importStatementAfter;
};

export default mapCucumber;