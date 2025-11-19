import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { AuthService } from '../auth/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-settings',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
  ],
  template: `
    <mat-card style="width: 480px;">
      <mat-card-title>Configuración de usuario</mat-card-title>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Nombre</mat-label>
            <input matInput formControlName="nombre" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Email</mat-label>
            <input matInput formControlName="email" />
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Tema</mat-label>
            <mat-select formControlName="preferencia_tema">
              <mat-option value="light">Claro</mat-option>
              <mat-option value="dark">Oscuro</mat-option>
            </mat-select>
          </mat-form-field>

          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:1rem;">
            <button mat-button type="button" (click)="cancel()">Cancelar</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">Guardar</button>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-start;margin-top:1rem;">
            <button mat-stroked-button color="warn" type="button" (click)="confirmDelete()">Eliminar cuenta</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
  `,
  styles: [
    `
      .full-width { width: 100%; }
    `,
  ],
})
export class UserSettingsComponent implements OnInit {
  form = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    preferencia_tema: ['light'],
  });

  userId: string | null = null;

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    const u = this.auth.getUser();
    if (u && u._id) {
      this.userId = u._id;
      // try to fetch fresh data
      if (this.userId) {
        this.auth.getUserById(this.userId).subscribe({
        next: (data) => {
          this.form.patchValue({
            nombre: data.nombre ?? data.name ?? '',
            email: data.email ?? '',
            preferencia_tema: data.preferencia_tema ?? 'light',
          });
        },
        error: () => {
          // fallback to local data
          this.form.patchValue({
            nombre: u.nombre ?? u.name ?? '',
            email: u.email ?? '',
            preferencia_tema: u.preferencia_tema ?? 'light',
          });
        },
        });
      }
    }
  }

  onSubmit() {
    if (!this.userId) return;
    const payload = this.form.value;
    this.auth.updateUser(this.userId, payload).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Failed to update user', err);
        alert('Error al guardar cambios');
      },
    });
  }

  cancel() {
    this.router.navigate(['/home']);
  }

  confirmDelete() {
    const ok = window.confirm('¿Estás seguro? Esta acción eliminará tu cuenta permanentemente.');
    if (!ok) return;
    this.deleteAccount();
  }

  deleteAccount() {
    if (!this.userId) return;
    this.auth.deleteUser(this.userId).subscribe({
      next: () => {
        try {
          this.auth.logout();
        } catch (e) {
          console.warn('Logout failed after delete', e);
        }
        // send user to register or login; force reload to clear any in-memory state
        try {
          this.router.navigate(['/login']).then(() => {
            // ensure full reload
            window.location.href = '/login';
          });
        } catch (e) {
          window.location.href = '/login';
        }
      },
      error: (err) => {
        console.error('Failed to delete account', err);
        // show server-provided message when possible
        const msg = err?.error || err?.message || JSON.stringify(err);
        alert(`No se pudo eliminar la cuenta: ${msg}`);
      },
    });
  }
}
