import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { LanguageService } from '../core/language.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-group-invitations',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  template: `
    <section
      style="max-width:900px; width:100%; margin:0 auto; text-align:left; padding:1.5rem 1rem"
    >
      <div
        style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem"
      >
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 style="margin:0">
          {{ lang.t('groupInvitations') || 'Invitaciones a grupos' }}
        </h2>
      </div>

      <div *ngIf="loading" style="text-align:center; padding:2rem">
        {{ lang.t('loading') }}...
      </div>
      <div
        *ngIf="error"
        style="color:#d9534f; padding:1rem; margin-bottom:1rem"
      >
        {{ error }}
      </div>

      <div
        *ngIf="!loading && invitations.length === 0"
        style="text-align:center; padding:2rem; color:var(--text-muted)"
      >
        {{
          lang.t('noGroupInvitations') || 'No tienes invitaciones pendientes'
        }}
      </div>

      <div
        *ngIf="!loading && invitations.length > 0"
        style="display:flex; flex-direction:column; gap:12px"
      >
        <mat-card *ngFor="let inv of invitations" style="padding:0">
          <div style="padding:20px; display:flex; gap:16px; align-items:center">
            <div
              style="width:50px; height:50px; border-radius:50%; background:linear-gradient(135deg, var(--primary-color) 0%, #667eea 100%); display:flex; align-items:center; justify-content:center; color:white; font-size:20px; font-weight:700; flex-shrink:0"
            >
              {{ (inv.grupo?.nombre || 'G').charAt(0).toUpperCase() }}
            </div>
            <div style="flex:1; min-width:0">
              <div style="font-weight:600; font-size:1.1rem; margin-bottom:4px">
                {{ inv.grupo?.nombre || 'Grupo' }}
              </div>
              <div style="font-size:0.9rem; color:var(--text-muted)">
                Invitado por
                <strong>{{
                  inv.invitador?.nombre || inv.invitador?.email || 'Usuario'
                }}</strong>
              </div>
              <div
                style="font-size:0.85rem; color:var(--text-muted); margin-top:2px"
              >
                {{ inv.fecha_invitacion | date: 'dd/MM/yyyy HH:mm' }}
              </div>
            </div>
            <div style="display:flex; gap:8px; flex-shrink:0">
              <button
                mat-flat-button
                color="primary"
                (click)="acceptInvitation(inv)"
                [disabled]="inv.processing"
              >
                {{
                  inv.processing
                    ? lang.t('loading') + '...'
                    : lang.t('accept') || 'Aceptar'
                }}
              </button>
              <button
                mat-stroked-button
                (click)="rejectInvitation(inv)"
                [disabled]="inv.processing"
              >
                {{ lang.t('reject') || 'Rechazar' }}
              </button>
            </div>
          </div>
        </mat-card>
      </div>
    </section>
  `,
})
export class GroupInvitationsComponent implements OnInit {
  invitations: any[] = [];
  loading = false;
  error: string | null = null;

  constructor(
    private auth: AuthService,
    private router: Router,
    public lang: LanguageService,
  ) {}

  ngOnInit(): void {
    this.loadInvitations();
  }

  loadInvitations() {
    this.loading = true;
    this.error = null;

    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) {
      this.error = 'No autenticado';
      this.loading = false;
      return;
    }

    this.auth.getGroupInvitationsForUser(String(myId)).subscribe({
      next: (invitations) => {
        this.invitations = invitations.map((inv) => ({
          ...inv,
          processing: false,
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error al cargar invitaciones';
        this.loading = false;
      },
    });
  }

  acceptInvitation(inv: any) {
    if (!inv || inv.processing) return;
    inv.processing = true;

    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) {
      inv.processing = false;
      return;
    }

    this.auth.acceptGroupInvitation(inv._id, String(myId)).subscribe({
      next: () => {
        this.loadInvitations();
      },
      error: (err) => {
        inv.processing = false;
        this.error = err?.error?.message || 'Error al aceptar invitación';
      },
    });
  }

  rejectInvitation(inv: any) {
    if (!inv || inv.processing) return;
    inv.processing = true;

    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) {
      inv.processing = false;
      return;
    }

    this.auth.rejectGroupInvitation(inv._id, String(myId)).subscribe({
      next: () => {
        this.loadInvitations();
      },
      error: (err) => {
        inv.processing = false;
        this.error = err?.error?.message || 'Error al rechazar invitación';
      },
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
