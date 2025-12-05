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

describe('E2E - Create and delete gasto', function () {
  this.timeout(90000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await createDriver();
    await driver.get(BASE + '/');
    await waitForAppReady(driver, 20000);
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
    await driver.sleep(500);
    let cards = await driver.findElements(By.css('mat-card'));
    if (cards.length === 0) {
      // no groups yet: create one via the UI create form
      const createToggle = await driver.findElement(By.xpath("//button[contains(.,'Crear')]")).catch(()=>null);
      if (createToggle) {
        await createToggle.click();
        // small pause to let Angular render the form
        await driver.sleep(500);
      }
      // wait for create input (allow more time on CI)
      await driver.wait(until.elementLocated(By.css('input[placeholder="Nombre del nuevo grupo"]')), 15000);
      const gname = 'E2E Grupo ' + Date.now();
      await driver.findElement(By.css('input[placeholder="Nombre del nuevo grupo"]')).sendKeys(gname);
      const createBtn = await driver.findElement(By.xpath("//button[contains(.,'Crear grupo') or contains(.,'Crear')]")).catch(()=>null);
      if (createBtn) await createBtn.click();
      // allow load
      await driver.wait(until.elementLocated(By.css('mat-card')), 10000);
      cards = await driver.findElements(By.css('mat-card'));
    }
    // click first group's Ver button (try multiple possible labels)
    const verBtn = await driver.findElement(By.xpath("(//mat-card//button[contains(. , 'Ver') or contains(. , 'Entrar') or contains(. , 'Abrir')])[1]"))
      .catch(async () => {
        // fallback: click the first mat-card directly
        const card = await driver.findElement(By.xpath('(//mat-card)[1]')).catch(() => { throw new Error('Could not find a group card or Ver button'); });
        await card.click();
        return null;
      });
    if (verBtn) await verBtn.click();

    // wait for group page h2
    await driver.wait(until.elementLocated(By.css('h2')), 10000);

    // click 'Añadir gasto' button (ensure visible/clickable)
    const addBtn = await driver.findElement(By.xpath("//button[contains(.,'Añadir gasto') or contains(.,'Añadir')]") );
    await driver.executeScript('arguments[0].scrollIntoView(true);', addBtn).catch(()=>{});
    await driver.wait(until.elementIsVisible(addBtn), 5000).catch(()=>{});
    // use JS click as a fallback to avoid ElementNotInteractable errors
    await driver.executeScript('arguments[0].click();', addBtn).catch(()=>{});

    // wait for create gasto page
    await driver.wait(until.elementLocated(By.css('input[placeholder="Descripción"]')), 10000);
    const desc = 'E2E Test Gasto ' + Date.now();
    await driver.findElement(By.css('input[placeholder="Descripción"]')).sendKeys(desc);
    // monto input may have different attributes depending on template; try multiple selectors
    const montoInput = await driver.findElement(By.css('input[placeholder="Monto"], input[formcontrolname="monto"], input[name="monto"], input[type="number"]'));
    await driver.wait(until.elementIsVisible(montoInput), 5000).catch(()=>{});
    // set value via JS to avoid interactability issues and ensure Angular picks up change
    await driver.executeScript("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input'));", montoInput, '12.34').catch(()=>{});
    // click Añadir
    const addGastoBtn = await driver.findElement(By.xpath('//button[contains(. , "Añadir") and not(contains(. , "Cancelar"))]'));
    await driver.executeScript('arguments[0].scrollIntoView(true);', addGastoBtn).catch(()=>{});
    await driver.wait(until.elementIsVisible(addGastoBtn), 5000).catch(()=>{});
    await driver.executeScript('arguments[0].click();', addGastoBtn).catch(()=>{});

    // back to group page; wait for gasto label inside a specific mat-list-item
    const gastoXpath = `//mat-list-item[.//div[contains(., "${desc}")]]`;
    await driver.wait(until.elementLocated(By.xpath(gastoXpath)), 12000);
    const gastoEl = await driver.findElement(By.xpath(gastoXpath));
    expect(await gastoEl.getText()).to.contain('E2E Test Gasto');

    // delete the gasto: click delete icon/button inside that specific list item
    let deleteBtn = null;
    try {
      deleteBtn = await gastoEl.findElement(By.xpath('.//button[contains(@title,"Eliminar gasto") or .//mat-icon[text()="delete"] or contains(. , "Eliminar")]'));
    } catch (err) {
      // fallback: first generic delete button in the list
      deleteBtn = await driver.findElement(By.xpath('(//mat-list-item//button[contains(@title,"Eliminar gasto") or contains(. , "Eliminar")])[1]'));
    }
    // confirm the browser dialog
    await driver.executeScript('arguments[0].scrollIntoView(true);', deleteBtn).catch(()=>{});
    await driver.wait(until.elementIsVisible(deleteBtn), 5000).catch(()=>{});
    await driver.executeScript('arguments[0].click();', deleteBtn).catch(()=>{});
    // accept confirm dialog
    try {
      const alert = await driver.switchTo().alert();
      await alert.accept();
    } catch (e) {
      // some browsers may not raise alert; ignore
    }

    // wait until the specific mat-list-item for the gasto is gone
    await driver.wait(async () => {
      const els = await driver.findElements(By.xpath(gastoXpath));
      return els.length === 0;
    }, 5000, 'gasto was not removed in time');
    const elements = await driver.findElements(By.xpath(gastoXpath));
    expect(elements.length).to.equal(0);
  });
});
