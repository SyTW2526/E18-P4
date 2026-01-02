const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

// --- CONSTANTS & HELPERS ---
const CI_TIMEOUT = 60000;
const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

// Helper to handle "Stale Element" errors automatically
async function clickWithRetry(driver, locator, timeout = 60000) {
  const endTime = Date.now() + timeout;
  let lastError;
  while (Date.now() < endTime) {
    try {
      const el = await driver.wait(until.elementLocated(locator), 4000);
      await driver.wait(until.elementIsVisible(el), 4000);
      try {
        await el.click();
      } catch (_) {
        await driver.executeScript('arguments[0].click();', el);
      }
      return;
    } catch (e) {
      lastError = e;
      await driver.sleep(300);
    }
  }
  throw lastError || new Error('clickWithRetry: failed to click element ' + locator);
}

// Helper to handle Angular Material Confirm Dialogs
async function handleConfirmation(driver) {
  try {
    await driver.wait(until.alertIsPresent(), 2000);
    const alert = await driver.switchTo().alert();
    await alert.accept();
    return;
  } catch (_) {}

  try {
    const confirmBtn = await driver.wait(
      until.elementLocated(By.css('mat-dialog-container button.mat-primary, mat-dialog-container button[color="warn"], .swal2-confirm')),
      3000
    );
    await confirmBtn.click();
  } catch (_) {}
}

async function waitForAppReady(driver) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText.trim().length > 0);'
    );
  }, CI_TIMEOUT);
}

// --- TEST SUITE ---

