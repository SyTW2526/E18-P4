const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

// --- CONSTANTS & HELPERS ---
const CI_TIMEOUT = 60000;
const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

// Helper to handle "Stale Element" errors automatically
async function clickWithRetry(driver, locator, timeout = 7000) {
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
  throw lastError || new Error('clickWithRetry: failed to click element');
}

// Helper to handle Angular Material Confirm Dialogs (or Native alerts as fallback)
async function handleConfirmation(driver) {
  // Prefer browser alert/confirm if present
  try {
    await driver.wait(until.alertIsPresent(), 5000);
    const alert = await driver.switchTo().alert();
    await alert.accept();
    return;
  } catch (_) {}

  // Fallback to Material dialog or SweetAlert
  try {
    const confirmBtn = await driver.wait(
      until.elementLocated(By.css('mat-dialog-container button.mat-primary, mat-dialog-container button[color="warn"], .swal2-confirm')),
      5000
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
  this.timeout(CI_TIMEOUT + 30000);
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
    // Toggle create form
    const createToggle = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Crear')]")),
      10000,
      'Create toggle button not found'
    );
    await driver.wait(until.elementIsVisible(createToggle), 10000);
    await createToggle.click();

    // Fill inline create form
    const nameInput = await driver.wait(
      until.elementLocated(By.css('input[name="createName"]')),
      10000,
      'Group name input not found'
    );
    await driver.wait(until.elementIsVisible(nameInput), 5000);
    await nameInput.clear();
    await nameInput.sendKeys(uniqueGroupName);

    const submitGroupBtn = By.xpath("//button[contains(.,'Crear grupo') or contains(.,'Create group')]" );
    await clickWithRetry(driver, submitGroupBtn);

    // --- 2. OPEN GROUP ---
    console.log('Step 2: Opening Group');

    const cardXPath = `//mat-card[.//mat-card-title[contains(text(), "${uniqueGroupName}")]]`;
    await driver.wait(until.elementLocated(By.xpath(cardXPath)), 10000);

    const card = await driver.findElement(By.xpath(cardXPath));
    await driver.executeScript('arguments[0].click();', card);

    await driver.wait(until.urlContains('/group'), 10000);

    // --- 3. ADD EXPENSE ---
    console.log('Step 3: Adding Expense');

    const addGastoBtn = By.xpath("//button[contains(.,'Añadir gasto') or contains(.,'Add')]" );
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

    const saveGastoBtn = By.xpath("//button[contains(.,'Añadir') or contains(.,'Add')]" );
    await clickWithRetry(driver, saveGastoBtn);

    await driver.wait(until.urlContains('/group'), 10000);

    // --- 4. DELETE EXPENSE ---
    console.log('Step 4: Deleting Expense');

    const expenseRowXPath = `//*[contains(text(), "${uniqueGastoDesc}")]/ancestor::mat-list-item`;
    const rowEl = await driver.wait(until.elementLocated(By.xpath(expenseRowXPath)), 10000);
    await driver.wait(until.elementIsVisible(rowEl), 10000);
    try { await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', rowEl); } catch (_) {}

    // Prefer the button by its title attribute (translated as 'Eliminar gasto')
    let deleteBtnInRow;
    try {
      deleteBtnInRow = await rowEl.findElement(By.xpath(".//button[@title='Eliminar gasto' or @title='Delete expense']"));
    } catch (_) {
      deleteBtnInRow = await rowEl.findElement(By.xpath(".//button[.//mat-icon[normalize-space(text())='delete']]"));
    }
    try {
      await deleteBtnInRow.click();
    } catch (_) {
      await driver.executeScript('arguments[0].click();', deleteBtnInRow);
    }

    await handleConfirmation(driver);

    // Wait until the deleted row disappears
    try {
      await driver.wait(until.stalenessOf(rowEl), 10000);
    } catch (_) {
      await driver.wait(async () => {
        const els = await driver.findElements(By.xpath(`//mat-list-item[.//*[contains(text(), "${uniqueGastoDesc}")]]`));
        return els.length === 0;
      }, 10000);
    }

    // --- 5. DELETE GROUP ---
    console.log('Step 5: Deleting Group');

    const deleteGroupBtn = By.xpath("//button[contains(.,'Eliminar') or contains(.,'Delete')]" );
    await clickWithRetry(driver, deleteGroupBtn);

    await handleConfirmation(driver);

    // --- 6. VERIFY HOME ---
    console.log('Step 6: Verifying deletion');

    await driver.wait(until.urlContains('/home'), 10000);

    const groups = await driver.findElements(
      By.xpath(`//mat-card-title[contains(text(), "${uniqueGroupName}")]`)
    );

    expect(groups.length).to.equal(0);
  });
});
