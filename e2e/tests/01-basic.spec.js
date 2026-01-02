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
    console.log(`Navegando a: ${BASE}/`);
    await driver.get(BASE + '/');
    await waitForAppReady(driver, 60000);
  });

  // --- BLOQUE DE DIAGNÓSTICO ---
  afterEach(async function () {
    if (this.currentTest.state === 'failed' && driver) {
        console.log("!!! EL TEST FALLÓ - DIAGNÓSTICO DEL NAVEGADOR !!!");
        
        // 1. Ver URL actual
        const url = await driver.getCurrentUrl();
        console.log(`URL final: ${url}`);

        // 2. Ver errores de consola (JS Errors)
        try {
            const logs = await driver.manage().logs().get('browser');
            if (logs.length > 0) {
                console.log("--- LOGS DE CONSOLA (ERRORES JS) ---");
                logs.forEach(log => console.log(`[${log.level.name}] ${log.message}`));
                console.log("------------------------------------");
            }
        } catch(e) { console.log("No se pudieron leer logs del navegador."); }

        // 3. Ver código fuente (para ver si está en blanco o muestra error 404)
        const source = await driver.getPageSource();
        console.log("--- HTML DE LA PÁGINA (RESUMEN) ---");
        console.log(source.substring(0, 1000) + "..."); 
    }
  });
  // -----------------------------

  after(async function () {
    if (driver) await driver.quit();
  });

  it('should load the home page and render app root', async function () {
    const el = await driver.findElement(By.css('app-root, body'));
    const displayed = await el.isDisplayed();
    expect(displayed).to.be.true;
  });
});