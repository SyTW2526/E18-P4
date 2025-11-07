import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { MainComponent } from './bill-splitter/main/main.component';
// Importa un guard de autenticación aquí cuando lo tengas

export const routes: Routes = [
  // Ruta principal, idealmente protegida por un guard
  { 
    path: '', 
    component: MainComponent, 
    title: 'Dividir la Cuenta' 
    // canActivate: [authGuard] 
  },
  
  // Rutas de autenticación
  { path: 'login', component: LoginComponent, title: 'Iniciar Sesión' },
  { path: 'register', component: RegisterComponent, title: 'Registrarse' },

  // Redirige cualquier otra ruta a la principal
  { path: '**', redirectTo: '' }
];