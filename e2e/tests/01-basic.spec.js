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
  // CRÍTICO: 180s para que no muera en CI lento
  this.timeout(180000); 
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await createDriver();
    await driver.get(BASE + '/');
    await waitForAppReady(driver, 60000);
  });
  
  // Añadimos esto para depurar si falla
  afterEach(async function () {
    if (this.currentTest.state === 'failed' && driver) {
        console.log("!!! FALLO EN BASIC TEST - LOGS !!!");
        try {
            const logs = await driver.manage().logs().get('browser');
            logs.forEach(log => console.log(`[BROWSER] ${log.level.name}: ${log.message}`));
        } catch(e) { console.log("No se pudieron leer logs"); }
    }
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('should load the home page and render app root', async function () {
    const el = await driver.findElement(By.css('app-root, body'));
    const displayed = await el.isDisplayed();
    expect(displayed).to.be.true;
  });
});