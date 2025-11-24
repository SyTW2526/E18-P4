const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');

describe('E2E - Basic smoke tests', function () {
  this.timeout(60000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';
  const BROWSER = (process.env.BROWSER || 'chrome').toLowerCase();

  before(async function () {
    driver = await new Builder().forBrowser(BROWSER).build();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('should load the home page and render app root', async function () {
    await driver.get(BASE + '/');
    // wait for app-root (or body) to be present
    await driver.wait(until.elementLocated(By.css('app-root, body')), 10000);
    const el = await driver.findElement(By.css('app-root, body'));
    const displayed = await el.isDisplayed();
    expect(displayed).to.be.true;
  });

});
