Given("User navigates to the Browserstack Homepage", async () => {

    await page.goto("https://www.browserstack.com/");

});

When('User clicks on Product Menu', async function () {

    await page.locator('button[aria-label="Products"]').waitFor();

    await page.locator('button[aria-label="Products"]').click();

});

Then('It should show Web Testing Product', async function () {

    await page.locator('div[aria-label="Products"] button[title="Web Testing"]').waitFor();

    expect(await page.locator('div[aria-label="Products"] button[title="Web Testing"] span').isVisible()).toBeTruthy()

});

Given('User Navigates to Browserstack Homepage', async function () {

    await page.goto("https://www.browserstack.com/");

});

When('User clicks on Pricing Menu', async function () {

    await page.locator('a[title="Pricing"]').click();

});

Then('It should Display correct Product lists in left Nav', async function () {

    var leftNavProducts = await page.locator('div[id="sidenav__list"]').textContent()

    var productArray = await leftNavProducts.split("\n").map((item) => {
        return item.trim();
    });

    expect(productArray).toEqual(expect.arrayContaining(['Live', 'App Live']));

});

After(async function () {

    await browser.close();

})