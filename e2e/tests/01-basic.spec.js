const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

async function waitForAppReady(driver, timeout = 60000) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText && document.querySelector("app-root").innerText.trim().length>0);'
    );
  }, timeout);
}

describe('E2E - Basic smoke tests', function () {
  this.timeout(180000); 
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await createDriver();
    await driver.get(BASE + '/');
    await waitForAppReady(driver, 60000);
  });

  // --- NEW DEBUGGING BLOCK ---
  afterEach(async function () {
    if (this.currentTest.state === 'failed' && driver) {
        console.log("!!! TEST FAILED - BROWSER DIAGNOSTICS !!!");
        
        // 1. Current URL
        const url = await driver.getCurrentUrl();
        console.log(`Current URL: ${url}`);

        // 2. Browser Console Logs (JS Errors)
        try {
            const logs = await driver.manage().logs().get('browser');
            if (logs.length > 0) {
                console.log("--- CONSOLE LOGS START ---");
                logs.forEach(log => console.log(`[${log.level.name}] ${log.message}`));
                console.log("--- CONSOLE LOGS END ---");
            }
        } catch(e) { console.log("Could not read browser logs"); }

        // 3. Page Source (To see if it's blank or showing 404)
        const source = await driver.getPageSource();
        console.log("--- PAGE SOURCE SNIPPET ---");
        console.log(source.substring(0, 1000)); 
    }
  });
  // ---------------------------

  after(async function () {
    if (driver) await driver.quit();
  });

  it('should load the home page and render app root', async function () {
    const el = await driver.findElement(By.css('app-root, body'));
    const displayed = await el.isDisplayed();
    expect(displayed).to.be.true;
  });
});