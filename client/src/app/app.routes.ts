import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from '../app/paysplit/home/home.component';
// Importa un guard de autenticación aquí cuando lo tengas

export const routes: Routes = [
  // Al inicio redirigimos a la pantalla de login/registro
  { path: '', redirectTo: 'login', pathMatch: 'full' },

  // Rutas de autenticación
  { path: 'login', component: LoginComponent, title: 'Iniciar Sesión' },
  { path: 'register', component: RegisterComponent, title: 'Registrarse' },

  // Ruta principal de la app (accedida tras autenticarse)
  { path: 'home', component: HomeComponent, title: 'Inicio' },

  // Redirige cualquier otra ruta a login
  { path: '**', redirectTo: 'login' }
];