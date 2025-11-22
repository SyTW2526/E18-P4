const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('chai');

describe('E2E - Create and delete gasto', function () {
  this.timeout(90000);
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

  it('creates a gasto inside the first available group and then deletes it', async function () {
    await driver.get(BASE + '/home');
    // ensure groups loaded (allow more time for network)
    await driver.wait(until.elementLocated(By.css('mat-card')), 15000);
    // click first group's Ver button (try multiple possible labels)
    const verBtn = await driver.findElement(By.xpath("(//mat-card//button[contains(. , 'Ver') or contains(. , 'Entrar') or contains(. , 'Abrir')])[1]")).catch(async ()=>{
      // fallback: try a button inside first mat-card
      return await driver.findElement(By.xpath('(//mat-card)[1]//button')).catch(()=>{throw new Error('Could not find a group card or Ver button');});
    });
    await verBtn.click();

    // wait for group page h2
    await driver.wait(until.elementLocated(By.css('h2')), 10000);

    // click 'Añadir gasto' button
    const addBtn = await driver.findElement(By.xpath("//button[contains(.,'Añadir gasto') or contains(.,'Añadir')]"));
    await addBtn.click();

    // wait for create gasto page
    await driver.wait(until.elementLocated(By.css('input[placeholder="Descripción"]')), 10000);
    const desc = 'E2E Test Gasto ' + Date.now();
    await driver.findElement(By.css('input[placeholder="Descripción"]')).sendKeys(desc);
    await driver.findElement(By.css('input[placeholder="Monto"]')).sendKeys('12.34');
    // click Añadir
    const addGastoBtn = await driver.findElement(By.xpath('//button[contains(. , "Añadir") and not(contains(. , "Cancelar"))]'));
    await addGastoBtn.click();

    // back to group page; wait for gasto label
    await driver.wait(until.elementLocated(By.xpath(`//div[contains(., "${desc}")]`)), 12000);
    const gastoEl = await driver.findElement(By.xpath(`//div[contains(., "${desc}")]`));
    expect(await gastoEl.getText()).to.contain('E2E Test Gasto');

    // delete the gasto: click delete icon/button near that gasto
    const deleteBtn = await driver.findElement(By.xpath(`//div[contains(., "${desc}")]//button[contains(@title,'Eliminar gasto') or contains(. , 'Eliminar') or contains(@title,'delete')]`)).catch(async ()=>{
      // try generic delete button in the same list item
      return await driver.findElement(By.xpath(`(//mat-list-item//button[contains(@title,'Eliminar gasto') or contains(. , 'Eliminar')])[1]`));
    });
    // confirm the browser dialog
    await deleteBtn.click();
    // accept confirm dialog
    try {
      const alert = await driver.switchTo().alert();
      await alert.accept();
    } catch (e) {
      // some browsers may not raise alert; ignore
    }

    // wait briefly and assert the gasto text no longer present
    await driver.sleep(1500);
    const elements = await driver.findElements(By.xpath(`//div[contains(., "${desc}")]`));
    expect(elements.length).to.equal(0);
  });
});
