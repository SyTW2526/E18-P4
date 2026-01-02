// 1. IMPORTANTE: Aquí añadimos 'logging'
const { Builder, logging } = require('selenium-webdriver'); 
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

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