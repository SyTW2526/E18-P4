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
                <div style="position:relative; min-width:140px; flex-shrink:0">
                  <div *ngIf="groupImageSrc || account.foto_grupo" style="width:112px; height:112px; border-radius:50%; overflow:hidden; background:var(--secondary-bg); box-shadow:0 2px 8px rgba(0,0,0,0.12); border:2px solid #444">
                    <img [src]="groupImageSrc || account.foto_grupo" style="width:100%; height:100%; object-fit:cover" />
                  </div>
                  <div *ngIf="!groupImageSrc && !account.foto_grupo" style="width:112px; height:112px; border-radius:50%; background:linear-gradient(135deg, var(--primary-color) 0%, #667eea 100%); display:flex; align-items:center; justify-content:center; color:white; font-size:40px; font-weight:700; box-shadow:0 2px 8px rgba(0,0,0,0.12); border:2px solid #444">
                    {{ (account.nombre || 'G').charAt(0).toUpperCase() }}
                  </div>
                  <input type="file" #groupFileInput accept="image/*" style="display:none" (change)="onGroupImageSelected($event)" />
                  <button mat-stroked-button color="primary" (click)="groupFileInput.click()" style="position:absolute; bottom:0; right:6px; width:40px; height:40px; min-width:40px; padding:0; border-radius:50%; display:inline-flex; align-items:center; justify-content:center">
                    <mat-icon style="margin:0">photo_camera</mat-icon>
                  </button>
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
              <div style="margin-bottom:12px">
                <label style="display:block; font-size:0.875rem; font-weight:500; margin-bottom:4px; color:var(--text-muted)">{{ lang.t('currency') || 'Moneda' }}</label>
                <select [(ngModel)]="account.moneda" name="moneda" style="width:240px; padding:10px 12px; border:1px solid rgba(255,255,255,0.2); border-radius:4px; background:var(--secondary-bg); color:var(--text-main); font-size:0.95rem; box-sizing:border-box">
                  <option *ngFor="let c of currencyOptions" [value]="c.code">{{ c.symbol }} - {{ c.label }}</option>
                </select>
              </div>
              <div style="margin-bottom:12px">
                <label style="display:block; font-size:0.875rem; font-weight:500; margin-bottom:4px; color:var(--text-muted)">{{ lang.t('groupId') || 'ID del grupo' }}</label>
                <div style="display:flex; gap:8px; align-items:center">
                  <input type="text" [value]="account._id || account.id" readonly style="flex:1; padding:10px 12px; border:1px solid rgba(255,255,255,0.2); border-radius:4px; background:var(--secondary-bg); color:var(--text-muted); font-size:0.95rem; box-sizing:border-box; cursor:text" />
                  <button mat-icon-button (click)="copyGroupId()" [title]="lang.t('copy') || 'Copiar'">
                    <mat-icon>content_copy</mat-icon>
                  </button>
                </div>
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

          <!-- Invitation Links Section -->
          <mat-card style="margin-top:16px; padding:0" *ngIf="myRole === 'owner' || myRole === 'admin'">
            <div style="padding:24px">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px">
                <h3 style="margin:0">{{ lang.t('invitationLinks') || 'Enlaces de invitación' }}</h3>
                <button mat-icon-button (click)="toggleCreateLinkForm()" [title]="lang.t('createLink') || 'Crear enlace'">
                  <mat-icon>{{ showCreateLinkForm ? 'close' : 'add_link' }}</mat-icon>
                </button>
              </div>

              <!-- Create Link Form -->
              <div *ngIf="showCreateLinkForm" style="padding:16px; background:rgba(255,255,255,0.03); border-radius:6px; margin-bottom:16px">
                <div style="margin-bottom:12px">
                  <label style="display:block; font-size:0.875rem; font-weight:500; margin-bottom:4px; color:var(--text-muted)">{{ lang.t('maxUses') || 'Usos máximos' }}</label>
                  <input type="number" [(ngModel)]="newLinkMaxUses" placeholder="Ilimitado" min="1" style="width:100%; padding:8px 12px; border:1px solid rgba(255,255,255,0.2); border-radius:4px; background:var(--secondary-bg); color:var(--text-main); font-size:0.95rem; box-sizing:border-box" />
                </div>
                <div style="margin-bottom:12px">
                  <label style="display:block; font-size:0.875rem; font-weight:500; margin-bottom:4px; color:var(--text-muted)">{{ lang.t('expirationDays') || 'Días hasta expirar' }}</label>
                  <input type="number" [(ngModel)]="newLinkExpirationDays" placeholder="Sin expiración" min="1" style="width:100%; padding:8px 12px; border:1px solid rgba(255,255,255,0.2); border-radius:4px; background:var(--secondary-bg); color:var(--text-main); font-size:0.95rem; box-sizing:border-box" />
                </div>
                <div style="display:flex; gap:8px; justify-content:flex-end">
                  <button mat-button (click)="toggleCreateLinkForm()">{{ lang.t('cancel') }}</button>
                  <button mat-flat-button color="primary" (click)="createInvitationLink()" [disabled]="creatingLink">
                    {{ creatingLink ? lang.t('creating') + '...' : (lang.t('create') || 'Crear') }}
                  </button>
                </div>
                <div *ngIf="linkError" style="color:#d9534f; margin-top:8px; font-size:0.9rem">{{ linkError }}</div>
              </div>

              <!-- Active Links List -->
              <div *ngIf="loadingLinks" style="text-align:center; padding:16px; color:var(--text-muted)">{{ lang.t('loading') }}...</div>
              <div *ngIf="!loadingLinks && invitationLinks.length === 0" style="color:var(--text-muted); font-size:0.9rem">{{ lang.t('noActiveLinks') || 'No hay enlaces activos' }}</div>
              <div *ngIf="!loadingLinks && invitationLinks.length > 0" style="display:flex; flex-direction:column; gap:12px">
                <div *ngFor="let link of invitationLinks" style="padding:12px; border-radius:6px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06)">
                  <div style="display:flex; align-items:flex-start; gap:8px; margin-bottom:8px">
                    <mat-icon style="color:var(--primary-color); font-size:20px">link</mat-icon>
                    <div style="flex:1; min-width:0">
                      <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px">
                        {{ link.usos_actuales || 0 }} / {{ link.usos_maximos || '∞' }} usos
                        <span *ngIf="link.expira_en"> • Expira: {{ link.expira_en | date:'dd/MM/yyyy' }}</span>
                      </div>
                      <div style="display:flex; gap:4px; align-items:center">
                        <input readonly [value]="getLinkUrl(link.token)" style="flex:1; padding:6px 8px; border:1px solid rgba(255,255,255,0.2); border-radius:4px; background:var(--secondary-bg); color:var(--text-main); font-size:0.8rem; font-family:monospace; box-sizing:border-box" />
                        <button mat-icon-button (click)="copyLink(link.token)" [title]="lang.t('copy') || 'Copiar'">
                          <mat-icon style="font-size:20px">content_copy</mat-icon>
                        </button>
                        <button mat-icon-button color="warn" (click)="revokeLink(link)" [title]="lang.t('revoke') || 'Revocar'" [disabled]="revokingLink === link._id">
                          <mat-icon style="font-size:20px">delete</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </mat-card>

          <mat-card style="margin-top:16px; padding:0">
            <div style="padding:24px; display:flex; justify-content:flex-start">
              <button mat-raised-button class="danger-btn" (click)="deleteGroup()">{{ lang.t('deleteGroup') }}</button>
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

  // Group avatar state
  groupImageSrc: string | null = null;

  currencyOptions = [
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'GBP', label: 'British Pound', symbol: '£' },
  ];

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

  // Invitation links state
  invitationLinks: any[] = [];
  loadingLinks = false;
  showCreateLinkForm = false;
  newLinkMaxUses: number | null = null;
  newLinkExpirationDays: number | null = null;
  creatingLink = false;
  linkError: string | null = null;
  revokingLink: string | null = null;

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router, public lang: LanguageService) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id') || '';
    this.loadAccountDetails();
  }

  deleteGroup() {
    if (!confirm('¿Eliminar esta cuenta/grupo compartido? Esta acción no se puede deshacer.')) return;
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) {
      alert('No autenticado');
      return;
    }
    this.auth.deleteSharedAccount(this.accountId, String(myId)).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        alert('No se pudo eliminar el grupo: ' + (err?.error?.message || err?.message || 'Error'));
        console.error('deleteGroup error', err);
      },
    });
  }

  loadAccountDetails() {
    this.loading = true;
    this.error = null;

    this.auth.getSharedAccountById(this.accountId).subscribe({
      next: (acc: any) => {
        this.account = { ...acc };
        this.originalAccount = { ...acc };
        this.groupImageSrc = acc.foto_grupo || null;
        if (!this.account.moneda) this.account.moneda = 'EUR';
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
        
        // Cargar enlaces de invitación si es admin u owner
        if (this.myRole === 'owner' || this.myRole === 'admin') {
          this.loadInvitationLinks();
        }
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

    const payload: any = {
      nombre: this.account.nombre,
      descripcion: this.account.descripcion,
      moneda: this.account.moneda || 'EUR',
    };
    
    if (this.account.foto_grupo) {
      payload.foto_grupo = this.account.foto_grupo;
    }

    this.auth.updateSharedAccount(this.accountId, payload).subscribe({
      next: (res: any) => {
        console.log('Save success, response:', res);
        this.saving = false;
        this.saveMessage = this.lang.t('changesSaved');
        this.originalAccount = { ...this.account };
        this.groupImageSrc = this.account.foto_grupo || null;
        setTimeout(() => {
          this.saveMessage = null;
        }, 3000);
      },
      error: (err: any) => {
        this.saving = false;
        console.error('Full error object:', err);
        console.error('Error status:', err.status);
        console.error('Error statusText:', err.statusText);
        console.error('Error error:', err.error);
        console.error('Error message:', err.message);
        const msg = err.error?.message || err.message || err.statusText;
        this.error = `${this.lang.t('errorSaving')}: ${msg}`;
      },
    });
  }

  cancelChanges() {
    this.account = { ...this.originalAccount };
    if (!this.account.moneda) this.account.moneda = 'EUR';
    this.saveMessage = null;
    this.error = null;
    this.groupImageSrc = this.account.foto_grupo || null;
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
      error: (err) => { this.actionLoading = null; this.actionError = err?.error?.message || 'No se pudo eliminar el miembro'; }
    });
  }

  copyGroupId() {
    const groupId = this.account?._id || this.account?.id;
    if (!groupId) return;
    
    navigator.clipboard.writeText(groupId).then(() => {
      this.saveMessage = this.lang.t('copied') || 'ID copiado';
      setTimeout(() => { this.saveMessage = null; }, 2000);
    }).catch(() => {
      this.error = 'No se pudo copiar el ID';
      setTimeout(() => { this.error = null; }, 2000);
    });
  }

  onGroupImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => {
        const resized = this.downscaleImage(img, 256);
        this.groupImageSrc = resized;
        this.account.foto_grupo = resized;
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private downscaleImage(img: HTMLImageElement, maxSize: number): string {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  // Invitation Links Methods
  loadInvitationLinks() {
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) return;

    this.loadingLinks = true;
    this.auth.getGroupInvitationLinks(this.accountId, String(myId)).subscribe({
      next: (links: any[]) => {
        this.invitationLinks = links || [];
        this.loadingLinks = false;
      },
      error: (err: any) => {
        console.error('Error loading invitation links:', err);
        this.invitationLinks = [];
        this.loadingLinks = false;
      }
    });
  }

  toggleCreateLinkForm() {
    this.showCreateLinkForm = !this.showCreateLinkForm;
    if (!this.showCreateLinkForm) {
      this.newLinkMaxUses = null;
      this.newLinkExpirationDays = null;
      this.linkError = null;
    }
  }

  createInvitationLink() {
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) {
      this.linkError = 'No autenticado';
      return;
    }

    this.creatingLink = true;
    this.linkError = null;

    this.auth.createInvitationLink(
      this.accountId,
      String(myId),
      this.newLinkMaxUses || undefined,
      this.newLinkExpirationDays || undefined
    ).subscribe({
      next: (response: any) => {
        this.creatingLink = false;
        this.showCreateLinkForm = false;
        this.newLinkMaxUses = null;
        this.newLinkExpirationDays = null;
        this.loadInvitationLinks();
        
        // Copiar enlace automáticamente
        if (response.enlace) {
          navigator.clipboard.writeText(response.enlace);
          alert('Enlace creado y copiado al portapapeles: ' + response.enlace);
        }
      },
      error: (err: any) => {
        console.error('Error creating invitation link:', err);
        this.linkError = err?.error?.message || 'Error al crear el enlace';
        this.creatingLink = false;
      }
    });
  }

  getLinkUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join-group/${token}`;
  }

  copyLink(token: string) {
    const url = this.getLinkUrl(token);
    navigator.clipboard.writeText(url).then(() => {
      alert('Enlace copiado al portapapeles');
    }).catch(err => {
      console.error('Error copying link:', err);
    });
  }

  revokeLink(link: any) {
    if (!confirm('¿Revocar este enlace de invitación? Los usuarios ya no podrán unirse con este enlace.')) {
      return;
    }

    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) return;

    this.revokingLink = link._id;
    this.auth.revokeInvitationLink(link._id, String(myId)).subscribe({
      next: () => {
        this.revokingLink = null;
        this.loadInvitationLinks();
      },
      error: (err: any) => {
        console.error('Error revoking link:', err);
        alert('Error al revocar el enlace: ' + (err?.error?.message || 'Error desconocido'));
        this.revokingLink = null;
      }
    });
  }
}
