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
      localStorage.setItem('auth_token', res.token);
      localStorage.setItem('auth_user', JSON.stringify(res.user));
    } catch (e) {
      console.warn('Failed to save auth to localStorage', e);
    }
  }

  logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  getUser(): any | null {
    const u = localStorage.getItem('auth_user');
    return u ? JSON.parse(u) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
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
}
