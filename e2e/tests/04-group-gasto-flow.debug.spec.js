const { By, until, logging } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');
const { waitForAppReady, injectFakeAuth, clickElement } = require('../driver');
const fs = require('fs');
const path = require('path');

const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

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

describe('E2E DEBUG - Full Flow: Group > Gasto > Delete', function () {
  this.timeout(180000);
  let driver;
  let step = 'init';
  const runId = Date.now();
  const artifactsDir = path.join(__dirname, '..', 'artifacts', `04-group-gasto-flow-${runId}`);

  async function saveArtifacts(label = step) {
    try {
      if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
      const safe = (s) => String(s || '').replace(/[^a-z0-9-_\.]/gi, '_').slice(0, 80);
      const now = new Date().toISOString().replace(/[:.]/g, '-');
      const base = `${now}__${safe(label)}`;

      try {
        const url = await driver.getCurrentUrl();
        const title = await driver.getTitle();
        fs.writeFileSync(path.join(artifactsDir, `${base}__url-title.txt`), `URL: ${url}\nTITLE: ${title}\nSTEP: ${label}`);
      } catch (_) {}

      try {
        const png = await driver.takeScreenshot();
        fs.writeFileSync(path.join(artifactsDir, `${base}.png`), png, 'base64');
      } catch (_) {}

      try {
        const html = await driver.getPageSource();
        fs.writeFileSync(path.join(artifactsDir, `${base}.html`), html);
      } catch (_) {}

      try {
        const logs = await driver.manage().logs().get(logging.Type.BROWSER);
        const formatted = logs.map(l => `[${l.level.name}] ${new Date(l.timestamp).toISOString()} ${l.message}`).join('\n');
        fs.writeFileSync(path.join(artifactsDir, `${base}__browser.log`), formatted);
      } catch (_) {}
    } catch (e) {
      console.warn('Artifact save failed:', e && e.message);
    }
  }

  async function withStep(label, fn) {
    step = label;
    console.log(`\n==== STEP: ${label} ====\n`);
    try {
      return await fn();
    } catch (err) {
      await saveArtifacts(label);
      err.message = `[STEP: ${label}] ${err.message}`;
      throw err;
    }
  }

  const uniqueGroupName = 'Group ' + Date.now();
  const uniqueGastoDesc = 'Gasto ' + Date.now();

  before(async function () {
    if (!fs.existsSync(artifactsDir)) fs.mkdirSync(artifactsDir, { recursive: true });
    driver = await createDriver();

    await withStep('Navigate to / and wait app ready', async () => {
      await driver.get(BASE + '/');
      await waitForAppReady(driver);
    });

    await withStep('Inject fake auth', async () => {
      await injectFakeAuth(driver);
    });

    await withStep('Navigate to /home and verify', async () => {
      await driver.get(BASE + '/home');
      await waitForAppReady(driver);
      await driver.wait(until.urlContains('/home'), 10000);
    });
  });

  afterEach(async function () {
    if (this.currentTest && this.currentTest.state === 'failed') {
      await saveArtifacts(`FAILED-${step}`);
    }
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('Complete Lifecycle: Create Group -> Add Expense -> Delete Expense -> Verify', async function () {
    await withStep('Create Group: open creation UI', async () => {
      const createBtnSelector = By.xpath("//button[contains(.,'Crear') or contains(.,'Create') or contains(@class, 'mat-fab')]");
      await clickElement(driver, createBtnSelector, 30000);
    });

    await withStep('Create Group: fill and submit', async () => {
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
    });

    await withStep('Open Group card', async () => {
      const cardXPath = `//*[contains(text(), "${uniqueGroupName}")]`;
      await driver.wait(until.elementLocated(By.xpath(cardXPath)), 20000);
      const card = await driver.findElement(By.xpath(cardXPath));
      try { await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', card); } catch(_){}
      // Click on parent card element
      const cardParent = await card.findElement(By.xpath("ancestor::*[@class[contains(., 'card')] or contains(@class, 'group-card')]"));
      await driver.executeScript('arguments[0].click();', cardParent);
      await driver.wait(until.urlContains('/group'), 20000);
    });

    await withStep('Add Expense: open form', async () => {
      const addGastoBtn = By.xpath("//button[contains(.,'Añadir gasto') or contains(.,'Add') or contains(.,'Nuevo')]");
      await clickElement(driver, addGastoBtn, 20000);
      await driver.wait(until.urlContains('create-gasto'), 20000);
    });

    await withStep('Add Expense: fill and save', async () => {
      const descInput = await driver.wait(
        until.elementLocated(By.css('input[name="descripcion"], textarea[name="descripcion"]')),
        20000
      );
      await descInput.sendKeys(uniqueGastoDesc);

      const amountInput = await driver.findElement(By.css('input[name="monto"]'));
      await amountInput.sendKeys('50');

      const saveGastoBtn = By.xpath("//button[contains(.,'Añadir') or contains(.,'Add') or contains(.,'Guardar')]");
      await clickElement(driver, saveGastoBtn, 15000);
      await driver.wait(until.urlContains('/group'), 20000);
    });

    await withStep('Delete Expense: find and delete', async () => {
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
    });

    await withStep('Verify: expense is gone', async () => {
      await driver.wait(until.urlContains('/group'), 20000);
      const expenseRows = await driver.findElements(
        By.xpath(`//*[contains(text(), "${uniqueGastoDesc}")]`)
      );
      expect(expenseRows.length).to.equal(0);
    });
  });
});
