import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCardModule, MatListModule],
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
                <input matInput placeholder="Password" [(ngModel)]="signupModel.password" name="password" [type]="showSignupPassword ? 'text' : 'password'" required (ngModelChange)="clearSignupError()" />
                <button mat-icon-button matSuffix type="button" (click)="toggleSignupPassword()" [attr.aria-label]="showSignupPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <mat-icon>{{ showSignupPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
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
                <input matInput placeholder="Password" [(ngModel)]="signinModel.password" name="se_password" [type]="showSigninPassword ? 'text' : 'password'" required (ngModelChange)="clearSigninError()" />
                <button mat-icon-button matSuffix type="button" (click)="toggleSigninPassword()" [attr.aria-label]="showSigninPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'">
                  <mat-icon>{{ showSigninPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
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

        <section style="margin-top:1rem; text-align:left; max-width:900px; margin-left:auto; margin-right:auto">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>Mis grupos</h3>
            <div style="display:flex;gap:0.5rem">
              <button mat-stroked-button (click)="createFormVisible = !createFormVisible">Crear</button>
              <button mat-flat-button color="primary" (click)="joinFormVisible = !joinFormVisible">Unirse</button>
              <button mat-button (click)="logout()">Cerrar sesión</button>
            </div>
          </div>

          <div *ngIf="createFormVisible" style="margin-top:0.75rem;">
            <mat-form-field style="width:60%">
              <input matInput placeholder="Nombre del nuevo grupo" [(ngModel)]="createName" name="createName" />
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="createGroupFromForm()" [disabled]="createLoading">{{ createLoading ? 'Creando...' : 'Crear grupo' }}</button>
          </div>

          <div *ngIf="joinFormVisible" style="margin-top:0.75rem;">
            <mat-form-field style="width:60%">
              <input matInput placeholder="ID del grupo" [(ngModel)]="joinId" name="joinId" />
            </mat-form-field>
            <button mat-raised-button color="accent" (click)="joinGroupFromForm()" [disabled]="joinLoading">{{ joinLoading ? 'Uniendo...' : 'Unirse' }}</button>
          </div>

          <div *ngIf="loadingGroups" style="margin-top:1rem">Cargando grupos...</div>
          <div *ngIf="groupsError" style="color:#b00020;margin-top:1rem">{{ groupsError }}</div>

          <div *ngIf="!loadingGroups && sharedAccounts.length" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;margin-top:1rem">
            <mat-card *ngFor="let g of sharedAccounts">
              <mat-card-title>{{ g.nombre }}</mat-card-title>
              <mat-card-subtitle *ngIf="g.moneda">Moneda: {{ g.moneda }}</mat-card-subtitle>
              <mat-card-content>
                <p *ngIf="g.descripcion">{{ g.descripcion }}</p>
                <p style="color:#666;font-size:0.9rem">ID: {{ g._id }}</p>
              </mat-card-content>
              <mat-card-actions>
                <button mat-button (click)="openGroup(g)">Ver</button>
              </mat-card-actions>
            </mat-card>
          </div>

          <div *ngIf="!loadingGroups && !sharedAccounts.length" style="margin-top:1rem">No perteneces a ningún grupo todavía.</div>
        </section>
      </div>
    </section>
  `,
})
export class HomeComponent {
  sharedAccounts: any[] = [];
  loadingGroups = false;
  groupsError: string | null = null;
  signupModel = { nombre: '', email: '', password: '' };
  signinModel = { email: '', password: '' };
  showSignupPassword = false;
  showSigninPassword = false;
  signupError: string | null = null;
  signinError: string | null = null;
  signupLoading = false;
  signinLoading = false;
  // UI state for create/join forms
  createFormVisible = false;
  joinFormVisible = false;
  createName = '';
  joinId = '';
  createLoading = false;
  joinLoading = false;

  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.loadSharedAccounts();
    }
  }

  toggleSignupPassword() {
    this.showSignupPassword = !this.showSignupPassword;
  }

  toggleSigninPassword() {
    this.showSigninPassword = !this.showSigninPassword;
  }

  signup() {
    this.signupError = null;
    this.signupLoading = true;
    this.auth.signup(this.signupModel).subscribe({
      next: () => {
        this.signupLoading = false;
        // after signup go to the protected home view
        this.router.navigate(['/home']);
      },
      error: (e: any) => {
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
        // after signin go to the protected home view
        this.router.navigate(['/home']);
      },
      error: (e: any) => {
        this.signinLoading = false;
        this.signinError = e?.error?.message || e?.message || 'Error al iniciar sesión. Revisa tus credenciales.';
        console.error('signin error', e);
      },
    });
  }

  loadSharedAccounts() {
    this.groupsError = null;
    this.loadingGroups = true;
    this.auth.getSharedAccounts().subscribe({
      next: (res: any) => {
        this.sharedAccounts = Array.isArray(res) ? res : (res?.data || []);
        this.loadingGroups = false;
      },
      error: (err: any) => {
        this.groupsError = err?.error?.message || err?.message || 'No se pudieron cargar los grupos';
        this.loadingGroups = false;
        console.error('loadSharedAccounts error', err);
      },
    });
  }

  createGroup() {
    const nombre = prompt('Nombre del nuevo grupo:');
    if (!nombre) return;
    const user = this.auth.getUser();
    const payload: any = { nombre };
    if (user?._id) payload.creador = user._id;

    this.auth.createSharedAccount(payload).subscribe({
      next: (res: any) => {
        // refresh list
        this.loadSharedAccounts();
      },
      error: (err: any) => {
        alert('No se pudo crear el grupo: ' + (err?.error?.message || err?.message || 'Error'));
        console.error('createGroup error', err);
      },
    });
  }

  joinGroup() {
    const id = prompt('Introduce el id del grupo al que quieres unirte:');
    if (!id) return;
    const user = this.auth.getUser();
    this.groupsError = null;
    this.loadingGroups = true;

    // reload accounts to find the target
    this.auth.getSharedAccounts().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        const target = list.find((g: any) => (g._id || g.id) === id);
        if (!target) {
          this.groupsError = 'Grupo no encontrado';
          this.loadingGroups = false;
          return;
        }

        const miembros = Array.isArray(target.miembros) ? [...target.miembros] : [];
        const uid = user?._id || user?.id;
        if (!uid) {
          this.groupsError = 'Usuario no identificado';
          this.loadingGroups = false;
          return;
        }
        if (!miembros.includes(uid)) miembros.push(uid);

        const updated = { ...target, miembros };
        this.auth.updateSharedAccount(target._id || target.id, updated).subscribe({
          next: () => {
            this.loadSharedAccounts();
          },
          error: (err: any) => {
            this.groupsError = err?.error?.message || err?.message || 'No se pudo unirse al grupo';
            this.loadingGroups = false;
            console.error('joinGroup error', err);
          },
        });
      },
      error: (err: any) => {
        this.groupsError = err?.error?.message || err?.message || 'No se pudieron cargar los grupos';
        this.loadingGroups = false;
      },
    });
  }

  clearSignupError() {
    this.signupError = null;
  }

  clearSigninError() {
    this.signinError = null;
  }

  openGroup(g: any) {
    // minimal action for now: show details in an alert. Could navigate to a detail route later.
    window.alert(`Grupo: ${g.nombre}\nID: ${g._id}\nDescripción: ${g.descripcion || '—'}`);
  }

  createGroupFromForm() {
    if (!this.createName || !this.createName.trim()) {
      this.groupsError = 'Introduce un nombre para el grupo.';
      return;
    }
    this.createLoading = true;
    const user = this.auth.getUser();
    const payload: any = { nombre: this.createName.trim(), fecha_creacion: new Date() };
    if (user?._id) payload.creador = user._id;

    this.auth.createSharedAccount(payload).subscribe({
      next: () => {
        this.createLoading = false;
        this.createName = '';
        this.createFormVisible = false;
        this.loadSharedAccounts();
      },
      error: (err: any) => {
        this.createLoading = false;
        this.groupsError = err?.error?.message || err?.message || 'No se pudo crear el grupo';
        console.error('createGroupFromForm error', err);
      },
    });
  }

  joinGroupFromForm() {
    if (!this.joinId || !this.joinId.trim()) {
      this.groupsError = 'Introduce el id del grupo.';
      return;
    }
    this.joinLoading = true;
    const uid = this.auth.getUser()?._id || this.auth.getUser()?.id;
    if (!uid) {
      this.groupsError = 'Usuario no identificado.';
      this.joinLoading = false;
      return;
    }

    this.auth.getSharedAccounts().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        const target = list.find((g: any) => (g._id || g.id) === this.joinId.trim());
        if (!target) {
          this.groupsError = 'Grupo no encontrado';
          this.joinLoading = false;
          return;
        }
        const miembros = Array.isArray(target.miembros) ? [...target.miembros] : [];
        if (!miembros.includes(uid)) miembros.push(uid);
        const updated = { ...target, miembros };
        this.auth.updateSharedAccount(target._id || target.id, updated).subscribe({
          next: () => {
            this.joinLoading = false;
            this.joinId = '';
            this.joinFormVisible = false;
            this.loadSharedAccounts();
          },
          error: (err: any) => {
            this.groupsError = err?.error?.message || err?.message || 'No se pudo unir al grupo';
            this.joinLoading = false;
            console.error('joinGroupFromForm error', err);
          },
        });
      },
      error: (err: any) => {
        this.groupsError = err?.error?.message || err?.message || 'No se pudieron cargar los grupos';
        this.joinLoading = false;
      },
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
