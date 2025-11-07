import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Participacion } from './models/participacion.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ParticipacionService {
  private url = 'http://localhost:5200';
  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    const token = this.auth.getToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  list(): Observable<Participacion[]> {
    return this.http.get<Participacion[]>(`${this.url}/participaciones`, this.headers());
  }

  getById(id: string): Observable<Participacion> {
    return this.http.get<Participacion>(`${this.url}/participaciones/${id}`, this.headers());
  }

  getByGasto(id_gasto: string): Observable<Participacion[]> {
    return this.http.get<Participacion[]>(`${this.url}/participaciones/gasto/${id_gasto}`, this.headers());
  }

  getByUsuario(id_usuario: string): Observable<Participacion[]> {
    return this.http.get<Participacion[]>(`${this.url}/participaciones/usuario/${id_usuario}`, this.headers());
  }

  create(p: Partial<Participacion>) {
    return this.http.post(`${this.url}/participaciones`, p, this.headers());
  }

  update(id: string, p: Partial<Participacion>) {
    return this.http.put(`${this.url}/participaciones/${id}`, p, this.headers());
  }

  delete(id: string) {
    return this.http.delete(`${this.url}/participaciones/${id}`, this.headers());
  }
}
