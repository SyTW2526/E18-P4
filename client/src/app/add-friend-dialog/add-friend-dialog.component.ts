import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth/auth.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { LanguageService } from '../core/language.service';

@Component({
  selector: 'app-add-friend-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatSnackBarModule,
  ],
  template: `
    <ng-container *ngIf="!success; else successTpl">
      <h2 mat-dialog-title>{{ lang.t('addFriend') || 'Añadir amigo' }}</h2>
      <mat-dialog-content>
        <mat-form-field appearance="fill" style="width:100%">
          <mat-label>{{ lang.t('username') || 'Nombre de usuario' }}</mat-label>
          <input
            matInput
            [(ngModel)]="username"
            [placeholder]="lang.t('username') || 'username'"
            autofocus
          />
        </mat-form-field>
        <div
          *ngIf="errorMsg"
          style="color:var(--primary-color); font-weight:600; margin-top:8px"
        >
          {{ errorMsg }}
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button (click)="onCancel()" [disabled]="loading">
          {{ lang.t('cancel') || 'Cancelar' }}
        </button>
        <button
          mat-flat-button
          color="primary"
          (click)="onAdd()"
          [disabled]="loading || !username || !username.trim()"
        >
          {{ loading ? lang.t('sending') + '...' : lang.t('add') || 'Añadir' }}
        </button>
      </mat-dialog-actions>
    </ng-container>
    <ng-template #successTpl>
      <div style="padding:24px; text-align:center; min-width:240px;">
        <h3 style="color:var(--primary-color)">
          {{ lang.t('requestSent') || 'Solicitud enviada' }}
        </h3>
        <p style="color:var(--text-main)">
          {{
            lang.t('friendRequestSent') ||
              'La solicitud de amistad se ha enviado correctamente.'
          }}
        </p>
        <div
          style="margin-top:16px; display:flex; gap:8px; justify-content:center"
        >
          <button mat-button (click)="onClose()">
            {{ lang.t('close') || 'Cerrar' }}
          </button>
        </div>
      </div>
    </ng-template>
  `,
})
export class AddFriendDialogComponent {
  username = '';
  loading = false;
  errorMsg = '';
  success = false;

  constructor(
    private dialogRef: MatDialogRef<AddFriendDialogComponent>,
    private auth: AuthService,
    private snack: MatSnackBar,
    public lang: LanguageService,
  ) {}

  onCancel() {
    if (this.loading) return;
    this.dialogRef.close(null);
  }

  onClose() {
    this.dialogRef.close(true);
  }

  onAdd() {
    const v = String(this.username || '').trim();
    if (!v) return;
    this.errorMsg = '';
    this.loading = true;

    this.auth.findUserByUsername(v).subscribe({
      next: (users: any[]) => {
        const match = (users || []).find(
          (u) =>
            String(u.nombre || u.username || u.email).toLowerCase() ===
            String(v).toLowerCase(),
        );
        if (!match) {
          this.errorMsg = 'Usuario no encontrado';
          this.loading = false;
          return;
        }
        const receiverId = match._id || match.id;
        const me = this.auth.getUser();
        const senderId = me?._id || me?.id;
        if (!senderId) {
          this.errorMsg = 'No autenticado';
          this.loading = false;
          return;
        }

        this.auth.addAmigo(String(receiverId), String(senderId)).subscribe({
          next: () => {
            this.loading = false;
            this.success = true;
          },
          error: (err) => {
            console.error(err);
            this.errorMsg =
              err?.error?.message ||
              err?.message ||
              'Error al enviar la solicitud';
            this.loading = false;
          },
        });
      },
      error: (err) => {
        console.error(err);
        this.errorMsg =
          err?.error?.message || err?.message || 'Error buscando usuario';
        this.loading = false;
      },
    });
  }
}
