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


Notas y entorno

- Tests usan Selenium WebDriver (v4+). Asegúrate de tener instalado Chrome/Chromium o Firefox en la máquina donde ejecutes las pruebas.
- Para seleccionar el navegador usa la variable de entorno `BROWSER`, por ejemplo `BROWSER=chrome` o `BROWSER=firefox`.
- Por defecto las pruebas se ejecutan en modo "headless" (sin interfaz). Para ejecutar las pruebas abriendo el navegador (modo no-headless) establece la variable `E2E_HEADLESS=false`.

Ejemplos (Linux / macOS)

1. Instala dependencias:

```bash
cd e2e
npm ci
```

2. Asegúrate de que la aplicación está corriendo (por ejemplo en `http://localhost:4200`):

```bash
# desde la raíz del proyecto
cd client
npm start
```

3. Ejecuta las pruebas abriendo el navegador (no-headless):

```bash
# desde la carpeta e2e
E2E_HEADLESS=false BROWSER=chrome npm test
```

Notas útiles

- Si usas `CHROME_BIN` para indicar un binario de Chrome/Chromium personalizado, expórtalo antes de ejecutar las pruebas, por ejemplo:

```bash
export CHROME_BIN=/usr/bin/google-chrome
E2E_HEADLESS=false BROWSER=chrome npm test
```

- En Windows PowerShell puedes ejecutar:

```powershell
$env:E2E_HEADLESS="false"; $env:BROWSER="chrome"; npm test
```

- Estas instrucciones están pensadas para ejecución local (tu máquina de desarrollo). En CI normalmente se usa `headless` o se requiere un servidor virtual framebuffer (Xvfb) / contenedor con navegador para ejecutar en modo GUI.

- Para cambiar la URL base de las pruebas usa `E2E_BASE_URL`, por ejemplo:

```bash
E2E_BASE_URL=http://staging.local E2E_HEADLESS=false BROWSER=chrome npm test
```

Si quieres, puedo añadir un script en `package.json` (por ejemplo `test:open`) que envuelva estas variables para simplificar el comando. ¿Te lo agrego?
