# E2E tests (Selenium)

This folder contains end-to-end tests using Selenium WebDriver with Mocha and Chai.

Quick start

1. From the `e2e` folder, install dev dependencies:

```bash
cd e2e
npm ci
```

2. Ensure the app under test is running. By default the tests use:

```text
http://localhost:4200
```

You can override this by setting `E2E_BASE_URL` environment variable.

3. Run tests:

```bash
npm test
```

Notes and environment

- Tests use Selenium WebDriver (v4+) which includes Selenium Manager to locate browser drivers. Ensure you have a modern Chrome/Chromium or Firefox installed on the runner.
- If you want to use a specific browser, set the `BROWSER` environment variable to `chrome` or `firefox`.
- On CI, make sure the runner has the browser installed or use a container that includes it.
