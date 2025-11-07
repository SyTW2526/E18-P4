import { Component } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router'; // Importar RouterModule
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button'; // Para botones de login/logout
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet, 
    RouterModule, // Añadir
    MatToolbarModule, 
    MatButtonModule, // Añadir
    MatIconModule
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
      <button mat-button routerLink="/login">Login</button>
      <button mat-button routerLink="/register">Registro</button>
      <button mat-icon-button>
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
}