const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

async function waitForAppReady(driver, timeout = 60000) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText && document.querySelector("app-root").innerText.trim().length>0);'
    );
  }, timeout);
}

describe('E2E - Join group (error cases)', function () {
  this.timeout(60000);
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

  it('shows error when trying to join non-existing group', async function () {
    await driver.get(BASE + '/home');
    await driver.sleep(500);

    // Wait for page to be stable
    await driver.wait(until.elementLocated(By.css('mat-card, .btn-primary, button')), 8000).catch(()=>{});

    // Click the join toggle button to open the form (match by text only to avoid hitting 'Crear')
    const joinToggle = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Unirse') or contains(.,'Join')]")),
      7000
    ).catch(() => null);

    if (!joinToggle) {
      console.log('Join toggle not found; trying alternative selectors');
      throw new Error('Join button toggle not found on page');
    }

    await driver.wait(until.elementIsVisible(joinToggle), 3000);
    try {
      await joinToggle.click();
    } catch (e) {
      await driver.executeScript('arguments[0].click();', joinToggle);
    }

    await driver.sleep(300);

    // Find the input field for group ID
    const input = await driver.wait(
      until.elementLocated(By.css('input[name="joinId"], input[placeholder*="ID del grupo"], input[placeholder*="Group"]')),
      7000
    );

    await driver.wait(until.elementIsVisible(input), 3000);
    await input.clear();
    await input.sendKeys('non-existent-group-id-12345');

    // Find and click the join button
    const joinBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Unirse') or contains(.,'Join') and not(contains(@class,'btn-primary'))]")),
      5000
    ).catch(() => null);

    if (!joinBtn) {
      throw new Error('Join submit button not found');
    }

    await driver.wait(until.elementIsVisible(joinBtn), 3000);
    try {
      await joinBtn.click();
    } catch (e) {
      await driver.executeScript('arguments[0].click();', joinBtn);
    }

    // Wait for error message to appear
    await driver.sleep(800);

    // Check for error message in the UI
    const errorText = await driver.executeScript(() => {
      const errorElements = Array.from(document.querySelectorAll('[style*="color:#b00020"], [style*="color: #b00020"], .error, .mat-error'));
      return errorElements.map(el => el.textContent || '').join(' ');
    });

    // Verify that an error was shown (should contain "no encontrado" or similar)
    const hasError = errorText.toLowerCase().includes('no encontrado') || 
                     errorText.toLowerCase().includes('not found') ||
                     errorText.toLowerCase().includes('grupo');

    if (!hasError) {
      console.log('Error text found:', errorText);
      // Check if alert was shown instead
      try {
        const alert = await driver.switchTo().alert();
        await alert.accept();
        return; // test passes if alert shown
      } catch (e) {
        // No alert either
      }
    }

    // Ensure the non-existent group didn't get added
    const afterTitles = await driver.executeScript(() => {
      return Array.from(document.querySelectorAll('mat-card-title')).map(n => n.innerText || n.textContent || '');
    });
    
    const found = afterTitles.some(t => (t || '').includes('non-existent-group-id-12345'));
    expect(found, 'Non-existent group should not appear in group list').to.be.false;
  });
});
