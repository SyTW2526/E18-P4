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
    try {
        driver = await createDriver();
        console.log(`Navegando a: ${BASE}/`);
        await driver.get(BASE + '/');
        
        // Intentamos esperar a que cargue
        await waitForAppReady(driver, 60000);
        
    } catch (e) {
        console.log("!!! ERROR CRÍTICO EN CARGA INICIAL (BEFORE HOOK) !!!");
        
        if (driver) {
            // 1. URL Actual (¿Nos redirigió a login? ¿Se quedó en 4200?)
            const url = await driver.getCurrentUrl();
            console.log(`URL en el momento del fallo: ${url}`);

            // 2. Logs del Navegador (Aquí veremos si Angular crasheó)
            try {
                const logs = await driver.manage().logs().get('browser');
                console.log("--- BROWSER CONSOLE LOGS ---");
                logs.forEach(log => console.log(`[${log.level.name}] ${log.message}`));
                console.log("----------------------------");
            } catch (logErr) {
                console.log("No se pudieron leer los logs del navegador.");
            }

            // 3. Código fuente (¿Está vacío el body?)
            const source = await driver.getPageSource();
            console.log("--- HTML SNIPPET ---");
            console.log(source.substring(0, 1000));
            console.log("--------------------");
        }
        
        // Relanzamos el error para que el test falle oficialmente
        throw e;
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