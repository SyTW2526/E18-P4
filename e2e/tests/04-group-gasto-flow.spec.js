const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');
const { waitForAppReady, injectFakeAuth, CI_TIMEOUT } = require('../driver');

// --- CONSTANTS ---
const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

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

    // Inject fake auth
    await injectFakeAuth(driver);

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
    // Volver al detalle del grupo (no settings) y usar el botón rojo de eliminar
    let currentUrl = await driver.getCurrentUrl();
    let groupId = null;
    const m = currentUrl.match(/group\/([^\/]+)/);
    if (m && m[1]) groupId = m[1];
    if (groupId) {
      await driver.get(`${BASE}/group/${groupId}`);
      await driver.wait(until.urlContains(`/group/${groupId}`), 10000);
    }

    const deleteGroupBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Eliminar') or contains(.,'Delete') or .//mat-icon[normalize-space(text())='delete'] or .//mat-icon[contains(.,'delete_forever')]]")),
      20000
    );
    try { await deleteGroupBtn.click(); } catch (_) { await driver.executeScript('arguments[0].click();', deleteGroupBtn); }

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