# Google Sign-In implementado en Registro

## Resumen de Cambios

Se ha implementado exitosamente Google Sign-In en la página de **Registro** (`register.component.ts` y `register.component.html`) siguiendo el mismo patrón utilizado en la página de **Login**.

## Archivos Modificados

### 1. `client/src/app/auth/register/register.component.ts`

**Cambios realizados:**
- ✅ Agregados imports: `OnInit`, `AfterViewInit`, `NgZone`, `MatIconModule`
- ✅ Clase ahora implementa `OnInit` y `AfterViewInit`
- ✅ Agregada propiedad `googleReady: boolean = false`
- ✅ Agregado `NgZone` en constructor
- ✅ Implementado `ngOnInit()` que llama a `initGoogleSignIn()`
- ✅ Implementado `ngAfterViewInit()` que renderiza el botón cuando DOM está listo
- ✅ Método privado `initGoogleSignIn()` que:
  - Verifica si SDK de Google ya está cargado
  - Si está cargado: inicializa inmediatamente
  - Si no: carga el script de forma asincrónica
  - Configura callback `handleGoogleSignIn`
  - Establece `googleReady = true` después de inicializar
  - Programa render del botón con setTimeout
- ✅ Método privado `renderGoogleButton()` que:
  - Obtiene referencia al div `#google-signin-button-register`
  - Verifica que SDK esté cargado
  - Renderiza el botón con opciones `{ theme: 'outline', size: 'large', text: 'signup_with' }`
  - Incluye manejo de errores con try/catch
- ✅ Método público `handleGoogleSignIn(response)` que:
  - Extrae el token de la respuesta de Google
  - Llama a `auth.signinGoogle(token)`
  - Navega a `/home` en caso de éxito
  - Muestra mensaje de error en caso de fallo

### 2. `client/src/app/auth/register/register.component.html`

**Cambios realizados:**
- ✅ Agregado divisor "O" entre formulario y botón de Google
- ✅ Agregado div con id `google-signin-button-register` con estilos:
  - `margin-top: 16px`
  - `display: flex`
  - `justify-content: center`

## Flujo de Funcionamiento

### En la página de Registro:

1. **Inicialización (ngOnInit)**
   - Componente llama a `initGoogleSignIn()`
   - Si SDK ya existe: inicializa inmediatamente
   - Si no existe: carga script asincrónico desde `https://accounts.google.com/gsi/client`

2. **Configuración del SDK**
   - Client ID: `642232939098-94193hhr1jgcduddpujmhfq4snomrruk.apps.googleusercontent.com`
   - Callback: `handleGoogleSignIn` (vinculado con `.bind(this)`)
   - Flag: `googleReady = true`

3. **Renderización (ngAfterViewInit)**
   - Se ejecuta cuando el DOM está completamente listo
   - Si `googleReady === true`, renderiza el botón
   - El botón se coloca en el div `#google-signin-button-register`

4. **Interacción del Usuario**
   - Usuario hace clic en botón de Google
   - Google abre diálogo de autenticación
   - Usuario autoriza la aplicación
   - Google SDK llama a `handleGoogleSignIn(response)`

5. **Autenticación Backend**
   - Token se envía a `POST /server/signin-google`
   - Backend verifica token con Google OAuth2Client
   - Backend crea o recupera usuario en MongoDB
   - Backend retorna JWT

6. **Redirección**
   - Frontend guarda JWT en localStorage
   - Frontend navega a `/home`

## Diferencias con Login

- **ID del div**: `google-signin-button-register` (registro) vs `google-signin-button` (login)
- **Texto del botón**: `signup_with` (registro) vs `signin_with` (login)
- El resto de la lógica es idéntica

## Verificación

✅ Compilación: `npm run build` exitosa
✅ Docker: `docker-compose up -d --build` ejecutado correctamente
✅ HTML: Ambas páginas contienen los divs correctos
  - Login: `<div id="google-signin-button" ...></div>`
  - Registro: `<div id="google-signin-button-register" ...></div>`

## Testing

Para verificar que funciona:

1. Navega a `http://localhost:4200/register`
2. Deberías ver:
   - Formulario de registro (usuario, email, contraseña)
   - Botón "Regístrate"
   - Separador "O"
   - Botón de Google Sign-In (debe renderizarse automáticamente)
3. Haz clic en botón de Google
4. Completa autenticación con Google
5. Deberías ser redirigido a `/home`

## Notas Técnicas

- El SDK de Google se carga **una sola vez** (en el primer componente que lo necesite)
- Los componentes de login y registro utilizan callbacks **vinculados** (`.bind(this)`) para mantener contexto correcto
- Se usa `ngZone.run()` en `handleGoogleSignIn` para ejecutar dentro de zona de Angular
- El método `renderGoogleButton()` es privado y se llama automáticamente en `ngAfterViewInit`
- Se incluye validación en `renderGoogleButton()` para evitar errores si SDK no está listo

## Seguridad

- Client ID es de dominio público (necesario para Google SDK)
- Token se verifica en **backend** con Google OAuth2Client
- JWT se almacena en localStorage y se envía en headers de solicitudes autenticadas
