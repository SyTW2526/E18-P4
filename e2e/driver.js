// 1. IMPORTANTE: Aquí añadimos 'logging'
const { Builder, logging } = require('selenium-webdriver'); 
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

const CI_TIMEOUT = 60000;

// Helper para inyectar autenticación falsa
async function injectFakeAuth(driver, userId = 'u_e2e', userName = 'E2E User', userEmail = 'test@e2e.com') {
  await driver.executeScript("window.localStorage.setItem('auth_token','FAKE_E2E_TOKEN');");
  await driver.executeScript(
    `window.localStorage.setItem('auth_user', JSON.stringify({_id:'${userId}', nombre:'${userName}', email:'${userEmail}'}));`
  );
}

// Helper para esperar a que Angular esté listo
async function waitForAppReady(driver, timeout = CI_TIMEOUT) {
  await driver.wait(async () => {
    return await driver.executeScript(
      'return !!(document.querySelector("app-root") && document.querySelector("app-root").innerText && document.querySelector("app-root").innerText.trim().length>0);'
    );
  }, timeout);
}

// Helper para click robusto
async function clickElement(driver, locator, timeout = 20000) {
  const el = await driver.wait(async () => {
    try {
      const elem = await driver.findElement(locator);
      if (await elem.isDisplayed()) return elem;
    } catch (_) {}
    return null;
  }, timeout, `Element not found or not visible: ${locator}`);
  
  try {
    await driver.executeScript('arguments[0].scrollIntoView({block:"center"});', el);
    await el.click();
  } catch (e) {
    await driver.executeScript('arguments[0].click();', el);
  }
}

module.exports = async function createDriver() {
  const browser = (process.env.E2E_BROWSER || 'chrome').toLowerCase();

  // --- FIREFOX CONFIG ---
  if (browser === 'firefox') {
    const options = new firefox.Options();
    if (process.env.E2E_HEADLESS === 'true') {
      options.addArguments('-headless');
    }
    if (process.env.FIREFOX_BIN) {
      options.setBinary(process.env.FIREFOX_BIN);
    }
    return new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(options)
      .build();
  }

  // --- CHROME CONFIG (Default) ---
  const options = new chrome.Options();
  
  // Flags críticos para estabilidad en CI
  const args = [
    '--no-sandbox', 
    '--disable-dev-shm-usage',
    '--disable-gpu',        
    '--disable-extensions' 
  ];

  // Headless logic
  if (process.env.E2E_HEADLESS === 'true') {
    args.push('--headless=new');
    args.push('--window-size=1920,1080'); 
  }

  options.addArguments(...args);

  // --- LOGGING CONFIG (Para ver errores de consola en CI) ---
  const logPrefs = new logging.Preferences();
  logPrefs.setLevel(logging.Type.BROWSER, logging.Level.ALL);
  options.setLoggingPrefs(logPrefs);
  // ---------------------------------------------------------

  // Binary path manual (opcional)
  if (process.env.CHROME_BIN) {
    options.setChromeBinaryPath(process.env.CHROME_BIN);
  }

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
};

// Exportar helpers
module.exports.injectFakeAuth = injectFakeAuth;
module.exports.waitForAppReady = waitForAppReady;
module.exports.clickElement = clickElement;
module.exports.CI_TIMEOUT = CI_TIMEOUT;