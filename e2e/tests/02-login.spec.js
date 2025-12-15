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

describe('E2E - Login page', function () {
  this.timeout(60000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await createDriver();
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('shows password field and toggles visibility', async function () {
    await driver.get(BASE + '/login');
    // wait for the app render to be ready then find password input
    await waitForAppReady(driver, 15000);
    // Prefer /login reactive form input; fallback to home sign-in input
    let pwdInput = await driver.wait(
      until.elementLocated(By.css('input[formcontrolname="password"]')),
      10000
    ).catch(async () => {
      return await driver.wait(until.elementLocated(By.css('input[name="se_password"]')), 5000);
    });
    
    // initially should be type password
    const t1 = await pwdInput.getAttribute('type');
    expect(t1).to.equal('password');

    // Find the toggle button: look for button with aria-label in the same form-field or nearby
    // Find toggle button within the same form-field
    let toggleBtn;
    try {
      // Prefer the visibility icon button within the same mat-form-field
      const formField = await driver.findElement(By.xpath("(//input[@formcontrolname='password'] | //input[@name='se_password'])[1]/ancestor::mat-form-field"));
      toggleBtn = await formField.findElement(By.xpath(".//button[contains(@class,'mat-icon-button')][.//mat-icon[normalize-space(text())='visibility' or normalize-space(text())='visibility_off']]"));
    } catch (e) {
      // Fallback: any matching aria-label on page
      toggleBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[@aria-label='Mostrar contraseña' or .//mat-icon[normalize-space(text())='visibility']]")),
        7000
      );
    }

    await driver.wait(until.elementIsVisible(toggleBtn), 3000);
    
    // Click the button - use executeScript for reliability with Angular Material
    try { await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', toggleBtn); } catch (_) {}
    // Click with fallback
    try { await toggleBtn.click(); } catch (_) { await driver.executeScript('arguments[0].click();', toggleBtn); }

    // Wait until the input type flips to text; if not, retry click once
    const changed = await driver.wait(async () => {
      try {
        const el = await driver.findElement(By.xpath("(//input[@formcontrolname='password'] | //input[@name='se_password'])[1]"));
        const typ = await el.getAttribute('type');
        return typ === 'text';
      } catch (_) { return false; }
    }, 4000).catch(() => false);

    if (!changed) {
      try { await toggleBtn.click(); } catch (_) { await driver.executeScript('arguments[0].click();', toggleBtn); }
      await driver.wait(async () => {
        try {
          const el = await driver.findElement(By.xpath("(//input[@formcontrolname='password'] | //input[@name='se_password'])[1]"));
          const typ = await el.getAttribute('type');
          return typ === 'text';
        } catch (_) { return false; }
      }, 4000);
    }

    // Final assertion
    pwdInput = await driver.findElement(By.xpath("(//input[@formcontrolname='password'] | //input[@name='se_password'])[1]"));
    const t2 = await pwdInput.getAttribute('type');
    expect(t2).to.equal('text');
  });
});
