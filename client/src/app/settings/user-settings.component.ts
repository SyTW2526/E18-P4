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

import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule,
  ],
  template: `
    <section style="transform:translateY(2rem)">
      <mat-card style="width: 600px; min-height: 320px; display: flex; flex-direction: row; align-items: flex-start; padding: 2rem 1.5rem; gap: 2rem;">
        <div class="avatar-col">
          <div class="avatar-box">
            <img *ngIf="profileImgSrc"
                 [src]="profileImgSrc"
                 alt="avatar"
                 (error)="onProfileImgError()"
                 style="width: 112px; height: 112px; min-width: 112px; min-height: 112px; max-width: 112px; max-height: 112px; border-radius: 50%; object-fit: cover; box-shadow: 0 2px 8px rgba(0,0,0,0.12); background: #222; border: 2px solid #444; display: block; margin-bottom: 0.5rem;" />
            <div *ngIf="!profileImgSrc" class="avatar-fallback">{{ fallbackInitials }}</div>
            <input #fileInput type="file" accept="image/*" hidden (change)="onFileSelected($event)" />
            <button mat-stroked-button color="primary" class="avatar-action" type="button" (click)="triggerFileInput(fileInput)">
              <mat-icon>photo_camera</mat-icon>
            </button>
          </div>
        </div>
        <div class="settings-col" style="flex:1;">
          <mat-card-title>{{ lang.t('userSettings') }}</mat-card-title>
          <mat-card-content style="width: 100%;">
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
                <mat-form-field appearance="fill" class="full-width" (click)="$event.stopPropagation(); themeOpen ? themeSelect.close() : themeSelect.open()">
                  <mat-select #themeSelect formControlName="preferencia_tema" (openedChange)="themeOpen=$event">
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
        </div>
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
      .avatar-col {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        min-width: 140px;
        max-width: 160px;
      }
      .avatar-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 100%;
        margin-bottom: 1.5rem;
        position: relative;
        z-index: 1;
        background: transparent !important;
        border: none !important;
        min-height: 140px;
        min-width: 140px;
        border-radius: 12px;
      }
      .avatar-action {
        position: absolute;
        bottom: 6px;
        right: 6px;
        width: 40px;
        height: 40px;
        min-width: 40px;
        padding: 0;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .avatar-action mat-icon {
        margin: 0;
      }
      .avatar-fallback {
        width: 112px;
        height: 112px;
        min-width: 112px;
        min-height: 112px;
        max-width: 112px;
        max-height: 112px;
        border-radius: 50%;
        background: linear-gradient(145deg, #2d2d2d, #1a1a1a);
        border: 2px solid #444;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 32px;
        color: #f5f5f5;
        letter-spacing: 1px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        margin-bottom: 0.5rem;
      }
      /* Hide any pseudo-elements that may be causing the triangle */
      ::ng-deep .avatar-box::before,
      ::ng-deep .avatar-box::after,
      ::ng-deep .avatar-col::before,
      ::ng-deep .avatar-col::after {
        display: none !important;
        content: none !important;
        background: none !important;
        border: none !important;
        box-shadow: none !important;
      }
    `,
  ],
})
export class UserSettingsComponent implements OnInit {
  profileImgSrc: string | null = null;
  fallbackInitials = '?';
  form = this.fb.group({
    nombre: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    preferencia_tema: ['light'],
  });

  userId: string | null = null;
  themeOpen = false;

  constructor(private fb: FormBuilder, public auth: AuthService, private router: Router, private theme: ThemeService, public lang: LanguageService) {}

  ngOnInit(): void {
    const u = this.auth.getUser();
    if (u && u._id) {
      this.userId = u._id;
      // Use local storage data directly to avoid 401 error
      const ut = u.preferencia_tema === 'oscuro' ? 'dark' : (u.preferencia_tema === 'claro' ? 'light' : (u.preferencia_tema || 'light'));
      this.form.patchValue({
        nombre: u.nombre ?? u.name ?? '',
        email: u.email ?? '',
        preferencia_tema: ut,
      });
      const img = u.photo || u.avatar || u.picture || u.foto_perfil;
      this.profileImgSrc = (typeof img === 'string' && img.trim().length > 0) ? img : null;
      this.fallbackInitials = this.computeInitials(u.nombre || u.name || u.email || '');
    } else {
      this.profileImgSrc = null;
      this.fallbackInitials = '?';
    }

    // apply theme when user changes selection in the form
    this.form.get('preferencia_tema')?.valueChanges.subscribe((v) => {
      if (v === 'dark' || v === 'light') {
        try { this.theme.applyTheme(v); } catch(e) { /* noop */ }
      }
    });
  }

  onProfileImgError() {
    this.profileImgSrc = null;
  }

  private computeInitials(nameOrEmail: string): string {
    if (!nameOrEmail) return '?';
    const cleaned = String(nameOrEmail).trim();
    if (!cleaned) return '?';
    const parts = cleaned.split(/[\s._@-]+/).filter(Boolean);
    if (parts.length === 0) return cleaned.charAt(0).toUpperCase();
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }

  onSubmit() {
    if (!this.userId) return;
    const payload = { ...this.form.value, foto_perfil: this.profileImgSrc };
    this.auth.updateUser(this.userId, payload).subscribe({
      next: () => {
        // apply selected theme immediately and store preference
        const t = payload?.preferencia_tema;
        if (t === 'dark' || t === 'light') {
          try { 
            this.theme.applyTheme(t);
          } catch(e) {}
        }
        // persist updated avatar locally
        try {
          const current = this.auth.getUser() || {};
          const updated = { ...current, foto_perfil: payload.foto_perfil, preferencia_tema: t === 'dark' ? 'oscuro' : t === 'light' ? 'claro' : current.preferencia_tema };
          if (typeof window !== 'undefined' && window?.localStorage) {
            window.localStorage.setItem('auth_user', JSON.stringify(updated));
          }
        } catch {}
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

  triggerFileInput(input: HTMLInputElement) {
    if (input) {
      input.value = '';
      input.click();
    }
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const file = input?.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      try {
        this.profileImgSrc = await this.downscaleImage(dataUrl, 256, 0.85);
      } catch (e) {
        // fallback to original if resize fails
        this.profileImgSrc = dataUrl;
      }
    };
    reader.readAsDataURL(file);
  }

  private downscaleImage(dataUrl: string, maxSize: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject('No canvas context');

        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1);
        const w = Math.max(1, Math.round(img.width * ratio));
        const h = Math.max(1, Math.round(img.height * ratio));
        canvas.width = w;
        canvas.height = h;
        ctx.drawImage(img, 0, 0, w, h);
        const result = canvas.toDataURL('image/jpeg', quality);
        resolve(result);
      };
      img.onerror = (err) => reject(err);
      img.src = dataUrl;
    });
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
