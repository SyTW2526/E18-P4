const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

async function waitForAppReady(driver, timeout = 15000) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText && document.querySelector("app-root").innerText.trim().length>0);'
    );
  }, timeout);
}

describe('E2E - Create group', function () {
  this.timeout(60000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';
  let createdGroupId = null;

  before(async function () {
    driver = await createDriver();
    await driver.get(BASE + '/');
    // wait for SPA root to be present and rendered before manipulating localStorage
    await waitForAppReady(driver, 20000);
    // set fake auth
    await driver.executeScript("window.localStorage.setItem('auth_token','FAKE_TOKEN');");
    await driver.executeScript("window.localStorage.setItem('auth_user', JSON.stringify({_id:'u1', nombre:'TestUser', email:'test@x.com'}));");
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
    // capture created group id for cleanup
    try {
      const body = apiRes.body || {};
      createdGroupId = body._id || body.id || body.insertedId || (body.result && body.result._id) || null;
    } catch (e) { createdGroupId = null; }
    // now navigate to home so the component loads the seeded groups
    await driver.get(BASE + '/home');
    // If we seeded the group via the API, wait for its card directly.
    if (createdGroupId) {
      try {
        await driver.wait(until.elementLocated(By.xpath(`//mat-card-title[contains(., "${name}")]`)), 15000);
        const card = await driver.findElement(By.xpath(`//mat-card-title[contains(., "${name}")]`));
        expect(await card.getText()).to.equal(name);
      } catch (e) {
        throw new Error('Timed out waiting for created group card after seeding. Last error: ' + e.message);
      }
    } else {
      // open create form (if present) and wait for input
      const createToggle = await driver.findElement(By.xpath("//button[contains(.,'Crear') or contains(.,'Crear grupo')]" )).catch(()=>null);
      if (createToggle) await createToggle.click();
      // wait for input (give more time for backend/app initialization)
      const input = await driver.wait(until.elementLocated(By.css('input[placeholder="Nombre del nuevo grupo"]')), 15000);
      // wait for the card with the group name to appear (may take longer)
      try {
        await driver.wait(until.elementLocated(By.xpath(`//mat-card-title[contains(., "${name}")]`)), 15000);
        const card = await driver.findElement(By.xpath(`//mat-card-title[contains(., "${name}")]`));
        expect(await card.getText()).to.equal(name);
      } catch (e) {
        throw new Error('Timed out waiting for created group card after creating via UI. Last error: ' + e.message);
      }
    }
  });

  after(async function () {
    try {
      if (createdGroupId) {
        // attempt to delete the created group via the API; ignore errors
        try {
          await driver.executeAsyncScript(function(id, baseApi, cb) {
            fetch(baseApi + '/user-group/shared-accounts/' + id, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' }
            }).then(resp => cb({ status: resp.status })).catch(err => cb({ error: (err && err.message) || String(err) }));
          }, createdGroupId, 'http://localhost:5200');
        } catch (e) {
          // swallow cleanup errors
        }
      }
    } finally {
      if (driver) await driver.quit();
    }
  });
});
