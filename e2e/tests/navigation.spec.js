const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');

describe('E2E - Navigation and Account', function () {
  this.timeout(60000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await new Builder().forBrowser('chrome').build();
    // open the app origin so we can write to localStorage for that origin
    await driver.get(BASE + '/');
    await driver.executeScript("window.localStorage.setItem('auth_token','FAKE_TOKEN');");
    await driver.executeScript("window.localStorage.setItem('auth_user', JSON.stringify({_id:'u1', nombre:'Test', email:'t@t.com'}));");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('goes to group page and finds header and actions', async function () {
    await driver.get(BASE + '/group/g1');
    // wait for header h2
    await driver.wait(until.elementLocated(By.css('h2')), 5000);
    const h2 = await driver.findElement(By.css('h2'));
    const text = await h2.getText();
    expect(text).to.match(/Cuenta|Cuenta compartida|Cuenta/);
    // check for 'Añadir gasto' button
    const addBtn = await driver.findElement(By.xpath("//button[contains(.,'Añadir gasto') or contains(.,'Añadir')]"));
    expect(await addBtn.isDisplayed()).to.be.true;
  });
});
