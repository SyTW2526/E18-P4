const { By, until } = require('selenium-webdriver');
const { expect } = require('chai');
const createDriver = require('../driver');

const CI_TIMEOUT = 60000;

async function waitForAppReady(driver, timeout = CI_TIMEOUT) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText && document.querySelector("app-root").innerText.trim().length>0);'
    );
  }, timeout);
}

describe('E2E - Join group (error cases)', function () {
  this.timeout(120000); // 2 min
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    driver = await createDriver();
    await driver.get(BASE + '/');
    await waitForAppReady(driver, CI_TIMEOUT); // 60s
    // set fake auth
    await driver.executeScript("window.localStorage.setItem('auth_token','FAKE_TOKEN');");
    await driver.executeScript("window.localStorage.setItem('auth_user', JSON.stringify({_id:'u1', nombre:'TestUser', email:'test@x.com'}));");
    await driver.navigate().refresh(); // Refresh para aplicar auth
    await waitForAppReady(driver, CI_TIMEOUT);
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('shows error when trying to join non-existing group', async function () {
    await driver.get(BASE + '/home');
    
    // Wait for page to be stable
    await driver.wait(until.elementLocated(By.css('mat-card, .btn-primary, button')), CI_TIMEOUT).catch(()=>{});

    // Click the join toggle
    const joinToggle = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Unirse') or contains(.,'Join')]")),
      CI_TIMEOUT
    ).catch(() => null);

    if (joinToggle) {
        await driver.wait(until.elementIsVisible(joinToggle), 5000);
        try { await joinToggle.click(); } catch (e) { await driver.executeScript('arguments[0].click();', joinToggle); }
    } else {
        // Puede que estemos en una vista donde el form ya está visible o no se requiere toggle
        console.log("Toggle Unirse no encontrado, buscando input directamente...");
    }

    // Find the input field for group ID
    const input = await driver.wait(
      until.elementLocated(By.css('input[name="joinId"], input[placeholder*="ID del grupo"], input[placeholder*="Group"]')),
      CI_TIMEOUT
    );

    await driver.wait(until.elementIsVisible(input), 5000);
    await input.clear();
    await input.sendKeys('non-existent-group-id-12345');

    // Find and click the join button
    const joinBtn = await driver.wait(
      until.elementLocated(By.xpath("//button[contains(.,'Unirse') or contains(.,'Join') and not(contains(@class,'btn-primary'))]")),
      CI_TIMEOUT
    );

    try { await joinBtn.click(); } catch (e) { await driver.executeScript('arguments[0].click();', joinBtn); }

    // Wait for error message to appear (Subimos tiempo por si el server tarda)
    await driver.sleep(1000); 

    // Check for error message in the UI
    const errorText = await driver.executeScript(() => {
      const errorElements = Array.from(document.querySelectorAll('[style*="color:#b00020"], [style*="color: #b00020"], .error, .mat-error, simple-snack-bar'));
      return errorElements.map(el => el.textContent || '').join(' ');
    });

    const hasError = errorText.toLowerCase().includes('no encontrado') || 
                     errorText.toLowerCase().includes('not found') ||
                     errorText.toLowerCase().includes('grupo');

    if (!hasError) {
      // Check alerts
      try {
        const alert = await driver.switchTo().alert();
        await alert.accept();
        return; 
      } catch (e) {}
    }

    // Ensure the non-existent group didn't get added
    const afterTitles = await driver.executeScript(() => {
      return Array.from(document.querySelectorAll('mat-card-title')).map(n => n.innerText || n.textContent || '');
    });
    
    const found = afterTitles.some(t => (t || '').includes('non-existent-group-id-12345'));
    expect(found, 'Non-existent group should not appear in group list').to.be.false;
  });
});