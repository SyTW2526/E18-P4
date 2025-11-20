import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router'; // Importar RouterModule
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button'; // Para botones de login/logout
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, 
    RouterModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule
    , HttpClientModule
  ],
  styles: [
    `
      main {
        display: flex;
        justify-content: center;
        padding: 2rem 4rem;
      }
      .spacer {
        flex: 1 1 auto;
      }
    `,
  ],
  template: `
      <mat-toolbar color="primary">
      <span>Divisor de Cuentas</span>
      <span class="spacer"></span>
      <button *ngIf="!authService.isLoggedIn()" mat-button routerLink="/login">Login</button>
      <button *ngIf="!authService.isLoggedIn()" mat-button routerLink="/register">Registro</button>
      <button *ngIf="authService.isLoggedIn()" mat-button routerLink="/settings">Configuración</button>
      <button *ngIf="authService.isLoggedIn()" mat-icon-button (click)="logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
    <main>
      <router-outlet></router-outlet>
    </main>
  `,
})
export class AppComponent {
  title = 'bill-splitter-client'; // Título actualizado
  constructor(public authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}