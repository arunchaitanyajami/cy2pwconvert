# cy2pwconvert

A command-line tool to **migrate Cypress tests to Playwright**, preserving directory structure and converting `.js` & `.ts` test files automatically.

## 🚀 Features

✅ Converts Cypress `.js` and `.ts` test files to Playwright  
✅ Preserves the original folder structure  
✅ Supports **custom source and target directories**  
✅ CLI-based, install once and use anywhere  
✅ Error handling for missing directories

---

## 📥 Installation

### 1️⃣ **Global Installation** (Recommended)
```sh
npm install -g cy2pwconvert
```

### 2️⃣ **Local Installation (Project-based)**
```sh
npm install --save-dev cy2pwconvert
```

---

## 📌 Usage

### 🔄 **Convert Cypress Tests (Default Paths)**
```sh
cy2pwconvert
```
(Default: `./cypress/integration` → `./playwright/tests`)

### 📂 **Convert with Custom Source & Target Directories**
```sh
cy2pwconvert ./my-cypress-tests ./my-playwright-tests
```

### 🆘 **Help**
```sh
cy2pwconvert --help
```

### **Options**
```shell
Usage: npx cy2pwconvert .cypress/ tests/

Arguments:
  src                                            Source file or folder
  dst                                            Target file or folder

Options:
  -V, --version                                  output the version number
  -ft, --filetype <filetype>                     File types to convert default: .js, example: .js,.ts, current support: .js,.ts,.jsx (default: ".js")
  -idp, --installDependency <installDependency>  Installs Dependency after project clone (default: false)
  -sC, --skipConfig <installDependency>          Skips the config conversion from cypress to playwright (default: true)
  -h, --help                                     display help for command

```

---

## 🔧 How It Works

- Replaces Cypress commands (`cy.visit()`, `cy.get()`, etc.) with Playwright equivalents.
- Ensures `async/await` syntax for Playwright compatibility.
- Converts all `.js` and `.ts` test files while maintaining directory structure.
- Converts you Cypress config to Playwright config

---

## 📖 Example
### **Before (Cypress Test)**
```js
describe('Login', () => {
  it('should log in successfully', () => {
    cy.visit('/login');
    cy.get('#username').type('admin');
    cy.get('#password').type('password');
    cy.contains('Submit').click();
    cy.get('.dashboard').should('be.visible');
  });
});
```

### **After (Playwright Test)**
```js
test.describe('Login', async ({ page }) => {
  test('should log in successfully', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#username').fill('admin');
    await page.locator('#password').fill('password');
    await page.getByText('Submit').click();
    await expect(page.locator('.dashboard')).toBeVisible();
  });
});
```

🛠 Supported Cypress → Playwright Config Mappings

✅ Supports all Cypress config formats:
* cypress.config.js
* cypress.config.json
* cypress.config.ts (via ts-node)

✅ Merges into existing playwright.config.ts
* If the Playwright config already has settings, it preserves them while adding the new ones.

✅ Creates a new Playwright config if missing

✅ Supports both Playwright JS & TS configs:
* Detects if playwright.config.ts or playwright.config.js exists.
* Merges Cypress settings into the correct file.

✅ Handles missing Playwright config:

* If no playwright.config.ts/js exists, it creates a new one based on the detected Cypress format.
* 
✅ Automatically formats with Prettier


---

## 🛠 Development & Contributions
### 🔧 **Local Development**
Clone the repo:
```sh
git clone git@github.com:arunchaitanyajami/cy2pwconvert.git
cd cy2pwconvert
npm install
```

### 🔗 **Link for Local Testing**
```sh
npm link
cy2pwconvert ./cypress/integration ./playwright/tests
```

---

## Foundation

I took the inspiration from ``cy2pw`` package.
Copied the code and added additional features on top of this code.

Open Source Packages : https://www.npmjs.com/package/cy2pw


## 📝 License
MIT License. Feel free to contribute! 🚀

