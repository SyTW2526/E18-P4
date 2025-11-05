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

Si quieres, puedo:
- Añadir un ejemplo de `.env.example` en `server/` y aplicarlo en el repo.
- Implementar los endpoints `/signup` y `/signin` con JWT en `server/src/routes/users.route.ts` y añadir instrucciones de uso (registro/login y cómo usar el token en peticiones).

Dime qué prefieres y lo implemento. 