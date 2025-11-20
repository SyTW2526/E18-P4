import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

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

  // User-group relations (join a group)
  createUserGroup(payload: { id_usuario: string; id_grupo: string; rol?: string }) {
    return this.http.post<any>(`${this.baseUrl}/user-group/user-groups`, payload);
  }

  getUserById(id: string) {
    return this.http.get<any>(`${this.baseUrl}/users/${id}`);
  }

  updateUser(id: string, payload: any) {
    return this.http.put<any>(`${this.baseUrl}/users/${id}`, payload).pipe(
      tap((updated) => {
        try {
          if (typeof window !== 'undefined' && window?.localStorage) {
            const current = window.localStorage.getItem('auth_user');
            if (current) {
              const parsed = JSON.parse(current);
              const merged = { ...parsed, ...updated };
              window.localStorage.setItem('auth_user', JSON.stringify(merged));
            }
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
