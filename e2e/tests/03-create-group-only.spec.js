const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

// --- CONSTANTS & HELPERS ---
const CI_TIMEOUT = 60000;
const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

// Helper to handle "Stale Element" errors automatically
async function clickWithRetry(driver, locator, timeout = 5000) {
  const endTime = Date.now() + timeout;
  while (Date.now() < endTime) {
    try {
      const el = await driver.wait(until.elementLocated(locator), 2000);
      await driver.wait(until.elementIsVisible(el), 2000);
      await el.click();
      return;
    } catch (e) {
      if (Date.now() >= endTime) throw e;
      await driver.sleep(300);
    }
  }
}

async function waitForAppReady(driver) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText.trim().length > 0);'
    );
  }, CI_TIMEOUT);
}

// --- TEST SUITE ---

describe('E2E - Create Group Only', function () {
  this.timeout(CI_TIMEOUT + 30000);
  let driver;

  const uniqueGroupName = 'TestGroup ' + Date.now();

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

  it('Should create a group successfully', async function () {
    console.log('Step 1: Creating Group');

    // Click the "Crear" button to show the create form
    const createBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Crear')]")),
      10000,
      'Create button not found'
    );

    await driver.wait(until.elementIsVisible(createBtn), 10000);
    await createBtn.click();

    // Wait for the form to be visible
    await driver.wait(
      until.elementLocated(By.css('input[name="createName"]')),
      5000,
      'Create group form did not appear'
    );

    // Fill in the group name
    const nameInput = await driver.findElement(By.css('input[name="createName"]'));
    await driver.wait(until.elementIsVisible(nameInput), 5000);
    await nameInput.clear();
    await nameInput.sendKeys(uniqueGroupName);

    // Click the "Crear grupo" button
    const submitGroupBtn = By.xpath("//button[contains(.,'Crear grupo') or contains(.,'Create group')]");
    await clickWithRetry(driver, submitGroupBtn);

    // Wait for the group to appear in the list
    console.log('Step 2: Verifying Group Created');

    const cardXPath = `//mat-card[.//mat-card-title[contains(text(), "${uniqueGroupName}")]]`;
    await driver.wait(until.elementLocated(By.xpath(cardXPath)), 10000, 'Group card not found after creation');

    // Verify the group exists and is visible
    const groupCard = await driver.findElement(By.xpath(cardXPath));
    const isDisplayed = await groupCard.isDisplayed();
    expect(isDisplayed).to.be.true;

    console.log('Step 3: Group created successfully!');
  });
});
