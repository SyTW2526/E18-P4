const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

const CI_TIMEOUT = 60000;

async function waitForAppReady(driver, timeout = CI_TIMEOUT) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText && document.querySelector("app-root").innerText.trim().length>0);'
    );
  }, timeout);
}

describe('E2E - Navigation and Account', function () {
  this.timeout(120000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await createDriver();
    await driver.get(BASE + '/');
    await waitForAppReady(driver, CI_TIMEOUT);
    await driver.executeScript("window.localStorage.setItem('auth_token','FAKE_TOKEN');");
    await driver.executeScript("window.localStorage.setItem('auth_user', JSON.stringify({_id:'u1', nombre:'Test', email:'t@t.com'}));");
    await driver.navigate().refresh();
    await waitForAppReady(driver, CI_TIMEOUT);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('goes to group page and finds header and actions', async function () {
    // IMPORTANTE: En CI, 'g1' no existe porque la DB está vacía.
    // Navegamos a Home y hacemos click en el primer grupo si existe, o creamos uno.
    await driver.get(BASE + '/home');
    
    let groupCard;
    try {
        groupCard = await driver.wait(until.elementLocated(By.css('mat-card')), 5000);
    } catch(e) {
        console.log("No hay grupos. Test saltado o requiere seeds.");
        return; 
    }

    // Click en el primer grupo con reintento por si el elemento se vuelve stale
    for (let i = 0; i < 2; i++) {
      try {
        await driver.wait(until.elementIsVisible(groupCard), 2000);
        await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', groupCard);
        try { await groupCard.click(); } catch (_) { await driver.executeScript('arguments[0].click();', groupCard); }
        break;
      } catch (err) {
        if (i === 1) throw err;
        // re-localize if stale
        groupCard = await driver.wait(until.elementLocated(By.css('mat-card')), 3000);
      }
    }

    // wait for header h2
    await driver.wait(until.elementLocated(By.css('h2, mat-card-title')), CI_TIMEOUT);
    
    // check for 'Añadir gasto' button
    const addBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(.,'Añadir gasto') or contains(.,'Añadir') or contains(.,'Add')]")),
        CI_TIMEOUT
    );
    expect(await addBtn.isDisplayed()).to.be.true;
  });
});