# Proyecto E18-P4

## Levantar MongoDB y el servidor

Este proyecto puede correr con servicios locales (instalando MongoDB) o, preferiblemente, con Docker Compose. Abajo tienes instrucciones para ambas opciones: levantar MongoDB, configurar el servidor y comprobar que todo funciona.

---

### 1) Levantar MongoDB (Docker, recomendado)

Si tienes Docker instalado, lo más sencillo es levantar Mongo con un contenedor:

```bash
docker run -d \
	--name mongo-e18p4 \
	-p 27017:27017 \
	-v "$HOME/mongo-data-e18p4:/data/db" \
	mongo:6.0
```

Comprobaciones y utilidades:

```bash
# Ver contenedor en ejecución
docker ps --filter name=mongo-e18p4

# Ver logs
docker logs -f mongo-e18p4

# Abrir shell de mongo
docker exec -it mongo-e18p4 mongosh

# Ping rápido (no interactivo)
docker exec mongo-e18p4 mongosh --quiet --eval 'db.runCommand({ ping: 1 })'

# Parar y eliminar
docker stop mongo-e18p4 && docker rm mongo-e18p4
```

Notas:
- El volumen `~/mongo-data-e18p4` preserva la base de datos entre reinicios.
- Si necesitas autenticación, crea usuarios o usa las opciones de arranque de Mongo para inicializar credenciales.

---

### 2) Levantar la aplicación (Servidor)

El repo incluye un `docker-compose.yml` que arranca tanto Mongo como el servidor Node. Esta es la forma recomendada para reproducibilidad.

Opción A — Usar Docker Compose (recomendado):

1. (Opcional) Si hay contenedores anteriores con puertos en conflicto, para/elimínalos:

```bash
docker stop mongo-e18p4 e18-p4-server || true
docker rm mongo-e18p4 e18-p4-server || true
```

2. Revisa/crea `server/.env` con al menos `ATLAS_URI` (y opcional `JWT_SECRET`). Ejemplo mínimo:

```ini
ATLAS_URI="mongodb://root:example@mongo:27017/meanStackExample?authSource=admin"
JWT_SECRET="cambia-por-una-frase-secreta-y-larga"
# PORT opcional, por defecto el servidor escucha 5200 en docker-compose
# PORT=5200
```

3. Desde la raíz del repo (donde está `docker-compose.yml`), construir y levantar:

```bash
docker-compose up -d --build
```

4. Comprobar estado y logs:

```bash
docker-compose ps
docker-compose logs -f server
```

5. Probar un endpoint desde el host (ejemplo):

```bash
curl http://localhost:5200/users
```

Opción B — Ejecutar el servidor localmente (sin Docker)

1. Entra en la carpeta `server`:

```bash
cd server
```

2. Instala dependencias y crea un `.env` (igual al anterior). Luego hay dos formas de arrancarlo:

# Desarrollo (usa ts-node, más rápido para cambios):
```bash
npm install
npm run start
```

# Producción local (compila TypeScript y ejecuta JS):
```bash
npm install
npm run build
node dist/server.js
```

Notas sobre `ATLAS_URI` y `server/.env`:
- El archivo `server/.env` es cargado por `dotenv` en `server/src/server.ts`. Si `ATLAS_URI` no está definido, el servidor se cerrará con error. Usa la URI correcta según si te conectas a un Mongo local o al servicio Docker.
- Si ejecutas con Docker Compose, la URI recomendada es `mongodb://root:example@mongo:27017/meanStackExample?authSource=admin` (el usuario/contraseña los define el servicio `mongo` en `docker-compose.yml`).

---

### 3) Comprobaciones rápidas y troubleshooting

- Puerto 27017 en uso: si ya hay otro Mongo en ese puerto, deténlo o cambia el mapeo de puertos en `docker-compose.yml`.
- Si el servidor no arranca, revisa `docker-compose logs server` para ver errores (fallos al instalar deps, errores de compilación o problemas de conexión a la DB).
- Asegúrate de que `ATLAS_URI` apunta al host/servicio correcto (`mongo` en Docker Compose, `localhost` o `127.0.0.1` si corres Mongo localmente).
- Para eliminar todo (contenedores y network creada por compose):

```bash
docker-compose down
```

---

## Tests

Se han añadido suites de tests tanto para el `server` (Jest) como para el `client` (Karma/Jasmine).

