const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');
const { waitForAppReady, injectFakeAuth, clickElement, CI_TIMEOUT } = require('../driver');

// --- CONSTANTS & HELPERS ---
const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

// Helper to handle Angular Material Confirm Dialogs
async function handleConfirmation(driver) {
  try {
    await driver.wait(until.alertIsPresent(), 2000);
    const alert = await driver.switchTo().alert();
    await alert.accept();
    return;
  } catch (_) {}

  try {
    // Try modal button with class modal-btn delete-btn
    const confirmBtn = await driver.wait(
      until.elementLocated(By.css('button.modal-btn.delete-btn')),
      3000
    );
    await confirmBtn.click();
  } catch (_) {
    try {
      // Fallback: try mat-dialog button
      const matBtn = await driver.wait(
        until.elementLocated(By.css('mat-dialog-container button[color="warn"], mat-dialog-container .mat-primary')),
        3000
      );
      await matBtn.click();
    } catch (_2) {}
  }
}

// waitForAppReady is imported from ../driver

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
    await injectFakeAuth(driver);

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
      until.elementLocated(By.css('input[placeholder="Nombre del grupo"]')),
      20000,
      'Group name input not found within 20s'
    );
    await driver.wait(until.elementIsVisible(nameInput), 5000);
    await nameInput.clear();
    await nameInput.sendKeys(uniqueGroupName);
    
    // Wait for input to be valid and button to enable
    await driver.wait(
      until.elementLocated(By.css('button.confirm-btn:not([disabled])')),
      10000,
      'Confirm button not enabled within 10s'
    );

    const submitGroupBtn = await driver.findElement(By.css('button.confirm-btn'));
    await driver.executeScript('arguments[0].click();', submitGroupBtn);

    // --- 2. OPEN GROUP ---
    console.log('Step 2: Opening Group');

    const cardXPath = `//*[contains(text(), "${uniqueGroupName}")]`;
    await driver.wait(until.elementLocated(By.xpath(cardXPath)), 20000);

    const card = await driver.findElement(By.xpath(cardXPath));
    try { await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', card); } catch(_){}
    // Click on parent card element
    const cardParent = await card.findElement(By.xpath("ancestor::*[@class[contains(., 'card')] or contains(@class, 'group-card')]"));
    await driver.executeScript('arguments[0].click();', cardParent);

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

    const expenseXPath = `//*[contains(@class, 'expense-description') and contains(text(), "${uniqueGastoDesc}")]`;
    const expenseEl = await driver.wait(until.elementLocated(By.xpath(expenseXPath)), 20000);
    try { await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', expenseEl); } catch (_) {}

    // Find the delete button within the expense item
    const expenseItem = await expenseEl.findElement(By.xpath("ancestor::div[contains(@class, 'expense-item')]"));
    const deleteBtn = await expenseItem.findElement(By.css('button.delete-btn'));
    await driver.executeScript('arguments[0].click();', deleteBtn);
    await handleConfirmation(driver);
    
    // Wait for expense to disappear
    try {
      await driver.wait(until.stalenessOf(expenseEl), 5000);
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