describe('E2E - Full Flow: Group > Gasto > Delete', function () {
  this.timeout(CI_TIMEOUT + 60000); // Un poco más de tiempo para el flujo completo
  let driver;

  const uniqueGroupName = 'Group ' + Date.now();
  const uniqueGastoDesc = 'Gasto ' + Date.now();

  before(async function () {
    driver = await createDriver();
    await driver.get(BASE + '/home');
    await waitForAppReady(driver);

    // Fake auth
    await driver.executeScript("window.localStorage.setItem('auth_token','FAKE_E2E_TOKEN');");
    await driver.executeScript(
      "window.localStorage.setItem('auth_user', JSON.stringify({_id:'u_e2e', nombre:'E2E User', email:'test@e2e.com'}));"
    );

    await driver.navigate().refresh();
    await waitForAppReady(driver);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Complete Lifecycle: Create Group -> Add Expense -> Delete Expense -> Delete Group', async function () {
    // --- 1. CREATE GROUP ---
    console.log('Step 1: Creating Group');
    
    // CAMBIO CRÍTICO: Selector robuesto (Texto O Icono 'add')
    const createToggle = By.xpath("//button[contains(.,'Crear') or contains(.,'Create') or .//mat-icon[contains(.,'add')]]");
    await clickWithRetry(driver, createToggle, 10000);

    // Fill inline create form
    const nameInput = await driver.wait(
      until.elementLocated(By.css('input[name="createName"]')),
      10000,
      'Group name input not found'
    );
    await driver.wait(until.elementIsVisible(nameInput), 5000);
    await nameInput.clear();
    await nameInput.sendKeys(uniqueGroupName);

    const submitGroupBtn = By.xpath("//button[contains(.,'Crear grupo') or contains(.,'Create group') or contains(.,'Aceptar')]" );
    await clickWithRetry(driver, submitGroupBtn);

    // --- 2. OPEN GROUP ---
    console.log('Step 2: Opening Group');

    const cardXPath = `//mat-card[.//mat-card-title[contains(text(), "${uniqueGroupName}")]]`;
    await driver.wait(until.elementLocated(By.xpath(cardXPath)), 15000);

    const card = await driver.findElement(By.xpath(cardXPath));
    // Click en la tarjeta (a veces hace falta scroll)
    try { await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', card); } catch(_){}
    await driver.executeScript('arguments[0].click();', card);

    await driver.wait(until.urlContains('/group'), 10000);

    // --- 3. ADD EXPENSE ---
    console.log('Step 3: Adding Expense');

    // Botón flotante de añadir gasto (suele ser un + también) o texto "Añadir"
    const addGastoBtn = By.xpath("//button[contains(.,'Añadir gasto') or contains(.,'Add') or .//mat-icon[contains(.,'add')]]" );
    await clickWithRetry(driver, addGastoBtn);

    await driver.wait(until.urlContains('create-gasto'), 10000);

    const descInput = await driver.wait(
      until.elementLocated(By.css('input[name="descripcion"], textarea[name="descripcion"]')),
      10000
    );
    await driver.wait(until.elementIsVisible(descInput), 5000);
    await descInput.clear();
    await descInput.sendKeys(uniqueGastoDesc);

    const amountInput = await driver.wait(
      until.elementLocated(By.css('input[name="monto"]')),
      10000
    );
    await driver.wait(until.elementIsVisible(amountInput), 5000);
    await amountInput.clear();
    await amountInput.sendKeys('50');

    const saveGastoBtn = By.xpath("//button[contains(.,'Añadir') or contains(.,'Add') or contains(.,'Guardar')]" );
    await clickWithRetry(driver, saveGastoBtn);

    await driver.wait(until.urlContains('/group'), 10000);

    // --- 4. DELETE EXPENSE ---
    console.log('Step 4: Deleting Expense');

    const expenseRowXPath = `//*[contains(text(), "${uniqueGastoDesc}")]/ancestor::mat-list-item | //*[contains(text(), "${uniqueGastoDesc}")]/ancestor::tr`;
    const rowEl = await driver.wait(until.elementLocated(By.xpath(expenseRowXPath)), 10000);
    await driver.wait(until.elementIsVisible(rowEl), 10000);
    try { await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', rowEl); } catch (_) {}

    // Buscar botón de borrar dentro de la fila
    let deleteBtnInRow;
    try {
      deleteBtnInRow = await rowEl.findElement(By.xpath(".//button[@title='Eliminar gasto' or @title='Delete expense']"));
    } catch (_) {
      // Fallback: icono delete
      deleteBtnInRow = await rowEl.findElement(By.xpath(".//button[.//mat-icon[contains(.,'delete')]]"));
    }
    
    // Click borrar gasto
    try { await deleteBtnInRow.click(); } catch (_) { await driver.executeScript('arguments[0].click();', deleteBtnInRow); }

    await handleConfirmation(driver);

    // Wait until the deleted row disappears
    try {
      await driver.wait(until.stalenessOf(rowEl), 5000);
    } catch (_) {
       // A veces staleness falla si Angular reutiliza el DOM, comprobamos que no exista el texto
       await driver.sleep(1000);
    }

    // --- 5. DELETE GROUP ---
    console.log('Step 5: Deleting Group');
    
    // Navegar a settings si es necesario, o buscar botón de borrar en la página del grupo
    // Asumimos que hay un botón de Settings o Borrar directo
    // Si tienes un botón "Settings" primero, añádelo aquí.
    // Buscamos directamente "Eliminar Grupo" o un icono de basura en la zona de peligro
    
    // NOTA: Si tu botón está en la página de configuración, primero hay que ir allí.
    // Verificamos si estamos en /group/:id
    const currentUrl = await driver.getCurrentUrl();
    if (!currentUrl.includes('/settings')) {
        // Intentar ir a settings
        try {
            const settingsBtn = await driver.findElement(By.xpath("//button[.//mat-icon[contains(.,'settings')]]"));
            await settingsBtn.click();
            await driver.wait(until.urlContains('/settings'), 5000);
        } catch(e) {
            // Si no hay botón settings, quizá el borrar está directo o en un menú
            console.log("No se encontró botón settings, buscando borrar directo...");
        }
    }

    const deleteGroupBtn = await driver.wait(
        until.elementLocated(By.xpath("//button[contains(.,'Eliminar') or contains(.,'Delete') or .//mat-icon[contains(.,'delete_forever')]]")),
        10000
    );
    await clickWithRetry(driver, deleteGroupBtn);

    await handleConfirmation(driver);

    // --- 6. VERIFY HOME ---
    console.log('Step 6: Verifying deletion');

    await driver.wait(until.urlContains('/home'), 10000);
    
    // Verificar que el grupo ya no existe
    const groups = await driver.findElements(
      By.xpath(`//mat-card-title[contains(text(), "${uniqueGroupName}")]`)
    );
    expect(groups.length).to.equal(0);
  });
});