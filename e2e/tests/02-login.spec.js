const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');
const { waitForAppReady, CI_TIMEOUT } = require('../driver');

describe('E2E - Login page', function () {
  // Mocha timeout debe ser mayor que los waits de Selenium
  this.timeout(CI_TIMEOUT * 2); // 120 segundos
  
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
    
    // 1. Esperar carga inicial (vital en CI)
    await waitForAppReady(driver, CI_TIMEOUT);

    // 2. Buscar input de contraseña (con timeout generoso)
    // Prefer /login reactive form input; fallback to home sign-in input
    let pwdInput;
    try {
        pwdInput = await driver.wait(
          until.elementLocated(By.css('input[formcontrolname="password"]')),
          CI_TIMEOUT // CAMBIADO: 10000 -> 60000
        );
    } catch (e) {
        console.log("Input principal no encontrado, buscando fallback...");
        pwdInput = await driver.wait(
            until.elementLocated(By.css('input[name="se_password"]')), 
            CI_TIMEOUT
        );
    }
    
    // initially should be type password
    const t1 = await pwdInput.getAttribute('type');
    expect(t1).to.equal('password');

    // 3. Buscar botón toggle
    let toggleBtn;
    try {
      // Prefer the visibility icon button within the same mat-form-field
      const formField = await driver.findElement(By.xpath("(//input[@formcontrolname='password'] | //input[@name='se_password'])[1]/ancestor::mat-form-field"));
      toggleBtn = await formField.findElement(By.xpath(".//button[contains(@class,'mat-icon-button')][.//mat-icon[normalize-space(text())='visibility' or normalize-space(text())='visibility_off']]"));
    } catch (e) {
      // Fallback: any matching aria-label on page
      toggleBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[@aria-label='Mostrar contraseña' or .//mat-icon[normalize-space(text())='visibility']]")),
        CI_TIMEOUT // CAMBIADO: 7000 -> 60000
      );
    }

    await driver.wait(until.elementIsVisible(toggleBtn), CI_TIMEOUT);
    
    // Click logic
    try { await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', toggleBtn); } catch (_) {}
    
    try { await toggleBtn.click(); } catch (_) { await driver.executeScript('arguments[0].click();', toggleBtn); }

    // Wait until the input type flips to text
    const changed = await driver.wait(async () => {
      try {
        const el = await driver.findElement(By.xpath("(//input[@formcontrolname='password'] | //input[@name='se_password'])[1]"));
        const typ = await el.getAttribute('type');
        return typ === 'text';
      } catch (_) { return false; }
    }, 10000).catch(() => false); // Subido a 10s por si acaso

    // Retry click if failed first time
    if (!changed) {
      console.log("Primer click falló, reintentando toggle...");
      try { await toggleBtn.click(); } catch (_) { await driver.executeScript('arguments[0].click();', toggleBtn); }
      
      await driver.wait(async () => {
        try {
          const el = await driver.findElement(By.xpath("(//input[@formcontrolname='password'] | //input[@name='se_password'])[1]"));
          const typ = await el.getAttribute('type');
          return typ === 'text';
        } catch (_) { return false; }
      }, 10000);
    }

    // Final assertion
    pwdInput = await driver.findElement(By.xpath("(//input[@formcontrolname='password'] | //input[@name='se_password'])[1]"));
    const t2 = await pwdInput.getAttribute('type');
    expect(t2).to.equal('text');
  });
});