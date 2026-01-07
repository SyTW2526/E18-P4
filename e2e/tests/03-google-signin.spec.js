const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

// CONSTANTE CI
const CI_TIMEOUT = 60000;

async function waitForAppReady(driver, timeout = CI_TIMEOUT) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText && document.querySelector("app-root").innerText.trim().length>0);'
    );
  }, timeout);
}

describe('E2E - Google Sign-In button presence', function () {
  this.timeout(120000); // 2 minutos
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
    await waitForAppReady(driver, CI_TIMEOUT); // 60s
    // Selectores más robustos
    const btnDiv = await driver.wait(
        until.elementLocated(By.css('#google-signin-button, .g-signin2, #google-btn-container')), 
        CI_TIMEOUT
    );
    expect(btnDiv).to.exist;
  });

  it('has Google Sign-In container on register', async function () {
    await driver.get(BASE + '/register');
    await waitForAppReady(driver, CI_TIMEOUT); // 60s
    const btnDiv = await driver.wait(
        until.elementLocated(By.css('#google-signin-button-register, .g-signin2')), 
        CI_TIMEOUT
    );
    expect(btnDiv).to.exist;
  });
});