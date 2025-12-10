import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { LanguageService } from '../../core/language.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-group-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <section style="max-width:1200px; width:100%; margin:0 auto; text-align:left; padding:1.5rem 1rem 1.5rem 1rem">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <h2 style="margin:0">{{ lang.t('groupSettings') }}</h2>
      </div>

      <div *ngIf="loading" style="text-align:center; padding:2rem">{{ lang.t('loading') }}...</div>
      <div *ngIf="error" style="color:#d9534f; padding:1rem; margin-bottom:1rem">{{ error }}</div>

      <div *ngIf="!loading && account" style="display:flex; gap:1.5rem; align-items:flex-start">
        <!-- Group profile section (left) -->
        <div style="flex:1; min-width:400px">
          <mat-card style="padding:0">
            <div style="padding:24px">
              <h3 style="margin-top:0; margin-bottom:1rem">{{ lang.t('groupProfile') }}</h3>
              <div style="display:flex; align-items:flex-start; gap:24px; margin-bottom:1.5rem">
                <div style="width:100px; height:100px; border-radius:50%; background:linear-gradient(135deg, var(--primary-color) 0%, #667eea 100%); display:flex; align-items:center; justify-content:center; color:white; font-size:40px; font-weight:700; flex-shrink:0">
                  {{ (account.nombre || 'G').charAt(0).toUpperCase() }}
                </div>
                <div style="flex:1; min-width:0">
                  <div style="margin-bottom:12px">
                    <label style="display:block; font-size:0.875rem; font-weight:500; margin-bottom:4px; color:var(--text-muted)">{{ lang.t('groupName') }}</label>
                    <input type="text" [(ngModel)]="account.nombre" name="nombre" style="width:100%; padding:10px 12px; border:1px solid rgba(255,255,255,0.2); border-radius:4px; background:var(--secondary-bg); color:var(--text-main); font-size:0.95rem; box-sizing:border-box" />
                  </div>
                  <div style="margin-bottom:12px">
                    <label style="display:block; font-size:0.875rem; font-weight:500; margin-bottom:4px; color:var(--text-muted)">{{ lang.t('id') || 'ID' }}</label>
                    <div style="font-size:0.85rem; word-break:break-all; font-family:monospace; color:var(--text-main)">{{ account._id || account.id }}</div>
                  </div>
                </div>
              </div>
              <div style="margin-bottom:12px">
                <label style="display:block; font-size:0.875rem; font-weight:500; margin-bottom:4px; color:var(--text-muted)">{{ lang.t('description') }}</label>
                <textarea [(ngModel)]="account.descripcion" name="descripcion" rows="3" style="width:100%; padding:10px 12px; border:1px solid rgba(255,255,255,0.2); border-radius:4px; background:var(--secondary-bg); color:var(--text-main); font-size:0.95rem; font-family:inherit; resize:vertical; box-sizing:border-box"></textarea>
              </div>
              <div style="display:flex; gap:8px; justify-content:flex-end; margin-top:16px">
                <button mat-stroked-button (click)="cancelChanges()">{{ lang.t('cancel') }}</button>
                <button mat-flat-button color="primary" (click)="saveChanges()" [disabled]="saving">{{ saving ? lang.t('saving') + '...' : lang.t('saveChanges') }}</button>
              </div>
              <div *ngIf="saveMessage" style="margin-top:12px; color:var(--primary-color)">{{ saveMessage }}</div>
            </div>
          </mat-card>
        </div>

        <!-- Members section (right) -->
        <div style="flex:0 0 320px">
          <mat-card style="padding:0">
            <div style="padding:24px">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                <h3 style="margin:0">{{ lang.t('members') }} ({{ miembros.length }})</h3>
                <button mat-icon-button (click)="openAddFriendModal()" [title]="lang.t('addFriend')" style="min-width:40px">
                  <mat-icon>person_add</mat-icon>
                </button>
              </div>
              <div *ngIf="!miembros.length" style="color:var(--text-muted); font-size:0.9rem">{{ lang.t('noMembers') }}</div>
              <div *ngIf="miembros.length" style="display:flex; flex-direction:column; gap:8px; max-height:400px; overflow-y:auto">
                <div *ngFor="let m of miembros" style="display:flex; align-items:center; gap:12px; padding:12px; border-radius:6px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06)">
                  <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, var(--primary-color) 0%, #667eea 100%); display:flex; align-items:center; justify-content:center; color:white; font-size:16px; font-weight:600; flex-shrink:0">
                    {{ (m.nombre || m.email || 'U').charAt(0).toUpperCase() }}
                  </div>
                  <div style="flex:1; min-width:0">
                    <div style="display:flex; align-items:center; gap:8px; overflow:hidden;">
                      <div style="font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ m.nombre || m.username || 'Usuario' }}</div>
                      <span style="padding:2px 8px; border-radius:12px; background:rgba(255,255,255,0.08); font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px">{{ m.rol || 'miembro' }}</span>
                    </div>
                    <div style="font-size:0.85rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ m.email }}</div>
                  </div>
                  <div style="display:flex; gap:6px; align-items:center" *ngIf="canRemove(m) || canPromote(m) || canDemote(m)">
                    <button mat-icon-button color="primary" *ngIf="canPromote(m)" (click)="promoteToAdmin(m)" [disabled]="actionLoading === (m._id + ':promote') || actionLoading === (m._id + ':demote') || actionLoading === (m._id + ':remove')" [title]="'Hacer admin'"><mat-icon>arrow_circle_up</mat-icon></button>
                    <button mat-icon-button color="accent" *ngIf="canDemote(m)" (click)="demoteToMember(m)" [disabled]="actionLoading === (m._id + ':promote') || actionLoading === (m._id + ':demote') || actionLoading === (m._id + ':remove')" [title]="'Quitar admin'"><mat-icon>arrow_circle_down</mat-icon></button>
                    <button mat-icon-button color="warn" *ngIf="canRemove(m)" (click)="removeMember(m)" [disabled]="actionLoading === (m._id + ':promote') || actionLoading === (m._id + ':demote') || actionLoading === (m._id + ':remove')" [title]="'Expulsar'"><mat-icon>delete</mat-icon></button>
                  </div>
                </div>
              </div>
              <div *ngIf="actionError" style="color:#d9534f; margin-top:8px; font-size:0.9rem">{{ actionError }}</div>
            </div>
          </mat-card>
        </div>
      </div>

      <!-- Add friend modal -->
      <div *ngIf="showAddFriendModal" style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); z-index:1000;" (click)="closeAddFriendModal()">
        <div style="background:var(--secondary-bg); padding:24px; border-radius:8px; width:400px; max-width:90%; color:var(--text-main);" (click)="$event.stopPropagation()">
          <h3 style="margin:0 0 16px">{{ lang.t('addFriend') }}</h3>
          <div *ngIf="loadingFriends" style="padding:16px; text-align:center">{{ lang.t('loading') }}...</div>
          <div *ngIf="!loadingFriends && availableFriends.length === 0" style="padding:16px; text-align:center; color:var(--text-muted)">{{ lang.t('noMembers') }}</div>
          <div *ngIf="!loadingFriends && availableFriends.length > 0" style="max-height:300px; overflow-y:auto; margin-bottom:16px">
            <div *ngFor="let friend of availableFriends" 
                 style="padding:12px; margin:4px 0; border-radius:6px; border:1px solid rgba(255,255,255,0.06); cursor:pointer; display:flex; align-items:center; justify-content:space-between"
                 [style.background]="selectedFriendToAdd === friend._id ? 'rgba(var(--primary-color-rgb, 103, 58, 183), 0.1)' : 'transparent'"
                 (click)="selectFriendToAdd(friend)">
              <div>
                <div style="font-weight:600">{{ friend.nombre || friend.username || friend.email }}</div>
                <div style="font-size:0.85rem; color:var(--text-muted)">{{ friend.email }}</div>
              </div>
              <mat-icon *ngIf="selectedFriendToAdd === friend._id" color="primary">check_circle</mat-icon>
            </div>
          </div>
          <div *ngIf="addFriendError" style="color:#d9534f; margin-bottom:12px; font-size:0.9rem">{{ addFriendError }}</div>
          <div *ngIf="addFriendSuccess" style="color:var(--primary-color); margin-bottom:12px; font-weight:600">{{ lang.t('invitationSent') || 'Invitación enviada' }}</div>
          <div style="display:flex; gap:8px; justify-content:flex-end">
            <button mat-button (click)="closeAddFriendModal()" [disabled]="addingFriend">{{ lang.t('cancel') }}</button>
            <button mat-flat-button color="primary" (click)="addFriendToGroup()" [disabled]="!selectedFriendToAdd || addingFriend">{{ addingFriend ? lang.t('loading') + '...' : (lang.t('sendInvitation') || 'Enviar invitación') }}</button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class GroupSettingsComponent implements OnInit {
  accountId = '';
  account: any = null;
  originalAccount: any = null;
  miembros: any[] = [];
  myRole: 'owner' | 'admin' | 'miembro' = 'miembro';
  loading = false;
  saving = false;
  error: string | null = null;
  saveMessage: string | null = null;

  // Add friend modal state
  showAddFriendModal = false;
  availableFriends: any[] = [];
  selectedFriendToAdd: string | null = null;
  loadingFriends = false;
  addingFriend = false;
  addFriendError: string | null = null;
  addFriendSuccess = false;

  actionLoading: string | null = null;
  actionError: string | null = null;

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router, public lang: LanguageService) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id') || '';
    this.loadAccountDetails();
  }

  loadAccountDetails() {
    this.loading = true;
    this.error = null;

    this.auth.getSharedAccountById(this.accountId).subscribe({
      next: (acc: any) => {
        this.account = { ...acc };
        this.originalAccount = { ...acc };
        this.loadMembers();
      },
      error: (err: any) => {
        this.error = 'No se pudo cargar la información del grupo';
        this.loading = false;
      },
    });
  }

  loadMembers() {
    this.auth.getMembersForGroup(this.accountId).subscribe({
      next: (members: any[]) => {
        this.miembros = (members || []).map((m: any) => ({ ...m, _id: m._id || m.id }));
        const me = this.auth.getUser();
        const myId = me?._id || me?.id;
        const mine = this.miembros.find(m => String(m._id) === String(myId));
        this.myRole = (mine?.rol as any) || 'miembro';
        this.loading = false;
      },
      error: () => {
        this.miembros = [];
        this.loading = false;
      },
    });
  }

  saveChanges() {
    this.saving = true;
    this.saveMessage = null;
    this.error = null;

    const payload = {
      nombre: this.account.nombre,
      descripcion: this.account.descripcion,
    };

    this.auth.updateSharedAccount(this.accountId, payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.saveMessage = this.lang.t('changesSaved');
        this.originalAccount = { ...this.account };
        setTimeout(() => {
          this.saveMessage = null;
        }, 3000);
      },
      error: (err: any) => {
        this.saving = false;
        console.error('Save error:', err);
        // Check if it's actually a successful response with error status
        if (err.status >= 200 && err.status < 300) {
          this.saveMessage = this.lang.t('changesSaved');
          this.originalAccount = { ...this.account };
          setTimeout(() => {
            this.saveMessage = null;
          }, 3000);
        } else {
          this.error = err?.error?.message || this.lang.t('errorSaving');
        }
      },
    });
  }

  cancelChanges() {
    this.account = { ...this.originalAccount };
    this.saveMessage = null;
    this.error = null;
  }

  goBack() {
    this.router.navigate(['/group', this.accountId]);
  }

  openAddFriendModal() {
    this.showAddFriendModal = true;
    this.loadAvailableFriends();
  }

  closeAddFriendModal() {
    this.showAddFriendModal = false;
    this.selectedFriendToAdd = null;
    this.addFriendError = null;
    this.addFriendSuccess = false;
    this.availableFriends = [];
  }

  loadAvailableFriends() {
    this.loadingFriends = true;
    this.addFriendError = null;
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;

    if (!myId) {
      this.addFriendError = 'No autenticado';
      this.loadingFriends = false;
      return;
    }

    this.auth.getAmigos(String(myId)).subscribe({
      next: (res: any) => {
        const friends = res?.amigos || [];
        const memberIds = this.miembros.map((m: any) => String(m._id || m.id));
        this.availableFriends = friends.filter((f: any) => {
          const fid = String(f._id || f.id);
          return !memberIds.includes(fid);
        });
        this.loadingFriends = false;
      },
      error: (err: any) => {
        this.addFriendError = 'No se pudieron cargar los amigos';
        this.loadingFriends = false;
      },
    });
  }

  selectFriendToAdd(friend: any) {
    this.selectedFriendToAdd = friend._id || friend.id;
  }

  addFriendToGroup() {
    if (!this.selectedFriendToAdd) return;

    this.addingFriend = true;
    this.addFriendError = null;

    const myId = this.myId();
    if (!myId) {
      this.addingFriend = false;
      this.addFriendError = 'No autenticado';
      return;
    }

    this.auth.sendGroupInvitation(this.accountId, this.selectedFriendToAdd, myId).subscribe({
      next: () => {
        this.addingFriend = false;
        this.closeAddFriendModal();
        this.addFriendSuccess = true;
        setTimeout(() => { this.addFriendSuccess = false; }, 2000);
      },
      error: (err: any) => {
        this.addingFriend = false;
        this.addFriendError = err?.error?.message || 'No se pudo enviar la invitación';
      },
    });
  }

  private myId(): string | null {
    const me = this.auth.getUser();
    return me?._id || me?.id || null;
  }

  isOwner() { return this.myRole === 'owner'; }
  isAdmin() { return this.myRole === 'owner' || this.myRole === 'admin'; }

  canPromote(member: any) {
    if (!member) return false;
    return this.isOwner() && member.rol !== 'owner' && member.rol !== 'admin';
  }

  canDemote(member: any) {
    if (!member) return false;
    return this.isOwner() && member.rol === 'admin';
  }

  canRemove(member: any) {
    if (!member) return false;
    const myId = this.myId();
    const targetId = member._id || member.id;
    if (myId && String(myId) === String(targetId)) return false;
    if (member.rol === 'owner') return false;
    if (this.isOwner()) return true;
    if (this.myRole === 'admin') {
      return member.rol === 'miembro';
    }
    return false;
  }

  promoteToAdmin(member: any) {
    if (!this.canPromote(member)) return;
    const myId = this.myId();
    const targetId = member._id || member.id;
    if (!myId || !targetId) return;
    this.actionError = null;
    this.actionLoading = String(targetId) + ':promote';
    this.auth.updateUserGroupRole(this.accountId, String(myId), String(targetId), 'admin').subscribe({
      next: () => { this.actionLoading = null; this.loadMembers(); },
      error: (err) => { this.actionLoading = null; this.actionError = err?.error?.message || 'No se pudo actualizar el rol'; }
    });
  }

  demoteToMember(member: any) {
    if (!this.canDemote(member)) return;
    const myId = this.myId();
    const targetId = member._id || member.id;
    if (!myId || !targetId) return;
    this.actionError = null;
    this.actionLoading = String(targetId) + ':demote';
    this.auth.updateUserGroupRole(this.accountId, String(myId), String(targetId), 'miembro').subscribe({
      next: () => { this.actionLoading = null; this.loadMembers(); },
      error: (err) => { this.actionLoading = null; this.actionError = err?.error?.message || 'No se pudo actualizar el rol'; }
    });
  }

  removeMember(member: any) {
    if (!this.canRemove(member)) return;
    const myId = this.myId();
    const targetId = member._id || member.id;
    if (!myId || !targetId) return;
    this.actionError = null;
    this.actionLoading = String(targetId) + ':remove';
    this.auth.removeUserFromGroup(this.accountId, String(myId), String(targetId)).subscribe({
      next: () => { this.actionLoading = null; this.loadMembers(); },
      error: (err) => { this.actionLoading = null; this.actionError = err?.error?.message || 'No se pudo expulsar al miembro'; }
    });
  }
}
