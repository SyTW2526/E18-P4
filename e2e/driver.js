const { Builder } = require('selenium-webdriver');

module.exports = async function createDriver() {
  const browser = (process.env.E2E_BROWSER || 'chrome').toLowerCase();
  if (browser === 'firefox') {
    const firefox = require('selenium-webdriver/firefox');
    const options = new firefox.Options();
    // headless control
    if (process.env.E2E_HEADLESS !== 'false') options.headless();
    // allow specifying a Firefox binary path
    if (process.env.FIREFOX_BIN) options.setBinary(process.env.FIREFOX_BIN);
    // some CI flags may be useful
    try { options.addArguments('--no-sandbox', '--disable-dev-shm-usage'); } catch (e) {}
    return new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
  }

  // default: chrome
  const chrome = require('selenium-webdriver/chrome');
  const options = new chrome.Options();
  const args = ['--no-sandbox', '--disable-dev-shm-usage'];
  if (process.env.E2E_HEADLESS !== 'false') args.push('--headless=new');
  options.addArguments(...args);
  if (process.env.CHROME_BIN) options.setChromeBinaryPath(process.env.CHROME_BIN);
  return new Builder().forBrowser('chrome').setChromeOptions(options).build();
};
