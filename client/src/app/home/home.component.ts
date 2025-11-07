import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule],
  template: `
    <section style="max-width:900px; width:100%; text-align:center">
      <h1>Bienvenido a PaySplit</h1>

      <ng-container *ngIf="!auth.isLoggedIn()">
        <p>Antes de continuar debes iniciar sesión o registrarte.</p>

        <div style="display:flex;gap:2rem;justify-content:center; margin-top:1rem">
          <div style="min-width:300px">
            <h3>Signup</h3>
            <form (ngSubmit)="signup()">
              <mat-form-field style="width:100%">
                <input matInput placeholder="Nombre" [(ngModel)]="signupModel.nombre" name="nombre" required (ngModelChange)="clearSignupError()" />
              </mat-form-field>
              <mat-form-field style="width:100%">
                <input matInput placeholder="Email" [(ngModel)]="signupModel.email" name="email" required (ngModelChange)="clearSignupError()" />
              </mat-form-field>
              <mat-form-field style="width:100%">
                <input matInput placeholder="Password" [(ngModel)]="signupModel.password" name="password" type="password" required (ngModelChange)="clearSignupError()" />
              </mat-form-field>
              <div style="display:flex;flex-direction:column;gap:0.5rem">
                <button mat-raised-button color="primary" type="submit" [disabled]="signupLoading">{{ signupLoading ? 'Registrando...' : 'Registrarse' }}</button>
                <div *ngIf="signupError" style="color:#b00020;font-size:0.9rem;text-align:left">{{ signupError }}</div>
              </div>
            </form>
          </div>

          <div style="min-width:300px">
            <h3>Signin</h3>
            <form (ngSubmit)="signin()">
              <mat-form-field style="width:100%">
                <input matInput placeholder="Email" [(ngModel)]="signinModel.email" name="se_email" required (ngModelChange)="clearSigninError()" />
              </mat-form-field>
              <mat-form-field style="width:100%">
                <input matInput placeholder="Password" [(ngModel)]="signinModel.password" name="se_password" type="password" required (ngModelChange)="clearSigninError()" />
              </mat-form-field>
              <div style="display:flex;flex-direction:column;gap:0.5rem">
                <button mat-raised-button color="accent" type="submit" [disabled]="signinLoading">{{ signinLoading ? 'Iniciando...' : 'Iniciar sesión' }}</button>
                <div *ngIf="signinError" style="color:#b00020;font-size:0.9rem;text-align:left">{{ signinError }}</div>
              </div>
            </form>
          </div>
        </div>
      </ng-container>

      <div *ngIf="auth.isLoggedIn()" style="margin-top:1rem">
        <p>Conectado como <strong>{{ auth.getUser()?.nombre || auth.getUser()?.email }}</strong></p>
        <div style="display:flex;gap:1rem;justify-content:center;margin-top:0.5rem">
          <a routerLink="/shared-accounts"><button mat-stroked-button>Ver cuentas compartidas</button></a>
          <button mat-button (click)="logout()">Cerrar sesión</button>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent {
  signupModel = { nombre: '', email: '', password: '' };
  signinModel = { email: '', password: '' };
  signupError: string | null = null;
  signinError: string | null = null;
  signupLoading = false;
  signinLoading = false;

  constructor(public auth: AuthService, private router: Router) {}

  signup() {
    this.signupError = null;
    this.signupLoading = true;
    this.auth.signup(this.signupModel).subscribe({
      next: () => {
        this.signupLoading = false;
        this.router.navigate(['/shared-accounts']);
      },
      error: (e) => {
        this.signupLoading = false;
        this.signupError = e?.error?.message || e?.message || 'Error al registrarse. Intenta de nuevo.';
        console.error('signup error', e);
      },
    });
  }

  signin() {
    this.signinError = null;
    this.signinLoading = true;
    this.auth.signin(this.signinModel).subscribe({
      next: () => {
        this.signinLoading = false;
        this.router.navigate(['/shared-accounts']);
      },
      error: (e) => {
        this.signinLoading = false;
        this.signinError = e?.error?.message || e?.message || 'Error al iniciar sesión. Revisa tus credenciales.';
        console.error('signin error', e);
      },
    });
  }

  clearSignupError() {
    this.signupError = null;
  }

  clearSigninError() {
    this.signinError = null;
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/']);
  }
}
