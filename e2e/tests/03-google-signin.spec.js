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

describe('E2E - Google Sign-In button presence', function () {
  this.timeout(60000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await createDriver();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('has Google Sign-In container on login', async function () {
    await driver.get(BASE + '/login');
    await waitForAppReady(driver, 20000);
    const btnDiv = await driver.findElement(By.css('#google-signin-button'));
    expect(btnDiv).to.exist;
  });

  it('has Google Sign-In container on register', async function () {
    await driver.get(BASE + '/register');
    await waitForAppReady(driver, 20000);
    const btnDiv = await driver.findElement(By.css('#google-signin-button-register'));
    expect(btnDiv).to.exist;
  });
});
