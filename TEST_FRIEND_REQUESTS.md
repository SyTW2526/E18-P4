# Test Manual: Sistema de Solicitudes de Amistad

## Descripción General
Este documento describe cómo verificar que las solicitudes de amistad se envían correctamente entre el frontend y backend.

## Flujo Completo

### 1. **Frontend → Solicitud GET `/users/search?q=nombre`**
- Usuario escribe en el campo de búsqueda
- El componente `buscar()` se ejecuta con debounce (300ms)
- Se envía GET a `/users/search` para obtener resultados

**Que verificar en Console (F12):**
```
[Friend Request] Verificando usuario: <objectId>
```

### 2. **Frontend → GET `/users/{userId}/basic`**
- Se obtiene el perfil del usuario seleccionado
- Backend valida que el usuario exista

**Que verificar en Console:**
```
[Friend Request] Usuario verificado: { _id, nombre, email, foto_perfil }
```

### 3. **Frontend → POST `/users/{receiverId}/add-amigo`**
- Se envía la solicitud de amistad con `senderId` en el body
- Backend verifica IDs válidos, usuarios existentes, sin duplicados

**Que verificar en Console (Frontend):**
```
[Friend Request] Enviando solicitud de <senderId> a <receiverId>
```

**Que verificar en Console (Backend/Terminal):**
```
[Friend Request] Received POST /users/{receiverId}/add-amigo with senderId: <senderId>
[Friend Request] Both users exist. Sender: Juan (65a1...), Receiver: Maria (65b2...)
[Friend Request] Sending friend request...
[Friend Request] Database update successful. Creating notification...
[Friend Request] Notification created successfully
[Friend Request] Friend request completed successfully
```

### 4. **Backend → Actualización de BD**
- Se agrega `senderId` al array `peticiones_amistad` del receiver
- Se crea una notificación de tipo `solicitud_amistad`

## Pasos para Probar

### Prerequisites
- Tener al menos 2 usuarios registrados en la app
- Estar logueado como Usuario A
- Conocer el nombre o email del Usuario B

### Test Steps

1. **Abre la página de Amigos**
   - Navega a `/friends`
   - Deberías ver 3 tabs: "Solicitudes", "Amigos", "Buscar"

2. **Accede a la pestaña "Buscar"**
   - Click en tab "Buscar" (icon person_add)

3. **Busca un usuario**
   - Escribe el nombre del Usuario B en el campo de búsqueda
   - Espera a que aparezcan los resultados (debounce de 300ms)
   - Abre la consola del navegador (F12 → Console)
   - Deberías ver: `[Friend Request] Usuario verificado: ...`

4. **Selecciona el usuario**
   - Click en el usuario de la lista
   - Se muestra su tarjeta de perfil
   - Verifica que no diga "Ya son amigos" o "Solicitud enviada"

5. **Envía solicitud de amistad**
   - Click en botón "Enviar solicitud"
   - **Consola Frontend** debe mostrar:
     ```
     [Friend Request] Enviando solicitud de <tuID> a <suID>
     [Friend Request] Solicitud enviada exitosamente: { message: "..." }
     ```
   - Se muestra alert: "Solicitud de amistad enviada a [Nombre]"
   - El estado del botón cambia a "Solicitud enviada"

6. **Verifica en Backend**
   - Abre la terminal del servidor (backend)
   - Deberías ver logs como:
     ```
     [Friend Request] Received POST /users/65b2.../add-amigo with senderId: 65a1...
     [Friend Request] Both users exist. Sender: Juan, Receiver: Maria
     [Friend Request] Sending friend request...
     [Friend Request] Database update successful. Creating notification...
     [Friend Request] Notification created successfully
     [Friend Request] Friend request completed successfully
     ```

7. **Verifica en BD**
   - Conéctate a MongoDB
   - Busca el Usuario B en la colección `users`
   - Verifica que su array `peticiones_amistad` contiene el ObjectId del Usuario A
   - Ejemplo:
     ```json
     {
       "_id": ObjectId("65b2..."),
       "nombre": "Maria",
       "peticiones_amistad": [ObjectId("65a1...")]
     }
     ```

8. **Verifica Notificaciones**
   - Busca en la colección `notifications`
   - Deberías encontrar un documento con:
     ```json
     {
       "tipo": "solicitud_amistad",
       "de_usuario": "65a1...",
       "para_usuario": "65b2...",
       "mensaje": "Juan te ha enviado una solicitud de amistad",
       "leida": false
     }
     ```

## Casos de Error Esperados

### 1. Usuario no existe
**Frontend muestra:** "El usuario no existe en el sistema"
**Backend log:** `[Friend Request] Error: Receiver not found with ID: ...`

### 2. ID inválido
**Frontend muestra:** "El usuario no existe o no se puede acceder a su perfil"
**Backend log:** `[Friend Request] Error: Invalid receiverId format: ...`

### 3. Ya son amigos
**Backend log:** `[Friend Request] Error: Already friends`
**Backend responde:** 400 "Already friends with this user"

### 4. Solicitud ya existe
**Backend log:** `[Friend Request] Error: Request already exists`
**Backend responde:** 400 "Friend request already sent to this user"

## Solución de Problemas

### El botón "Enviar solicitud" no responde
1. Abre F12 → Console
2. Verifica si hay errores JavaScript
3. Revisa el tab Network para ver la request HTTP
4. Busca errores 400/404/500 en la respuesta

### No aparece el log en el backend
1. Verifica que el servidor está corriendo: `docker compose ps`
2. Revisa el log del contenedor: `docker compose logs server`
3. Asegúrate de estar enviando los IDs correctamente

### La notificación no se crea
1. Verifica que la colección `notifications` existe
2. Revisa si hay errores en MongoDB: `docker compose logs db`
3. El endpoint NO fallará si la notificación falla (por diseño)

## Información Útil

### URLs de Testing
- Frontend: http://localhost:4200/friends
- API Base: http://localhost:3000/api

### Endpoints Relevantes
- `GET /api/users/search?q=nombre` - Buscar usuarios
- `GET /api/users/{id}/basic` - Obtener info básica del usuario
- `GET /api/users/{id}/peticiones-amistad` - Obtener solicitudes pendientes
- `POST /api/users/{receiverId}/add-amigo` - Enviar solicitud
- `POST /api/users/{receiverId}/accept-amigo` - Aceptar solicitud
- `POST /api/users/{receiverId}/reject-amigo` - Rechazar solicitud

### IDs en la Base de Datos
Para obtener los ObjectIds de los usuarios en MongoDB:
```bash
docker exec e18-p4-db mongosh
use paysplit
db.users.find({}, { _id: 1, nombre: 1, email: 1 })
```

## Conclusión
Si todos estos pasos funcionan correctamente, el sistema de solicitudes de amistad está funcionando correctamente. Los logs te ayudarán a identificar en qué punto del flujo ocurren problemas si los hay.
