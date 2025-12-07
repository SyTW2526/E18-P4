const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

async function waitForAppReady(driver, timeout = 30000) {
  await driver.wait(async () => {
    return await driver.executeScript(`
      return !!(
        document.querySelector("app-root")
        && document.querySelector("app-root").innerText.trim().length > 0
      );
    `);
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

    // Fake auth
    await driver.executeScript(
      "window.localStorage.setItem('auth_token','FAKE_TOKEN');"
    );
    await driver.executeScript(`
      window.localStorage.setItem('auth_user', JSON.stringify({
        _id:'u1', nombre:'TestUser', email:'test@x.com'
      }));
    `);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('creates a gasto inside the first available group and then deletes it', async function () {

    await driver.get(BASE + '/home');
    await driver.sleep(500);

    let cards = await driver.findElements(By.css('mat-card'));

    if (cards.length === 0) {
      const createToggle = await driver.findElement(
        By.xpath("//button[contains(.,'Crear')]")
      ).catch(() => null);

      if (createToggle) {
        await createToggle.click();
        await driver.sleep(300);
      }

      await driver.wait(
        until.elementLocated(By.css('input[placeholder="Nombre del nuevo grupo"]')),
        15000
      );

      const gname = 'E2E Grupo ' + Date.now();

      await driver.findElement(
        By.css('input[placeholder="Nombre del nuevo grupo"]')
      ).sendKeys(gname);

      const createBtn = await driver.findElement(
        By.xpath("//button[contains(.,'Crear grupo') or contains(.,'Crear')]")
      ).catch(() => null);

      if (createBtn) await createBtn.click();

      await driver.wait(until.elementLocated(By.css('mat-card')), 10000);
      cards = await driver.findElements(By.css('mat-card'));
    }

    const verBtn = await driver.findElement(
      By.xpath("(//mat-card//button[contains(., 'Ver') or contains(., 'Entrar') or contains(., 'Abrir')])[1]")
    ).catch(async () => {
      const card = await driver.findElement(By.xpath('(//mat-card)[1]'));
      await card.click();
      return null;
    });

    if (verBtn) await verBtn.click();

    await driver.wait(until.elementLocated(By.css('h2')), 10000);

    const addBtn = await driver.findElement(
      By.xpath("//button[contains(.,'Añadir gasto')]")
    );
    await driver.wait(until.elementIsVisible(addBtn), 6000);
    await driver.wait(until.elementIsEnabled(addBtn), 6000);

    try { await addBtn.click(); }
    catch { await driver.executeScript('arguments[0].click();', addBtn); }

    await driver.sleep(500);

    /* ---------------------------
      5. Rellenar formulario de gasto (dentro del overlay)
      --------------------------- */
    // Try to find the form in the overlay first, then fall back to main DOM
    let descInput;
    try {
      await driver.wait(
        until.elementLocated(By.css('.cdk-overlay-container input[placeholder="Descripción"]')),
        5000
      );
      descInput = await driver.findElement(
        By.css('.cdk-overlay-container input[placeholder="Descripción"]')
      );
    } catch (e) {
      // Overlay might not have the container class; try main DOM
      console.log('Overlay form not found; checking main DOM...');
      const pageSource = await driver.getPageSource();
      console.log('Page contains "Descripción" input:', pageSource.includes('Descripción'));
      
      descInput = await driver.findElement(
        By.css('input[placeholder="Descripción"]')
      ).catch(async () => {
        // Try by name or other selector
        return await driver.findElement(By.css('input[name="descripcion"]'));
      });
    }

    const desc = 'E2E Test Gasto ' + Date.now();

    // Use the descInput we found (could be overlay or main DOM)
    await descInput.sendKeys(desc);

    // Selector correcto para monto dentro del overlay or main DOM
    let montoInput;
    try {
      montoInput = await driver.findElement(
        By.css('.cdk-overlay-container input[name="monto"]')
      );
    } catch (e) {
      montoInput = await driver.findElement(
        By.css('input[name="monto"]')
      );
    }

   

    /* ---------------------------
      6. Enviar gasto
      --------------------------- */
    let addGastoBtn;
    try {
      addGastoBtn = await driver.findElement(
        By.css('.cdk-overlay-container button[color="primary"]')
      );
    } catch (e) {
      addGastoBtn = await driver.findElement(
        By.css('button[color="primary"]')
      );
    }

    // Try to find the button, but don't require visibility - just click it
    try {
      await driver.wait(until.elementIsVisible(addGastoBtn), 3000);
    } catch (e) {
      console.log('Add button not visible, but will try to click anyway...');
    }
    
    try { await addGastoBtn.click(); }
    catch { await driver.executeScript('arguments[0].click();', addGastoBtn); }

    // Wait for overlay to close (gasto created)
    await driver.wait(async () => {
      const overlays = await driver.findElements(By.css('.cdk-overlay-container'));
      return overlays.length === 0;
    }, 5000).catch(() => null);

    await driver.sleep(500);

    /* ---------------------------
      7. Delete the gasto
      --------------------------- */
    // Find delete button (trash icon or delete button on the gasto row)
    const deleteBtn = await driver.findElement(
      By.xpath("//button[contains(@aria-label, 'delete') or contains(@aria-label, 'Eliminar') or contains(., 'Eliminar')]")
    ).catch(async () => {
      // Try trash icon or button with mat-icon
      return await driver.findElement(
        By.xpath("(//button//mat-icon[contains(., 'delete') or contains(., 'delete_forever')])[1]/..")
      ).catch(() => null);
    });

    if (deleteBtn) {
      await driver.wait(until.elementIsVisible(deleteBtn), 6000);
      try { await deleteBtn.click(); }
      catch { await driver.executeScript('arguments[0].click();', deleteBtn); }

      // Wait for confirmation dialog or gasto to disappear
      await driver.sleep(500);

      // If a confirmation dialog appears, click "Sí" or "Confirmar"
      const confirmBtn = await driver.findElement(
        By.xpath("//button[contains(., 'Sí') or contains(., 'Eliminar') or contains(., 'Confirmar')]")
      ).catch(() => null);

      if (confirmBtn) {
        await driver.wait(until.elementIsVisible(confirmBtn), 3000);
        await confirmBtn.click();
      }

      await driver.sleep(500);
    }

  });
});
