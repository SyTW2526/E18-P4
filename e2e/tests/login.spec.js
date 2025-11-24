const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');

describe('E2E - Login page', function () {
  this.timeout(60000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('shows password field and toggles visibility', async function () {
    await driver.get(BASE + '/login');
    await driver.wait(until.elementLocated(By.css('input[formcontrolname="password"]')), 5000);
    const pwdInput = await driver.findElement(By.css('input[formcontrolname="password"]'));
    // initially should be type password
    const t1 = await pwdInput.getAttribute('type');
    expect(t1).to.equal('password');

    const toggle = await driver.findElement(By.css('button[aria-label="Mostrar contraseña"]'));
    await toggle.click();
    // after clicking, type should be text
    await driver.sleep(200); // small wait for change
    const t2 = await pwdInput.getAttribute('type');
    expect(t2).to.equal('text');
  });
});
