import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private url = 'http://localhost:5200';

  constructor(private http: HttpClient) {}

  signup(payload: { nombre: string; email: string; password: string }) {
    return this.http.post<any>(`${this.url}/users/signup`, payload).pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem('token', res.token);
        }
        if (res?.user) localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  signin(payload: { email: string; password: string }) {
    return this.http.post<any>(`${this.url}/users/signin`, payload).pipe(
      tap((res) => {
        if (res?.token) localStorage.setItem('token', res.token);
        if (res?.user) localStorage.setItem('user', JSON.stringify(res.user));
      })
    );
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  getToken(): string | null {
    if (typeof window === 'undefined' || !window?.localStorage) return null;
    return localStorage.getItem('token');
  }

  getUser(): any | null {
    if (typeof window === 'undefined' || !window?.localStorage) return null;
    const s = localStorage.getItem('user');
    return s ? JSON.parse(s) : null;
  }

  getUserId(): string | null {
    const u = this.getUser();
    if (!u) return null;
    return String(u._id || u.id || u);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
