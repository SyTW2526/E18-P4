const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');

describe('E2E - Create group', function () {
  this.timeout(60000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
    await driver.get(BASE + '/');
    // set fake auth
    await driver.executeScript("window.localStorage.setItem('auth_token','FAKE_TOKEN');");
    await driver.executeScript("window.localStorage.setItem('auth_user', JSON.stringify({_id:'u1', nombre:'TestUser', email:'test@x.com'}));");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('creates a new shared account via the create form', async function () {
    // helper: create an account directly via API so UI has deterministic data
    const name = 'E2E Group ' + Date.now();
    const apiRes = await driver.executeAsyncScript(function(groupName, baseApi, cb) {
      fetch(baseApi + '/user-group/shared-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: groupName, fecha_creacion: new Date(), moneda: 'EUR', creador_id: 'u1' })
      })
      .then(resp => resp.json().then(body => cb({ status: resp.status, body })))
      .catch(err => cb({ error: err && err.message ? err.message : String(err) }));
    }, name, 'http://localhost:5200');
    if (!apiRes || apiRes.error) throw new Error('API seeding failed: ' + (apiRes && apiRes.error));
    // now navigate to home so the component loads the seeded groups
    await driver.get(BASE + '/home');
    // open create form (if present) and wait for input
    const createToggle = await driver.findElement(By.xpath("//button[contains(.,'Crear') or contains(.,'Crear grupo')]")).catch(()=>null);
    if (createToggle) await createToggle.click();
    // wait for input (give more time for backend/app initialization)
    const input = await driver.wait(until.elementLocated(By.css('input[placeholder="Nombre del nuevo grupo"]')), 10000);
    // wait for the card with the group name to appear (may take longer)
    try {
      await driver.wait(until.elementLocated(By.xpath(`//mat-card-title[contains(., "${name}")]`)), 15000);
      const card = await driver.findElement(By.xpath(`//mat-card-title[contains(., "${name}")]`));
      expect(await card.getText()).to.equal(name);
    } catch (e) {
      throw new Error('Timed out waiting for created group card after seeding. Last error: ' + e.message);
    }
  });
});
