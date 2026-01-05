import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Notification {
  _id?: string;
  tipo: 'solicitud_pago' | 'pago_confirmado' | 'gasto_creado' | 'grupo_invitacion' | 'solicitud_amistad';
  de_usuario: string;
  para_usuario: string;
  id_grupo?: string; // opcional para solicitudes de amistad
  monto?: number;
  id_gasto?: string;
  mensaje?: string;
  leida: boolean;
  respondida?: boolean;
  fecha: Date;
  // Datos adicionales que pueden venir poblados del backend
  de_usuario_nombre?: string;
  de_usuario_email?: string;
  grupo_nombre?: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = 'http://localhost:5200/notifications';

  constructor(private http: HttpClient) {}

  getNotifications(userId: string): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${this.apiUrl}/${userId}`);
  }

  getUnreadCount(userId: string): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(`${this.apiUrl}/${userId}/unread`);
  }

  createNotification(notification: {
    tipo: string;
    de_usuario: string;
    para_usuario: string;
    id_grupo: string;
    monto?: number;
    id_gasto?: string;
    mensaje?: string;
  }): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, notification);
  }

  markAsRead(notificationId: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAsResponded(notificationId: string): Observable<{ success: boolean }> {
    return this.http.patch<{ success: boolean }>(`${this.apiUrl}/${notificationId}/respond`, {});
  }

  deleteNotification(notificationId: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.apiUrl}/${notificationId}`);
  }
}
