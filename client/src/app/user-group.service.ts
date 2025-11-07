import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UserGroup } from './models/user-group.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class UserGroupService {
  private url = 'http://localhost:5200';
  constructor(private http: HttpClient, private auth: AuthService) {}

  private headers() {
    const token = this.auth.getToken();
    return token ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) } : {};
  }

  // list groups or shared accounts
  listSharedAccounts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.url}/user_groups/shared-accounts`, this.headers());
  }

  getSharedAccount(id: string) {
    return this.http.get<any>(`${this.url}/user_groups/shared-accounts/${id}`, this.headers());
  }

  createSharedAccount(payload: any) {
    const uid = this.auth.getUserId();
    if (uid && !payload.creador_id) payload.creador_id = uid;
    return this.http.post(`${this.url}/user_groups/shared-accounts`, payload, this.headers());
  }

  updateSharedAccount(id: string, payload: any) {
    return this.http.put(`${this.url}/user_groups/shared-accounts/${id}`, payload, this.headers());
  }

  deleteSharedAccount(id: string) {
    return this.http.delete(`${this.url}/user_groups/shared-accounts/${id}`, this.headers());
  }

  // user_groups: add/remove members
  addMember(ug: Partial<UserGroup>) {
    return this.http.post(`${this.url}/user_groups`, ug, this.headers());
  }

  removeMember(id: string) {
    return this.http.delete(`${this.url}/user_groups/${id}`, this.headers());
  }

  listMembersByGroup(id_grupo: string): Observable<UserGroup[]> {
    return this.http.get<UserGroup[]>(`${this.url}/user_groups/grupo/${id_grupo}`, this.headers());
  }
}
