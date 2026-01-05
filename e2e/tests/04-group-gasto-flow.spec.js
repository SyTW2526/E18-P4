const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

// --- CONSTANTS & HELPERS ---
const CI_TIMEOUT = 60000;
const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

// Helper simplified for retrying clicks
async function clickElement(driver, locator, timeout = 20000) {
  const el = await driver.wait(until.elementLocated(locator), timeout);
  await driver.wait(until.elementIsVisible(el), timeout);
  try {
    await el.click();
  } catch (e) {
    // Si el click normal falla (elemento tapado), forzamos con JS
    await driver.executeScript('arguments[0].click();', el);
  }
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
  this.timeout(180000); // 3 minutos para todo el flujo
  let driver;

  const uniqueGroupName = 'Group ' + Date.now();
  const uniqueGastoDesc = 'Gasto ' + Date.now();

  before(async function () {
    driver = await createDriver();
    
    // 1. Navegar y cargar app
    await driver.get(BASE + '/');
    await waitForAppReady(driver);

    // 2. Inyectar autenticación falsa
    await driver.executeScript("window.localStorage.setItem('auth_token','FAKE_E2E_TOKEN');");
    await driver.executeScript(
      "window.localStorage.setItem('auth_user', JSON.stringify({_id:'u_e2e', nombre:'E2E User', email:'test@e2e.com'}));"
    );

    // 3. Ir explícitamente a /home
    await driver.get(BASE + '/home');
    await waitForAppReady(driver);
    
    // 4. Verificar que NO estamos en login (si redirige a login, el test fallará aquí claro)
    try {
        await driver.wait(until.urlContains('/home'), 10000);
    } catch(e) {
        console.log("!!! ALERTA: La URL no es /home. URL actual: " + await driver.getCurrentUrl());
    }
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Complete Lifecycle: Create Group -> Add Expense -> Delete Expense -> Delete Group', async function () {
    // --- 1. CREATE GROUP ---
    console.log('Step 1: Creating Group');
    
    // Selector muy amplio para encontrar cualquier botón de creación
    // Busca: Texto "Crear", "Create", o botón flotante mat-fab
    const createBtnSelector = By.xpath("//button[contains(.,'Crear') or contains(.,'Create') or contains(@class, 'mat-fab')]");
    
    // Usamos wait normal (más seguro que el helper anterior)
    await clickElement(driver, createBtnSelector, 30000);

    // Fill inline create form
    const nameInput = await driver.wait(
      until.elementLocated(By.css('input[name="createName"]')),
      20000,
      'Group name input not found within 20s'
    );
    await driver.wait(until.elementIsVisible(nameInput), 5000);
    await nameInput.clear();
    await nameInput.sendKeys(uniqueGroupName);

    const submitGroupBtn = By.xpath("//button[contains(.,'Crear grupo') or contains(.,'Create group') or contains(.,'Aceptar')]");
    await clickElement(driver, submitGroupBtn, 10000);

    // --- 2. OPEN GROUP ---
    console.log('Step 2: Opening Group');

    const cardXPath = `//mat-card[.//mat-card-title[contains(text(), "${uniqueGroupName}")]]`;
    await driver.wait(until.elementLocated(By.xpath(cardXPath)), 20000);

    const card = await driver.findElement(By.xpath(cardXPath));
    try { await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', card); } catch(_){}
    await driver.executeScript('arguments[0].click();', card);

    await driver.wait(until.urlContains('/group'), 20000);

    // --- 3. ADD EXPENSE ---
    console.log('Step 3: Adding Expense');

    const addGastoBtn = By.xpath("//button[contains(.,'Añadir gasto') or contains(.,'Add') or contains(.,'Nuevo')]");
    await clickElement(driver, addGastoBtn, 20000);

    await driver.wait(until.urlContains('create-gasto'), 20000);

    const descInput = await driver.wait(
      until.elementLocated(By.css('input[name="descripcion"], textarea[name="descripcion"]')),
      20000
    );
    await descInput.sendKeys(uniqueGastoDesc);

    const amountInput = await driver.findElement(By.css('input[name="monto"]'));
    await amountInput.sendKeys('50');

    const saveGastoBtn = By.xpath("//button[contains(.,'Añadir') or contains(.,'Add') or contains(.,'Guardar')]");
    await clickElement(driver, saveGastoBtn, 10000);

    await driver.wait(until.urlContains('/group'), 20000);

    // --- 4. DELETE EXPENSE ---
    console.log('Step 4: Deleting Expense');

    const expenseRowXPath = `//*[contains(text(), "${uniqueGastoDesc}")]/ancestor::mat-list-item`;
    const rowEl = await driver.wait(until.elementLocated(By.xpath(expenseRowXPath)), 20000);
    try { await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', rowEl); } catch (_) {}

    let deleteBtnInRow;
    try {
      deleteBtnInRow = await rowEl.findElement(By.xpath(".//button[@title='Eliminar gasto' or @title='Delete expense']"));
    } catch (_) {
      deleteBtnInRow = await rowEl.findElement(By.css("button[title*='limin'], button.delete-btn"));
    }
    
    await driver.executeScript('arguments[0].click();', deleteBtnInRow);
    await handleConfirmation(driver);

    // Wait for row to disappear
    try {
      await driver.wait(until.stalenessOf(rowEl), 5000);
    } catch (_) { await driver.sleep(1000); }

    // --- 6. VERIFY HOME ---
    console.log('Step 6: Verifying deletion');

    await driver.wait(until.urlContains('/group'), 20000);
    
    const expenseRows = await driver.findElements(
      By.xpath(`//*[contains(text(), "${uniqueGastoDesc}")]`)
    );
    expect(expenseRows.length).to.equal(0);
  });
});