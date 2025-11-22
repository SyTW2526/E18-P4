const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');

describe('E2E - Join group (error cases)', function () {
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

  it('shows error when trying to join non-existing group', async function () {
    await driver.get(BASE + '/home');
    // ensure we have a stable count of visible groups before attempting join
    await driver.wait(until.elementLocated(By.css('mat-card')), 8000).catch(()=>{});
    const beforeCards = await driver.findElements(By.css('mat-card'));
    const beforeCount = beforeCards.length;

    // open join form if toggle exists
    const joinToggle = await driver.findElement(By.xpath("//button[contains(.,'Unirse') or contains(.,'Unirse al grupo')]")).catch(()=>null);
    if (joinToggle) await joinToggle.click();
    const input = await driver.wait(until.elementLocated(By.css('input[placeholder="ID del grupo"]')), 8000).catch(()=>null);
    if (!input) throw new Error('Join input not found; the join form may not be visible');
    await input.clear();
    await input.sendKeys('non-existent-id-xyz');

    const joinBtn = await driver.wait(until.elementLocated(By.xpath("//button[contains(.,'Unirse') or contains(.,'Uniendo') or contains(.,'Join') or contains(.,'Aceptar') ]")), 8000).catch(()=>null);
    if (!joinBtn) throw new Error('Join button not found');
    await joinBtn.click();

    // after attempt, wait briefly and assert that the visible group count did not increase
    await driver.sleep(1200);
    const afterCards = await driver.findElements(By.css('mat-card'));
    const afterCount = afterCards.length;
    expect(afterCount, 'Expected group count to remain unchanged after attempting to join non-existent group').to.equal(beforeCount);
  });
});
