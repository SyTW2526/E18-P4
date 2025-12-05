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
import { ThemeService } from '../core/theme.service';
import { LanguageService } from '../core/language.service';

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
    <section style="transform:translateY(2rem)">
      <mat-card style="width: 480px;">
      <mat-card-title>{{ lang.t('userSettings') }}</mat-card-title>
      <mat-card-content>
        <form [formGroup]="form" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label>{{ lang.t('nombre') }}</label>
            <mat-form-field appearance="fill" class="full-width">
              <input matInput formControlName="nombre" />
            </mat-form-field>
          </div>

          <div class="form-group">
            <label>{{ lang.t('email') }}</label>
            <mat-form-field appearance="fill" class="full-width">
              <input matInput formControlName="email" />
            </mat-form-field>
          </div>

          <div class="form-group">
            <label>{{ lang.t('theme') }}</label>
            <mat-form-field appearance="fill" class="full-width">
              <mat-select formControlName="preferencia_tema">
                <mat-option value="light">{{ lang.t('light') }}</mat-option>
                <mat-option value="dark">{{ lang.t('dark') }}</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:1rem;">
            <button mat-button type="button" (click)="cancel()">{{ lang.t('cancel') }}</button>
            <button mat-flat-button color="primary" type="submit" [disabled]="form.invalid">{{ lang.t('save') }}</button>
          </div>
          <div style="display:flex;gap:8px;justify-content:flex-start;margin-top:1rem;">
            <button mat-stroked-button style="color:#d32f2f;border-color:#d32f2f" type="button" (click)="confirmDelete()">{{ lang.t('deleteAccount') }}</button>
          </div>
        </form>
      </mat-card-content>
    </mat-card>
    </section>
  `,
  styles: [
    `
      .full-width { width: 100%; }
      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }
      .form-group label {
        color: var(--text-muted, #a1a1aa);
        font-size: 0.875rem;
        font-weight: 500;
      }
      ::ng-deep .mat-mdc-form-field-label {
        display: none !important;
      }
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

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private theme: ThemeService, public lang: LanguageService) {}

  ngOnInit(): void {
    const u = this.auth.getUser();
    if (u && u._id) {
      this.userId = u._id;
      // try to fetch fresh data
      if (this.userId) {
        this.auth.getUserById(this.userId).subscribe({
        next: (data) => {
          const theme = data.preferencia_tema === 'oscuro' ? 'dark' : (data.preferencia_tema === 'claro' ? 'light' : (data.preferencia_tema || 'light'));
          this.form.patchValue({
            nombre: data.nombre ?? data.name ?? '',
            email: data.email ?? '',
            preferencia_tema: theme,
          });
        },
        error: () => {
          // fallback to local data
          const ut = u.preferencia_tema === 'oscuro' ? 'dark' : (u.preferencia_tema === 'claro' ? 'light' : (u.preferencia_tema || 'light'));
          this.form.patchValue({
            nombre: u.nombre ?? u.name ?? '',
            email: u.email ?? '',
            preferencia_tema: ut,
          });
        },
        });
      }
    }

    // apply theme when user changes selection in the form
    this.form.get('preferencia_tema')?.valueChanges.subscribe((v) => {
      if (v === 'dark' || v === 'light') {
        try { this.theme.applyTheme(v); } catch(e) { /* noop */ }
      }
    });
  }

  onSubmit() {
    if (!this.userId) return;
    const payload = this.form.value;
    this.auth.updateUser(this.userId, payload).subscribe({
      next: () => {
        // apply selected theme immediately
        const t = payload?.preferencia_tema;
        if (t === 'dark' || t === 'light') {
          try { this.theme.applyTheme(t); } catch(e) {}
        }
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
