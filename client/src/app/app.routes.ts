import { Routes } from '@angular/router';
import { AuthGuard } from './auth/auth.guard';

export const routes: Routes = [
  // Al inicio mostramos la pantalla de presentación (landing)
  { path: '', loadComponent: () => import('./landing/landing.component').then(m => m.LandingComponent), title: 'Bienvenido' },

  // Rutas de autenticación
  { path: 'login', loadComponent: () => import('./auth/login/login.component').then(m => m.LoginComponent), title: 'Iniciar Sesión' },
  { path: 'register', loadComponent: () => import('./auth/register/register.component').then(m => m.RegisterComponent), title: 'Registrarse' },

  // Ruta principal de la app (accedida tras autenticarse)
  { path: 'home', loadComponent: () => import('./paysplit/home/home.component').then(m => m.HomeComponent), title: 'Inicio', canActivate: [AuthGuard] },
  { path: 'group/:id', loadComponent: () => import('./paysplit/account-detail/account-detail.component').then(m => m.AccountDetailComponent), title: 'Cuenta', canActivate: [AuthGuard] },
  { path: 'group/:id/settings', loadComponent: () => import('./paysplit/group-settings/group-settings.component').then(m => m.GroupSettingsComponent), title: 'Configuración del grupo', canActivate: [AuthGuard] },
  { path: 'group/:id/create-gasto', loadComponent: () => import('./paysplit/create-gasto/create-gasto.component').then(m => m.CreateGastoComponent), title: 'Crear Gasto', canActivate: [AuthGuard] },
  { path: 'group/:id/gasto/:gastoId', loadComponent: () => import('./paysplit/create-gasto/create-gasto.component').then(m => m.CreateGastoComponent), title: 'Editar Gasto', canActivate: [AuthGuard] },
  { path: 'group/:id/balance', loadComponent: () => import('./paysplit/balance/balance.component').then(m => m.BalanceComponent), title: 'Balances', canActivate: [AuthGuard] },
  { path: 'settings', loadComponent: () => import('./settings/user-settings.component').then(m => m.UserSettingsComponent), title: 'Configuración', canActivate: [AuthGuard] },

  // User profile route (friend links navigate here)
  { path: 'users/:id', loadComponent: () => import('./users/user-profile.component').then(m => m.UserProfileComponent), title: 'Usuario', canActivate: [AuthGuard] },

  // Redirige cualquier otra ruta a landing
  { path: '**', redirectTo: '' }
];