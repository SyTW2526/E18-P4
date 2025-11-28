const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const { expect } = require('chai');

async function waitForAppReady(driver, timeout = 15000) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText && document.querySelector("app-root").innerText.trim().length>0);'
    );
  }, timeout);
}

describe('E2E - User Settings', function () {
  this.timeout(60000);
  let driver;
  const BASE = process.env.E2E_BASE_URL || 'http://localhost:4200';

  before(async function () {
    const options = new chrome.Options();
    const args = ['--no-sandbox', '--disable-dev-shm-usage'];
    if (process.env.E2E_HEADLESS !== 'false') args.push('--headless=new');
    options.addArguments(...args);
    if (process.env.CHROME_BIN) options.setChromeBinaryPath(process.env.CHROME_BIN);
    driver = await new Builder().forBrowser('chrome').setChromeOptions(options).build();
    // navigate to the app origin first, then set localStorage on that origin
    await driver.get(BASE + '/');
    await waitForAppReady(driver, 20000);
    await driver.executeScript("window.localStorage.setItem('auth_token','FAKE_TOKEN');");
    await driver.executeScript("window.localStorage.setItem('auth_user', JSON.stringify({_id:'u1', nombre:'Test', email:'t@t.com', preferencia_tema:'claro'}));");
  });

  after(async function () {
    if (driver) await driver.quit();
  });

  it('navigates to settings and toggles theme', async function () {
    await driver.get(BASE + '/settings');
    // wait for mat-select to appear
    await driver.wait(until.elementLocated(By.css('mat-select[formcontrolname="preferencia_tema"], mat-select')), 5000);
    // select dark option by opening the panel and clicking
    const select = await driver.findElement(By.css('mat-select[formcontrolname="preferencia_tema"]'));
    await select.click();
    // wait for options
    await driver.wait(until.elementLocated(By.css('mat-option')), 2000);
    const darkOption = await driver.findElement(By.xpath("//mat-option//span[contains(text(),'Oscuro') or contains(.,'Oscuro')]") ).catch(()=>null);
    if (darkOption) {
      await darkOption.click();
    } else {
      // fallback to clicking second option
      const options = await driver.findElements(By.css('mat-option'));
      if (options.length > 1) await options[1].click();
    }

    // small wait for theme application
    await driver.sleep(300);
    // verify body has dark theme class
    const hasClass = await driver.executeScript('return document.body.classList.contains("app-dark-theme");');
    expect(hasClass).to.be.true;
    // verify localStorage updated
    const stored = await driver.executeScript('return window.localStorage.getItem("theme_preference");');
    expect(stored).to.equal('dark');
  });
});
