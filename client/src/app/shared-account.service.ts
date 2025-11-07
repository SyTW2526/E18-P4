import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class SharedAccountService {
  private url = 'http://localhost:5200';
  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    const token = this.auth.getToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  getSharedAccounts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/shared_accounts`, this.headers());
  }

  getBalances(id: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/shared_accounts/${id}/balances`, this.headers());
  }

  createSharedAccount(payload: any) {
    // if user is logged in, set creador_id automatically
    const uid = this.auth.getUserId();
    if (uid && !payload.creador_id) payload.creador_id = uid;
    return this.http.post(`${this.url}/shared_accounts`, payload, this.headers());
  }
}

