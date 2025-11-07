import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Gasto } from './models/gasto.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class GastosService {
  private url = 'http://localhost:5200';
  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    const token = this.auth.getToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  getByGroup(id_grupo: string): Observable<Gasto[]> {
    return this.http.get<Gasto[]>(`${this.url}/gastos/grupo/${id_grupo}`, this.headers());
  }

  getById(id: string): Observable<Gasto> {
    return this.http.get<Gasto>(`${this.url}/gastos/${id}`, this.headers());
  }

  create(gasto: Partial<Gasto>) {
    return this.http.post(`${this.url}/gastos`, gasto, this.headers());
  }

  update(id: string, gasto: Partial<Gasto>) {
    return this.http.put(`${this.url}/gastos/${id}`, gasto, this.headers());
  }

  delete(id: string) {
    return this.http.delete(`${this.url}/gastos/${id}`, this.headers());
  }
}
