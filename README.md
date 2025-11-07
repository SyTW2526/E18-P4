# Proyecto E18-P4 — Instrucciones rápidas

## Levantar MongoDB y el servidor (Docker)

Aquí tienes comandos rápidos para levantar la base de datos MongoDB y el servidor del proyecto usando Docker Compose, y alternativas con Docker y npm para desarrollo local.

### 1) Usando Docker Compose (recomendado)

- Construir y levantar los servicios (Mongo + servidor):

```bash
docker compose up --build
```

- Ver logs del servidor:

```bash
docker compose logs -f server
```

### 2) Construir la imagen y ejecutar el servidor con Docker (sin compose)

- Construir la imagen (desde la raíz del repo):

```bash
docker build -t e18-p4-server:dev -f server/Dockerfile server
```

### 3) Ejecutar MongoDB con Docker (solo la base de datos)

- Levantar un contenedor Mongo local (prueba/desarrollo):

```bash
docker run -d --name e18-p4-mongo -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=example \
  -e MONGO_INITDB_DATABASE=meanStackExample \
  mongo:6.0
```

### 4) Alternativa: ejecutar el servidor localmente (sin Docker)

- Instala dependencias y compila:

```bash
npm --prefix server install
npm --prefix server run build
```

- Arrancar en modo desarrollo (usa ts-node) o producción (desde `dist`):

```bash
npm --prefix server start      # usa ts-node (según package.json)
# o ejecutar el bundle ya compilado
node server/dist/server.js
```

### 5) Probar que está arriba

- Endpoint ejemplo (listar usuarios):

```bash
curl -s http://localhost:5200/users/
```

### Notas rápidas

- Por seguridad no pongas credenciales reales en el repositorio; usa `server/.env` (no comitees) o secretos en tu entorno de despliegue.
- El `docker-compose.yml` incluido configura Mongo y el servicio `server` para conectarse a `mongo` usando `ATLAS_URI` de `server/.env` o un fallback interno.
- Si cambias el código del servidor reconstruye la imagen (`docker compose up --build`) para que el contenedor ejecute la versión actual.

---

## Explicación de las colecciones y su funcionamiento

A continuación tienes una descripción en español de las principales colecciones ("tablas") usadas por el proyecto, sus campos clave y cómo se relacionan.

- `users`
  - Propósito: almacena los usuarios de la aplicación.
  - Campos clave: `_id` (ObjectId), `nombre`, `email` (único), `password_hash` (bcrypt), `fecha_creacion`.
  - Notas: las rutas públicas no devuelven `password_hash`. En `signup` la contraseña se almacena hasheada.

- `shared_accounts` (cuentas compartidas)
  - Propósito: representa un grupo de gastos compartidos (ej. "Viaje a Roma").
  - Campos clave: `_id` (ObjectId), `nombre`, `descripcion`, `moneda`, `creador_id` (referencia a `users._id`), `fecha_creacion`.
  - Notas: expone rutas CRUD y endpoints como `GET /shared_accounts/:id/balances`.

- `user_groups` (relación N:M usuario↔grupo)
  - Propósito: asocia usuarios a `shared_accounts`.
  - Campos clave: `_id`, `id_usuario` (referencia a `users._id`), `id_grupo` (referencia a `shared_accounts._id`), `rol` (opcional), `fecha_union`.
  - Índices: índice compuesto único `(id_usuario, id_grupo)` para evitar duplicados.

- `gastos` (gastos dentro de una cuenta compartida)
  - Propósito: almacena cada gasto realizado en un `shared_account`.
  - Campos clave: `_id`, `id_grupo`, `id_autor` (referencia a `users._id`), `monto`, `moneda`, `descripcion`, `fecha_gasto`.

- `participaciones` (cómo se reparte cada gasto)
  - Propósito: relaciona un `gasto` con los usuarios participantes y la porción asignada.
  - Campos clave: `_id`, `id_gasto` (referencia a `gastos._id`), `id_usuario` (referencia a `users._id`), `porcentaje` o `monto_asignado`.

### Cómo se calculan los balances (resumen)

- Para calcular cuánto debe o tiene que recibir cada usuario en un `shared_account` se agregan los `gastos` del grupo y se cruzan con las `participaciones`.
- Fórmula conceptual por usuario: balance = (suma de lo que pagó como autor) - (suma de lo que le corresponde según participaciones).
- El servidor expone `GET /shared_accounts/:id/balances` que agrega `gastos` + `participaciones` + `user_groups` para devolver el balance por usuario.

### Validación e índices

- Las colecciones incluyen JSON Schemas (definidos en `server/src/database.ts`) para validar documentos al insertar/actualizar.
- Índices relevantes: `users.email` (único), `(id_usuario,id_grupo)` (único) en `user_groups`, índices en `gastos.id_grupo` y `participaciones.id_gasto`.

### Autenticación y seguridad

- El proyecto usa `bcrypt` para hashear contraseñas y `jsonwebtoken` (JWT) para sesiones sin estado (`signup`/`signin`).
- Recomendación: configurar `JWT_SECRET` en `server/.env` o variables de entorno del despliegue; no commitear secretos.

---

Si quieres puedo añadir:
- ejemplos JSON por colección,
- un pequeño diagrama ER,
- o ejemplos de `curl` para el endpoint de balances (con una respuesta de ejemplo).