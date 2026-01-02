const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const firefox = require('selenium-webdriver/firefox');

module.exports = async function createDriver() {
  const browser = (process.env.E2E_BROWSER || 'chrome').toLowerCase();

  // --- FIREFOX CONFIG ---
  if (browser === 'firefox') {
    const options = new firefox.Options();
    
    // Only run headless if explicitly set to 'true' (Better for local dev)
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
  
  // Critical flags for CI/Docker stability
  // --no-sandbox: Required for Docker (GitHub Actions)
  // --disable-dev-shm-usage: Prevents memory crashes in containers
  const args = ['--no-sandbox', 
    '--disable-dev-shm-usage', 
    '--disable-gpu', 
    '--disable-extensions',
  ];

  // Headless logic:
  // In CI, we set E2E_HEADLESS='true', so this runs headless.
  // Locally, if variable is missing, it skips this and opens the window.
  if (process.env.E2E_HEADLESS === 'true') {
    args.push('--headless=new'); // Modern Chrome headless mode
    args.push('--window-size=1920,1080'); // Good practice for headless rendering
  }

  options.addArguments(...args);

  // If you ever need to point to a specific binary (optional)
  if (process.env.CHROME_BIN) {
    options.setChromeBinaryPath(process.env.CHROME_BIN);
  }

  return new Builder()
    .forBrowser('chrome')
    .setChromeOptions(options)
    .build();
};