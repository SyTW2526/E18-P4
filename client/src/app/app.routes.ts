import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from '../app/paysplit/home/home.component';
import { AuthGuard } from './auth/auth.guard';
import { AccountDetailComponent } from './paysplit/account-detail/account-detail.component';
import { CreateGastoComponent } from './paysplit/create-gasto/create-gasto.component';
import { BalanceComponent } from './paysplit/balance/balance.component';

export const routes: Routes = [
  // Al inicio redirigimos a la pantalla de login/registro
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Rutas de autenticación
  { path: 'login', component: LoginComponent, title: 'Iniciar Sesión' },
  { path: 'register', component: RegisterComponent, title: 'Registrarse' },

  // Ruta principal de la app (accedida tras autenticarse)
  { path: 'home', component: HomeComponent, title: 'Inicio', canActivate: [AuthGuard] },
  { path: 'group/:id', component: AccountDetailComponent, title: 'Cuenta', canActivate: [AuthGuard] },
  { path: 'group/:id/create-gasto', component: CreateGastoComponent, title: 'Crear Gasto', canActivate: [AuthGuard] },
  { path: 'group/:id/balance', component: BalanceComponent, title: 'Balances', canActivate: [AuthGuard] },

  // Redirige cualquier otra ruta a login
  { path: '**', redirectTo: 'login' }
];