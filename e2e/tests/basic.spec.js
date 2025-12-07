const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

async function waitForAppReady(driver, timeout = 30000) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText && document.querySelector("app-root").innerText.trim().length>0);'
    );
  }, timeout);
}

describe('E2E - Basic smoke tests', function () {
  this.timeout(60000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await createDriver();
    await driver.get(BASE + '/');
    await waitForAppReady(driver, 15000);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('should load the home page and render app root', async function () {
    // verify app-root is present and visible
    const el = await driver.findElement(By.css('app-root, body'));
    const displayed = await el.isDisplayed();
    expect(displayed).to.be.true;
  });

});
