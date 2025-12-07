import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { switchMap } from 'rxjs/operators';

export interface AuthResponse {
  user: any;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  // When running the client in browser, backend is available at localhost:5200
  private baseUrl = 'http://localhost:5200';

  constructor(private http: HttpClient) {}

  signup(payload: { nombre: string; email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/users/signup`, payload).pipe(
      tap((res) => this.saveAuth(res))
    );
  }

  signin(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/users/signin`, payload).pipe(
      tap((res) => this.saveAuth(res))
    );
  }

  private saveAuth(res: AuthResponse) {
    try {
      if (typeof window !== 'undefined' && window?.localStorage) {
        window.localStorage.setItem('auth_token', res.token);
        window.localStorage.setItem('auth_user', JSON.stringify(res.user));
      } else {
        // running on server or environment without localStorage
        console.warn('localStorage not available, skipping saveAuth');
      }
    } catch (e) {
      console.warn('Failed to save auth to localStorage', e);
    }
  }

  logout() {
    try {
      if (typeof window !== 'undefined' && window?.localStorage) {
        window.localStorage.removeItem('auth_token');
        window.localStorage.removeItem('auth_user');
      }
    } catch (e) {
      console.warn('Failed to clear auth from localStorage', e);
    }
  }

  isLoggedIn(): boolean {
    try {
      if (typeof window === 'undefined' || !window?.localStorage) return false;
      return !!window.localStorage.getItem('auth_token');
    } catch (e) {
      return false;
    }
  }

  getUser(): any | null {
    try {
      if (typeof window === 'undefined' || !window?.localStorage) return null;
      const u = window.localStorage.getItem('auth_user');
      return u ? JSON.parse(u) : null;
    } catch (e) {
      return null;
    }
  }

  getToken(): string | null {
    try {
      if (typeof window === 'undefined' || !window?.localStorage) return null;
      return window.localStorage.getItem('auth_token');
    } catch (e) {
      return null;
    }
  }

  // Shared accounts endpoints
  getSharedAccounts() {
    return this.http.get<any[]>(`${this.baseUrl}/user-group/shared-accounts`);
  }

  createSharedAccount(payload: any) {
    return this.http.post<any>(`${this.baseUrl}/user-group/shared-accounts`, payload);
  }

  updateSharedAccount(id: string, payload: any) {
    return this.http.put<any>(`${this.baseUrl}/user-group/shared-accounts/${id}`, payload);
  }

  getSharedAccountById(id: string) {
    return this.http.get<any>(`${this.baseUrl}/user-group/shared-accounts/${id}`);
  }

  deleteSharedAccount(id: string) {
    return this.http.delete<any>(`${this.baseUrl}/user-group/shared-accounts/${id}`);
  }

  getMembersForGroup(id: string) {
    return this.http.get<any[]>(`${this.baseUrl}/user-group/shared-accounts/${id}/members`);
  }

  // Get groups (shared account documents) for a given user
  getGroupsForUser(userId: string) {
    return this.http.get<any[]>(`${this.baseUrl}/user-group/user-groups/user/${userId}`);
  }

  getBalancesForGroup(id: string) {
    return this.http.get<any[]>(`${this.baseUrl}/user-group/shared-accounts/${id}/balances`);
  }

  getDetailedBalancesForGroup(id: string) {
    return this.http.get<any[]>(`${this.baseUrl}/user-group/shared-accounts/${id}/balances-detailed`);
  }

  // User-group relations (join a group)
  createUserGroup(payload: { id_usuario: string; id_grupo: string; rol?: string }) {
    return this.http.post<any>(`${this.baseUrl}/user-group/user-groups`, payload);
  }

  getUserById(id: string) {
    return this.http.get<any>(`${this.baseUrl}/users/${id}`);
  }

  getUserBasicInfo(id: string) {
    return this.http.get<any>(`${this.baseUrl}/users/${id}/basic`);
  }

  // Get amigos (friends) list (returns { amigos: [...] })
  getAmigos(userId: string) {
    return this.http.get<any>(`${this.baseUrl}/users/${userId}/amigos`);
  }