- Backend (server):

	- Dependencias: desde la carpeta `server/` instala devDependencies si no están presentes:

		```bash
		cd server
		npm install
		```

	- Ejecutar tests unitarios (Jest):

		```bash
		# ejecuta las pruebas con el servidor de tests en memoria
		cd server
		npm test
		```

		- Nota sobre `mongodb-memory-server`: las máquinas modernas pueden carecer de algunas librerías nativas (por ejemplo `libcrypto.so.1.1`) que impiden arrancar el binario de Mongo que `mongodb-memory-server` descarga. Si ves errores tipo "Instance failed to start because a library is missing" puedes:
			- Proveer una instancia Mongo externa y ejecutar las pruebas contra ella exportando `MONGO_TEST_URI`:

				```bash
				# ejemplo (ajusta credenciales/host según tu entorno)
				MONGO_TEST_URI="mongodb://root:example@10.6.130.212:27017/meanStackExample?authSource=admin" npm test
				```

			- O instalar la librería faltante en el host (ej. `libssl1.1` / `libcrypto.so.1.1`) para permitir que `mongodb-memory-server` arranque su binario.

	- Notas adicionales:
		- Las pruebas cierran correctamente la conexión Mongo exportando una función `closeDatabase()` desde `server/src/database.ts`, por lo que Jest no debería quedarse colgado por handles abiertos.

- Frontend (client):

	- Karma necesita un navegador para ejecutar los specs. En este proyecto usamos `puppeteer` para obtener una copia de Chromium y ejecutarlo en CI/local sin requerir Chrome preinstalado.

	- Pasos para ejecutar tests del cliente:

		```bash
		cd client
		npm install
		# instalar puppeteer (si no está en devDependencies)
		npm install --save-dev puppeteer

		# obtener la ruta de Chromium que descargó puppeteer
		chromePath=$(node -e "console.log(require('puppeteer').executablePath())")

		# establecer CHROME_BIN y ejecutar Karma (no interactivo)
		CHROME_BIN="$chromePath" npm test -- --watch=false
		```

	- Dependencias del sistema (Linux): Chromium puede requerir bibliotecas del sistema. Si el ejecutable de puppeteer falla con errores tipo "error while loading shared libraries: libnspr4.so", instala los paquetes del sistema indicados abajo (ejemplo para Ubuntu/Debian):

		```bash
		sudo apt update
		sudo apt install -y libnspr4 libnss3 libxss1 libasound2 libatk1.0-0 libatk-bridge2.0-0 libcups2 libx11-xcb1 libxcomposite1 libxrandr2 libgbm1 libpangocairo-1.0-0 libgtk-3-0 fonts-liberation libxdamage1 libxfixes3 libxcb1
		```

	- Durante el desarrollo de las pruebas se añadieron helpers y mocks para `ActivatedRoute`, `RouterTestingModule`, `HttpClientTestingModule` y `NoopAnimationsModule` en los specs, de forma que los componentes con dependencias de Angular Router/Http/Material puedan testearse sin arrancar la aplicación completa.

CI suggestions
- Para ejecutar tests en CI (GitHub Actions / GitLab CI) recomiendo usar `ubuntu-latest` y un job que:

	- Instale dependencias del sistema (si se usan Puppeteer/Chromium).
	- Ejecute `npm ci` en `server/` y `client/`.
	- Para Jest: o bien permitir que `mongodb-memory-server` descargue su binario (asegurar que la imagen tenga libcrypto), o inyectar `MONGO_TEST_URI` apuntando a un servicio Mongo de pruebas.
	- Para Karma: establecer `CHROME_BIN` al ejecutable de Puppeteer (o usar una imagen de runner con Chrome disponible).

Ejemplo (GitHub Actions snippet):

```yaml
jobs:
	tests:
		runs-on: ubuntu-latest
		steps:
			- uses: actions/checkout@v4
			- name: Setup Node
				uses: actions/setup-node@v4
				with:
					node-version: '18'
			- name: Install system deps
				run: sudo apt-get update && sudo apt-get install -y libnss3 libnspr4 libgtk-3-0 fonts-liberation
			- name: Install server deps and run Jest
				run: |
					cd server
					npm ci
					npm test
			- name: Install client deps and run Karma
				run: |
					cd client
					npm ci
					npm install --no-audit --no-fund --save-dev puppeteer
					CHROME_BIN="$(node -e \"console.log(require('puppeteer').executablePath())\")" npm test -- --watch=false
```

 
