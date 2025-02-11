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

const mapCucumber = (content: string): string => {

  let importStatementBefore = '';
  if (content.match(/(Then|When|Given|And)/g)) {
    importStatementBefore += `import { Given, When, Then, Before, After, setDefaultTimeout } from "@cucumber/cucumber";\n\n`;
    importStatementBefore += `import { chromium, Browser, Page, BrowserContext, defineConfig, test, expect } from "@playwright/test";\n\n`;
    importStatementBefore += `let page,browser,context;\n\n`;
    importStatementBefore += `Before(async function () {
    browser = await chromium.launch({ headless: false });
  context = await browser.newContext();
  page = await context.newPage();
});\n\n`;
  }

  let importStatementAfter = '';
  if (content.match(/(Then|When|Given|And)/g)){
    importStatementAfter += `After(async () => {
  await browser.close();
});\n\n`;
  }

  return importStatementBefore + `${content}\n\n` + importStatementAfter;
};

export default mapCucumber;