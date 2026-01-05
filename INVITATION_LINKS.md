# Sistema de Invitaciones por Enlace

## Descripción
Se ha implementado un sistema completo de invitaciones por enlace que permite a los administradores y owners de grupos compartir enlaces para que otros usuarios se unan fácilmente.

## Características Implementadas

### Backend
✅ **Endpoints existentes** (ya estaban implementados):
- `POST /group-invitations/link/create` - Crear enlace de invitación
- `GET /group-invitations/group/:groupId/links` - Obtener enlaces activos de un grupo
- `POST /group-invitations/link/:token/join` - Unirse a un grupo usando un token
- `POST /group-invitations/link/:linkId/revoke` - Revocar un enlace

### Frontend

#### 1. **AuthService** (`/client/src/app/auth/auth.service.ts`)
Métodos agregados:
- `createInvitationLink()` - Crear un enlace de invitación
- `getGroupInvitationLinks()` - Obtener enlaces de un grupo
- `joinGroupWithLink()` - Unirse usando un token
- `revokeInvitationLink()` - Revocar un enlace

#### 2. **GroupSettingsComponent** (`/client/src/app/paysplit/group-settings/group-settings.component.ts`)
Nueva sección "Enlaces de invitación" visible solo para admins y owners:
- **Crear enlaces** con opciones:
  - Usos máximos (opcional)
  - Días hasta expirar (opcional)
- **Lista de enlaces activos** mostrando:
  - Usos actuales / máximos
  - Fecha de expiración
  - URL del enlace
  - Botones para copiar y revocar
- **Auto-copia** del enlace al crearlo

#### 3. **JoinGroupComponent** (`/client/src/app/join-group/join-group.component.ts`)
Nuevo componente para manejar `/join-group/:token`:
- **Verificación de autenticación**: Si no está logueado, muestra opciones de login/registro
- **Unión automática**: Si está logueado, intenta unirse al grupo
- **Estados visuales**:
  - Loading (spinner)
  - Éxito (con botón para ir al grupo)
  - Error (con mensajes específicos)
- **Persistencia**: Guarda el token en sessionStorage para redirigir después del login

#### 4. **Login/Register** (`/client/src/app/auth/`)
Modificados para:
- Verificar si hay un token pendiente en sessionStorage
- Redirigir automáticamente a `/join-group/:token` después de autenticarse
- Funciona tanto con login normal como con Google Sign-In

## Flujo de Uso

### Para Administradores (Crear enlace)
1. Ir a "Configuración del grupo" (`/group/:id/settings`)
2. En la sección "Enlaces de invitación", hacer clic en el botón "+"
3. (Opcional) Configurar:
   - Número máximo de usos
   - Días hasta que expire
4. Hacer clic en "Crear"
5. El enlace se copia automáticamente al portapapeles
6. Compartir el enlace con quien quieras invitar

### Para Usuarios (Unirse por enlace)
1. Hacer clic en el enlace compartido (ej: `http://localhost:4200/join-group/abc123...`)
2. **Si no estás logueado:**
   - Se te mostrará una pantalla con opciones de login/registro
   - Después de autenticarte, se te unirá automáticamente al grupo
3. **Si ya estás logueado:**
   - Se te unirá inmediatamente al grupo
   - Verás un mensaje de éxito con opción de ir al grupo

## Validaciones y Seguridad

### Backend
- ✅ Verifica que solo admins/owners puedan crear enlaces
- ✅ Valida que el enlace no haya expirado
- ✅ Verifica que no se haya alcanzado el máximo de usos
- ✅ Previene que el mismo usuario se una dos veces
- ✅ Incrementa el contador de usos al unirse

### Frontend
- ✅ Solo muestra la sección a admins/owners
- ✅ Maneja errores específicos (expirado, máximo de usos, etc.)
- ✅ Requiere autenticación para unirse
- ✅ Guarda el token pendiente si no está autenticado

## Mensajes de Error Personalizados

El sistema maneja los siguientes casos de error:
- "Este enlace de invitación ha expirado"
- "Este enlace ha alcanzado el número máximo de usos"
- "Ya eres miembro de este grupo"
- "El enlace de invitación no es válido"

## Ejemplos de Uso

### Crear enlace con 10 usos que expire en 7 días
```typescript
// Se hace desde la UI en group-settings
// Campos:
// - Usos máximos: 10
// - Días hasta expirar: 7
```

### Crear enlace ilimitado sin expiración
```typescript
// Se hace desde la UI en group-settings
// Dejar ambos campos vacíos
```

## Testing

### Probar creación de enlace
1. Crear un grupo
2. Ir a configuración del grupo
3. Crear un enlace
4. Verificar que se copie automáticamente
5. Verificar que aparezca en la lista de enlaces activos

### Probar unión por enlace (usuario logueado)
1. Copiar un enlace de invitación
2. Abrir en navegador (o nueva ventana)
3. Verificar que se una automáticamente
4. Verificar que aparezca en la lista de miembros del grupo

### Probar unión por enlace (usuario no logueado)
1. Cerrar sesión
2. Hacer clic en un enlace de invitación
3. Verificar que pida login/registro
4. Iniciar sesión
5. Verificar que se una automáticamente después del login

### Probar revocación
1. Crear un enlace
2. Hacer clic en "Revocar"
3. Intentar usar el enlace
4. Verificar que muestre error "inválido o expirado"

## Rutas Agregadas

- `/join-group/:token` - Página pública para unirse por enlace

## Archivos Modificados/Creados

### Creados
- `/client/src/app/join-group/join-group.component.ts`

### Modificados
- `/client/src/app/auth/auth.service.ts`
- `/client/src/app/paysplit/group-settings/group-settings.component.ts`
- `/client/src/app/auth/login/login.component.ts`
- `/client/src/app/auth/register/register.component.ts`
- `/client/src/app/app.routes.ts`

## Notas Técnicas

- Los enlaces usan tokens generados con `crypto.randomBytes(16).toString('hex')`
- Los tokens se almacenan en la colección `groupInvitations` con `tipo: 'enlace'`
- El frontend construye la URL completa usando `window.location.origin`
- Los enlaces revocados cambian su estado a `'rechazada'`
- El componente JoinGroup es standalone y no requiere AuthGuard (es público)