  // Get incoming friend requests (peticiones_amistad)
  getPeticiones(userId: string) {
    return this.http.get<any>(`${this.baseUrl}/users/${userId}/peticiones-amistad`);
  }

  // Send a friend request (add senderId to receiver's peticiones_amistad)
  addAmigo(receiverId: string, senderId: string) {
    return this.http.post<any>(`${this.baseUrl}/users/${receiverId}/add-amigo`, { senderId });
  }

  // Accept a friend request (current user accepts senderId)
  acceptAmigo(receiverId: string, senderId: string) {
    return this.http.post<any>(`${this.baseUrl}/users/${receiverId}/accept-amigo`, { senderId });
  }

  // Reject a friend request (current user rejects senderId)
  rejectAmigo(receiverId: string, senderId: string) {
    return this.http.post<any>(`${this.baseUrl}/users/${receiverId}/reject-amigo`, { senderId });
  }

  // Remove a friend (delete) - requests server to remove amigoId from user's amigos list
  removeAmigo(userId: string, amigoId: string) {
    // Use HTTP request to send a DELETE with a body (some Angular versions require request() helper)
    return this.http.request('delete', `${this.baseUrl}/users/${userId}/remove-amigo`, { body: { amigoId } });
  }

  // Helper: find a user by username (server-side lookup)
  findUserByUsername(username: string) {
    return this.http.get<any[]>(`${this.baseUrl}/users/lookup?username=${encodeURIComponent(String(username))}`);
  }

  updateUser(id: string, payload: any) {
    // map client theme values to server schema ('light'/'dark' -> 'claro'/'oscuro')
    const payloadToSend = { ...payload };
    if (payloadToSend?.preferencia_tema) {
      if (payloadToSend.preferencia_tema === 'light') payloadToSend.preferencia_tema = 'claro';
      else if (payloadToSend.preferencia_tema === 'dark') payloadToSend.preferencia_tema = 'oscuro';
    }

    // After updating, update localStorage with the updated data
    return this.http.put<any>(`${this.baseUrl}/users/${id}`, payloadToSend).pipe(
      tap((updatedUser) => {
        try {
          if (typeof window !== 'undefined' && window?.localStorage) {
            // Update auth_user in localStorage with the server-format response
            const currentUser = this.getUser() || {};
            // Ensure we use the server response's preferencia_tema (claro/oscuro format)
            const merged = { ...currentUser, ...updatedUser, preferencia_tema: payloadToSend.preferencia_tema };
            window.localStorage.setItem('auth_user', JSON.stringify(merged));
          }
        } catch (e) {
          console.warn('Failed to update auth_user in localStorage', e);
        }
      })
    );
  }

  deleteUser(id: string) {
    const token = this.getToken();
    const options: any = {};
    if (token) {
      options.headers = { Authorization: `Bearer ${token}` };
    }
    return this.http.delete<any>(`${this.baseUrl}/users/${id}`, options);
  }

  // Gastos (expenses) endpoints
  getGastosForGroup(id_grupo: string) {
    return this.http.get<any[]>(`${this.baseUrl}/gastos/grupo/${id_grupo}`);
  }

  createGasto(payload: any) {
    return this.http.post<any>(`${this.baseUrl}/gastos`, payload);
  }

  getGastoById(id: string) {
    return this.http.get<any>(`${this.baseUrl}/gastos/${id}`);
  }

  // Participaciones endpoints
  createParticipacion(payload: { id_usuario: string; id_gasto: string; monto_asignado: number }) {
    return this.http.post<any>(`${this.baseUrl}/participacion`, payload);
  }

  getParticipacionesForGasto(id_gasto: string) {
    return this.http.get<any[]>(`${this.baseUrl}/participacion/gasto/${id_gasto}`);
  }

  deleteParticipacion(id: string) {
    return this.http.delete<any>(`${this.baseUrl}/participacion/${id}`);
  }

  deleteGasto(id: string) {
    return this.http.delete<any>(`${this.baseUrl}/gastos/${id}`);
  }

  updateGasto(id: string, payload: any) {
    return this.http.put<any>(`${this.baseUrl}/gastos/${id}`, payload);
  }
}
