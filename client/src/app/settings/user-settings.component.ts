import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormsModule } from '@angular/forms';
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
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
  ],
  templateUrl: './user-settings.component.html',
  styleUrls: ['./user-settings.component.css'],
})
export class UserSettingsComponent implements OnInit {
  profileImgSrc: string | null = null;
  fallbackInitials = '?';
  selectedTheme: 'light' | 'dark' = 'light';
  form = this.fb.group({
    nombre: ['', Validators.required],
    preferencia_tema: ['light'],
    moneda_preferida: ['EUR'],
  });

  userId: string | null = null;

  currencyOptions = [
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'GBP', label: 'British Pound', symbol: '£' },
  ];

  constructor(private fb: FormBuilder, public auth: AuthService, private router: Router, private theme: ThemeService, public lang: LanguageService) {}

  ngOnInit(): void {
    const u = this.auth.getUser();
    if (u && u._id) {
      this.userId = u._id;
      // Use local storage data directly to avoid 401 error
      const ut = u.preferencia_tema === 'oscuro' ? 'dark' : (u.preferencia_tema === 'claro' ? 'light' : (u.preferencia_tema || 'light'));
      this.selectedTheme = ut;
      this.form.patchValue({
        nombre: u.nombre ?? u.name ?? '',
        preferencia_tema: ut,
        moneda_preferida: u.moneda_preferida || 'EUR',
      });
      const img = u.photo || u.avatar || u.picture || u.foto_perfil;
      this.profileImgSrc = (typeof img === 'string' && img.trim().length > 0) ? img : null;
      this.fallbackInitials = this.computeInitials(u.nombre || u.name || u.email || '');
    } else {
      this.profileImgSrc = null;
      this.fallbackInitials = '?';
    }
  }

  onThemeChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as 'light' | 'dark';
    this.form.patchValue({ preferencia_tema: value });
    if (value === 'dark' || value === 'light') {
      try { this.theme.applyTheme(value); } catch(e) { /* noop */ }
    }
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
