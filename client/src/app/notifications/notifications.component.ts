import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService, Notification } from '../core/notification.service';
import { LanguageService } from '../core/language.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatBadgeModule } from '@angular/material/badge';
import { forkJoin, interval, Subscription } from 'rxjs';
import { switchMap, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatBadgeModule],
  template: `
    <section style="max-width:800px;margin:0 auto;padding:1.5rem;min-height:calc(100vh - 120px)">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <button mat-icon-button (click)="goBack()">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h2 style="margin:0;flex:1">{{ lang.t('notifications') || 'Notificaciones' }}</h2>
        <button mat-icon-button (click)="loadNotifications()" [disabled]="loading">
          <mat-icon>refresh</mat-icon>
        </button>
      </div>

      <div *ngIf="loading" style="text-align:center;padding:2rem;color:#999">
        Cargando notificaciones...
      </div>

      <div *ngIf="error" style="padding:1rem;background:#f443;border-radius:6px;color:crimson;margin-bottom:1rem">
        {{ error }}
      </div>

      <div *ngIf="!loading && notifications.length === 0" style="text-align:center;padding:2rem;color:#999">
        No tienes notificaciones
      </div>

      <div *ngIf="!loading && notifications.length > 0" style="display:flex;flex-direction:column;gap:1rem">
        <mat-card *ngFor="let notif of notifications" 
                  [style.background]="notif.leida ? '#1a1a1a' : '#2a2a2a'"
                  [style.border-left]="notif.leida ? '4px solid #555' : '4px solid #22c55e'">
          <div style="display:flex;gap:1rem;align-items:flex-start">
            <!-- Icono según tipo -->
            <mat-icon [style.color]="getIconColor(notif.tipo)" style="margin-top:4px">
              {{ getIcon(notif.tipo) }}
            </mat-icon>
            
            <div style="flex:1">
              <!-- Título de la notificación -->
              <div style="font-weight:600;font-size:1rem;color:#e0e0e0;margin-bottom:0.5rem">
                {{ getTitle(notif) }}
              </div>
              
              <!-- Mensaje/detalles -->
              <div style="font-size:0.9rem;color:#999;margin-bottom:0.5rem">
                {{ getMessage(notif) }}
              </div>
              
              <!-- Fecha -->
              <div style="font-size:0.8rem;color:#666">
                {{ formatDate(notif.fecha) }}
              </div>
              
              <!-- Botones de acción -->
              <div *ngIf="notif.tipo === 'solicitud_pago' && !notif.respondida" 
                   style="display:flex;gap:0.5rem;margin-top:0.75rem">
                <button mat-raised-button color="primary" 
                        (click)="acceptPaymentRequest(notif)"
                        [disabled]="processing === notif._id">
                  <mat-icon>check</mat-icon>
                  Pagar
                </button>
                <button mat-button (click)="rejectPaymentRequest(notif)"
                        [disabled]="processing === notif._id">
                  <mat-icon>close</mat-icon>
                  Rechazar
                </button>
              </div>
              
              <div *ngIf="notif.tipo === 'solicitud_pago' && notif.respondida" 
                   style="margin-top:0.5rem;color:#22c55e;font-size:0.85rem">
                ✓ Respondida
              </div>

              <div *ngIf="notif.tipo === 'grupo_invitacion' && !notif.respondida" style="display:flex;gap:0.5rem;margin-top:0.75rem">
                <button mat-raised-button color="primary" 
                        (click)="acceptInvitation(notif)"
                        [disabled]="processing === notif._id">
                  <mat-icon>check</mat-icon>
                  {{ lang.t('accept') || 'Aceptar' }}
                </button>
                <button mat-button (click)="rejectInvitation(notif)"
                        [disabled]="processing === notif._id">
                  <mat-icon>close</mat-icon>
                  {{ lang.t('reject') || 'Rechazar' }}
                </button>
              </div>

              <div *ngIf="notif.tipo === 'solicitud_amistad' && !notif.respondida" style="display:flex;gap:0.5rem;margin-top:0.75rem">
                <button mat-raised-button color="primary" 
                        (click)="acceptFriendRequest(notif)"
                        [disabled]="processing === notif._id">
                  <mat-icon>check</mat-icon>
                  {{ lang.t('accept') || 'Aceptar' }}
                </button>
                <button mat-button (click)="rejectFriendRequest(notif)"
                        [disabled]="processing === notif._id">
                  <mat-icon>close</mat-icon>
                  {{ lang.t('reject') || 'Rechazar' }}
                </button>
              </div>

              <div *ngIf="notif.tipo === 'solicitud_amistad' && notif.respondida" 
                   style="margin-top:0.5rem;color:#22c55e;font-size:0.85rem">
                ✓ Respondida
              </div>
            </div>
            
            <!-- Botones de acción de notificación -->
            <div style="display:flex;flex-direction:column;gap:0.5rem">
              <button mat-icon-button (click)="markAsRead(notif)" 
                      *ngIf="!notif.leida"
                      [disabled]="processing === notif._id"
                      title="Marcar como leída">
                <mat-icon style="font-size:20px">done</mat-icon>
              </button>
              <button mat-icon-button (click)="deleteNotification(notif)"
                      [disabled]="processing === notif._id"
                      title="Eliminar">
                <mat-icon style="font-size:20px">delete</mat-icon>
              </button>
            </div>
          </div>
        </mat-card>
      </div>
    </section>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  loading = false;
  error = '';
  processing: string | null = null;
  private pollSubscription?: Subscription;

  constructor(
    public lang: LanguageService,
    private authService: AuthService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadNotifications();
    // Poll cada 30 segundos
    const user = this.authService.getUser();
    if (user && user._id) {
      this.pollSubscription = interval(30000)
        .pipe(
          startWith(0),
          switchMap(() => this.notificationService.getNotifications(user._id))
        )
        .subscribe({
          next: (notifs: Notification[]) => {
            this.notifications = notifs;
          },
          error: (err: any) => {
            console.error('Error polling notifications:', err);
          }
        });
    }
  }

  ngOnDestroy() {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
  }

  loadNotifications() {
    this.loading = true;
    this.error = '';
    
    const user = this.authService.getUser();
    if (!user || !user._id) {
      this.error = 'Usuario no autenticado';
      this.loading = false;
      return;
    }
    
    forkJoin({
      notifications: this.notificationService.getNotifications(user._id),
      invitations: this.authService.getGroupInvitationsForUser(user._id)
    }).subscribe({
      next: ({ notifications, invitations }) => {
        const mappedInvites: Notification[] = (invitations || []).map((inv: any) => ({
          _id: inv._id,
          tipo: 'grupo_invitacion',
          de_usuario: inv.id_invitador || inv.invitador?._id || '',
          para_usuario: user._id,
          id_grupo: inv.id_grupo || inv.grupo?._id || '',
          mensaje: inv.mensaje || `Invitación al grupo ${inv.grupo?.nombre || ''}`.trim(),
          leida: false,
          respondida: !!inv.respondida,
          fecha: inv.fecha_invitacion ? new Date(inv.fecha_invitacion) : new Date(),
          de_usuario_nombre: inv.invitador?.nombre || inv.invitador?.email,
          grupo_nombre: inv.grupo?.nombre,
        }));

        this.notifications = [...mappedInvites, ...notifications].sort((a, b) => {
          const da = new Date(a.fecha).getTime();
          const db = new Date(b.fecha).getTime();
          return db - da;
        });
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading notifications or invitations:', err);
        this.error = 'Error al cargar notificaciones';
        this.loading = false;
      }
    });
  }

  getIcon(tipo: string): string {
    switch (tipo) {
      case 'solicitud_pago': return 'request_quote';
      case 'pago_confirmado': return 'check_circle';
      case 'gasto_creado': return 'receipt';
      case 'grupo_invitacion': return 'group_add';
      case 'solicitud_amistad': return 'person_add';
      default: return 'notifications';
    }
  }

  getIconColor(tipo: string): string {
    switch (tipo) {
      case 'solicitud_pago': return '#fbbf24';
      case 'pago_confirmado': return '#22c55e';
      case 'gasto_creado': return '#3b82f6';
      case 'grupo_invitacion': return '#a855f7';
      case 'solicitud_amistad': return '#ec4899';
      default: return '#999';
    }
  }

  getTitle(notif: Notification): string {
    switch (notif.tipo) {
      case 'solicitud_pago':
        return 'Solicitud de pago';
      case 'pago_confirmado':
        return 'Pago confirmado';
      case 'gasto_creado':
        return 'Nuevo gasto';
      case 'grupo_invitacion':
        return 'Invitación a grupo';
      case 'solicitud_amistad':
        return 'Solicitud de amistad';
      default:
        return 'Notificación';
    }
  }

  getMessage(notif: Notification): string {
    if (notif.mensaje) {
      return notif.mensaje;
    }
    
    switch (notif.tipo) {
      case 'solicitud_pago':
        return `Te solicitan el pago de ${notif.monto?.toFixed(2) || '0.00'}`;
      case 'pago_confirmado':
        return `Pago de ${notif.monto?.toFixed(2) || '0.00'} confirmado`;
      case 'gasto_creado':
        return 'Se ha creado un nuevo gasto en el grupo';
      case 'grupo_invitacion':
        return 'Te han invitado a unirte a un grupo';
      case 'solicitud_amistad':
        return 'Te ha enviado una solicitud de amistad';
      default:
        return '';
    }
  }

  formatDate(fecha: Date): string {
    const date = new Date(fecha);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes} min`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;
    
    return date.toLocaleDateString('es-ES', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  acceptPaymentRequest(notif: Notification) {
    if (!notif._id) return;
    
    this.processing = notif._id;
    
    // Marcar como respondida
    this.notificationService.markAsResponded(notif._id)
      .subscribe({
        next: () => {
          // Navegar al balance para realizar el pago
          this.router.navigate(['/group', notif.id_grupo, 'balance']);
          this.processing = null;
        },
        error: (err: any) => {
          console.error('Error accepting payment request:', err);
          this.error = 'Error al aceptar solicitud';
          this.processing = null;
        }
      });
  }

  rejectPaymentRequest(notif: Notification) {
    if (!notif._id) return;
    
    this.processing = notif._id;
    
    // Simplemente marcar como respondida sin navegar
    this.notificationService.markAsResponded(notif._id)
      .subscribe({
        next: () => {
          this.loadNotifications();
          this.processing = null;
        },
        error: (err) => {
          console.error('Error rejecting payment request:', err);
          this.error = 'Error al rechazar solicitud';
          this.processing = null;
        }
      });
  }

  acceptInvitation(notif: Notification) {
    if (!notif._id) return;
    const user = this.authService.getUser();
    const userId = user?._id || user?.id;
    if (!userId) return;

    this.processing = notif._id;
    this.authService.acceptGroupInvitation(notif._id, String(userId)).subscribe({
      next: () => {
        notif.respondida = true;
        this.loadNotifications();
        this.processing = null;
      },
      error: (err) => {
        console.error('Error accepting invitation:', err);
        this.error = 'Error al aceptar invitación';
        this.processing = null;
      },
    });
  }

  rejectInvitation(notif: Notification) {
    if (!notif._id) return;
    const user = this.authService.getUser();
    const userId = user?._id || user?.id;
    if (!userId) return;

    this.processing = notif._id;
    this.authService.rejectGroupInvitation(notif._id, String(userId)).subscribe({
      next: () => {
        // Remove the invitation from the list
        this.notifications = this.notifications.filter(n => n._id !== notif._id);
        this.processing = null;
      },
      error: (err) => {
        console.error('Error rejecting invitation:', err);
        this.error = 'Error al rechazar invitación';
        this.processing = null;
      },
    });
  }

  acceptFriendRequest(notif: Notification) {
    if (!notif._id) return;
    const user = this.authService.getUser();
    const userId = user?._id || user?.id;
    if (!userId) return;

    this.processing = notif._id;
    // de_usuario es quien envió la solicitud
    const senderId = String(notif.de_usuario);
    
    this.authService.acceptAmigo(userId, senderId).subscribe({
      next: () => {
        notif.respondida = true;
        // Marcar como leída también
        if (notif._id) {
          this.notificationService.markAsRead(notif._id).subscribe();
        }
        this.loadNotifications();
        this.processing = null;
      },
      error: (err) => {
        console.error('Error accepting friend request:', err);
        this.error = 'Error al aceptar solicitud de amistad';
        this.processing = null;
      },
    });
  }

  rejectFriendRequest(notif: Notification) {
    if (!notif._id) return;
    const user = this.authService.getUser();
    const userId = user?._id || user?.id;
    if (!userId) return;

    this.processing = notif._id;
    // de_usuario es quien envió la solicitud
    const senderId = String(notif.de_usuario);
    
    this.authService.rejectAmigo(userId, senderId).subscribe({
      next: () => {
        notif.respondida = true;
        // Eliminar la notificación después de rechazar
        this.notifications = this.notifications.filter(n => n._id !== notif._id);
        this.processing = null;
      },
      error: (err) => {
        console.error('Error rejecting friend request:', err);
        this.error = 'Error al rechazar solicitud de amistad';
        this.processing = null;
      },
    });
  }

  markAsRead(notif: Notification) {
    if (!notif._id) return;
    
    this.processing = notif._id;
    
    this.notificationService.markAsRead(notif._id)
      .subscribe({
        next: () => {
          notif.leida = true;
          this.processing = null;
        },
        error: (err) => {
          console.error('Error marking as read:', err);
          this.processing = null;
        }
      });
  }

  deleteNotification(notif: Notification) {
    if (!notif._id) return;
    
    this.processing = notif._id;
    
    this.notificationService.deleteNotification(notif._id)
      .subscribe({
        next: () => {
          this.notifications = this.notifications.filter(n => n._id !== notif._id);
          this.processing = null;
        },
        error: (err) => {
          console.error('Error deleting notification:', err);
          this.error = 'Error al eliminar notificación';
          this.processing = null;
        }
      });
  }

  goBack() {
    this.router.navigate(['/home']);
  }
}
