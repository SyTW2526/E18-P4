import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { LanguageService } from '../core/language.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-join-group',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  template: `
    <section style="max-width:600px; margin:4rem auto; padding:1.5rem">
      <!-- Loading State -->
      <mat-card *ngIf="loading" style="padding:3rem; text-align:center">
        <mat-spinner style="margin:0 auto 1.5rem"></mat-spinner>
        <h2>{{ lang.t('joiningGroup') || 'Uniéndote al grupo' }}...</h2>
      </mat-card>

      <!-- Success State -->
      <mat-card
        *ngIf="!loading && success"
        style="padding:3rem; text-align:center"
      >
        <mat-icon
          style="font-size:64px; width:64px; height:64px; color:#22c55e; margin-bottom:1rem"
          >check_circle</mat-icon
        >
        <h2 style="margin:0 0 1rem">
          {{ lang.t('joinSuccess') || '¡Te has unido al grupo!' }}
        </h2>
        <p style="color:var(--text-muted); margin-bottom:2rem">
          {{ successMessage }}
        </p>
        <div style="display:flex; gap:1rem; justify-content:center">
          <button mat-button (click)="goToHome()">
            {{ lang.t('goToGroups') || 'Ver grupos' }}
          </button>
          <button
            mat-flat-button
            color="primary"
            (click)="goToGroup()"
            *ngIf="groupId"
          >
            {{ lang.t('goToGroup') || 'Ir al grupo' }}
          </button>
        </div>
      </mat-card>

      <!-- Error State -->
      <mat-card
        *ngIf="!loading && error"
        style="padding:3rem; text-align:center"
      >
        <mat-icon
          style="font-size:64px; width:64px; height:64px; color:#ef4444; margin-bottom:1rem"
          >error</mat-icon
        >
        <h2 style="margin:0 0 1rem">
          {{ lang.t('joinError') || 'Error al unirse' }}
        </h2>
        <p style="color:var(--text-muted); margin-bottom:2rem">{{ error }}</p>
        <div style="display:flex; gap:1rem; justify-content:center">
          <button mat-flat-button color="primary" (click)="goToHome()">
            {{ lang.t('goToHome') || 'Ir al inicio' }}
          </button>
        </div>
      </mat-card>

      <!-- Not Logged In -->
      <mat-card
        *ngIf="!loading && !isLoggedIn"
        style="padding:3rem; text-align:center"
      >
        <mat-icon
          style="font-size:64px; width:64px; height:64px; color:#fbbf24; margin-bottom:1rem"
          >info</mat-icon
        >
        <h2 style="margin:0 0 1rem">
          {{ lang.t('loginRequired') || 'Inicia sesión para continuar' }}
        </h2>
        <p style="color:var(--text-muted); margin-bottom:2rem">
          {{
            lang.t('loginRequiredMessage') ||
              'Debes iniciar sesión para unirte a un grupo'
          }}
        </p>
        <div style="display:flex; gap:1rem; justify-content:center">
          <button mat-button (click)="goToRegister()">
            {{ lang.t('register') || 'Registrarse' }}
          </button>
          <button mat-flat-button color="primary" (click)="goToLogin()">
            {{ lang.t('login') || 'Iniciar sesión' }}
          </button>
        </div>
      </mat-card>
    </section>
  `,
  styles: [
    `
      :host {
        display: block;
        min-height: 100vh;
        background: var(--main-bg);
      }
    `,
  ],
})
export class JoinGroupComponent implements OnInit {
  token: string = '';
  loading: boolean = false;
  success: boolean = false;
  error: string = '';
  successMessage: string = '';
  groupId: string = '';
  isLoggedIn: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    public lang: LanguageService,
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';

    // Verificar si el usuario está logueado
    const user = this.auth.getUser();
    this.isLoggedIn = !!user;

    if (!this.isLoggedIn) {
      // Guardar el token en sessionStorage para usarlo después del login
      if (this.token) {
        sessionStorage.setItem('pendingInviteToken', this.token);
      }
      return;
    }

    if (this.token) {
      this.joinGroup();
    } else {
      this.error =
        this.lang.t('invalidLink') || 'Enlace de invitación inválido';
    }
  }

  joinGroup(): void {
    const user = this.auth.getUser();
    const userId = user?._id || user?.id;

    if (!userId) {
      this.error = this.lang.t('userNotFound') || 'Usuario no autenticado';
      return;
    }

    this.loading = true;
    this.error = '';

    this.auth.joinGroupWithLink(this.token, String(userId)).subscribe({
      next: (response: any) => {
        this.loading = false;
        this.success = true;
        this.groupId = response.id_grupo;
        this.successMessage =
          response.message || 'Te has unido al grupo exitosamente';

        // Limpiar el token pendiente si existe
        sessionStorage.removeItem('pendingInviteToken');
      },
      error: (err: any) => {
        this.loading = false;
        this.success = false;

        const errorMsg =
          err?.error?.message || err?.message || 'Error desconocido';

        // Mensajes personalizados según el error
        if (errorMsg.includes('expirado')) {
          this.error =
            this.lang.t('linkExpired') ||
            'Este enlace de invitación ha expirado';
        } else if (errorMsg.includes('máximo de usos')) {
          this.error =
            this.lang.t('linkMaxUses') ||
            'Este enlace ha alcanzado el número máximo de usos';
        } else if (errorMsg.includes('inválido')) {
          this.error =
            this.lang.t('invalidLinkMessage') ||
            'El enlace de invitación no es válido';
        } else {
          this.error = errorMsg;
        }
      },
    });
  }

  goToHome(): void {
    this.router.navigate(['/home']);
  }

  goToGroup(): void {
    if (this.groupId) {
      this.router.navigate(['/account', this.groupId]);
    }
  }

  goToLogin(): void {
    // Guardar el token para redirigir después del login
    if (this.token) {
      sessionStorage.setItem('pendingInviteToken', this.token);
    }
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    // Guardar el token para redirigir después del registro
    if (this.token) {
      sessionStorage.setItem('pendingInviteToken', this.token);
    }
    this.router.navigate(['/register']);
  }
}
