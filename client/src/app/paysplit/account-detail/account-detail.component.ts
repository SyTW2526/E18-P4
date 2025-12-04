import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';

@Component({
  selector: 'app-account-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatListModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
    MatCheckboxModule,
    MatButtonToggleModule,
  ],
  template: `
    <section style="max-width:900px; width:100%; margin:0 auto; text-align:left; padding-bottom:1.5rem">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <h2 style="margin:0">{{ accountName || 'Cuenta compartida' }}</h2>
        <span style="margin-left:auto; display:flex; gap:0.5rem">
          <button mat-stroked-button color="primary" (click)="openCreateGasto()">Añadir gasto</button>
          <button mat-stroked-button color="accent" (click)="openBalance()">Balances</button>
          <button mat-stroked-button (click)="openSettings()"><mat-icon style="font-size:18px;margin-right:4px">settings</mat-icon>Configuración</button>
          <button mat-stroked-button color="warn" (click)="deleteGroup()">Eliminar</button>
        </span>
      </div>

      <div style="display:flex;gap:1rem;margin-top:0.5rem">
        <mat-card style="flex:1">
          <h3>Resumen</h3>
          <p>Total cuenta: <strong>{{ accountTotal() | number:'1.2-2' }} {{ gastosCurrency() }}</strong></p>
          <p>Tu total pagado: <strong>{{ userTotal() | number:'1.2-2' }} {{ gastosCurrency() }}</strong></p>
        </mat-card>

        <mat-card style="flex:1">
          <h3>Miembros ({{ miembros.length }})</h3>
          <div *ngIf="!miembros.length" style="color:var(--text-muted); font-size:0.9rem">No hay miembros</div>
          <mat-list *ngIf="miembros.length">
            <mat-list-item *ngFor="let m of miembros" style="height:auto; padding:8px 0">
              <div style="display:flex; align-items:center; gap:12px; width:100%">
                <div style="width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg, var(--primary-color) 0%, #667eea 100%); display:flex; align-items:center; justify-content:center; color:white; font-size:16px; font-weight:600; flex-shrink:0">
                  {{ (m.nombre || m.email || 'U').charAt(0).toUpperCase() }}
                </div>
                <div style="flex:1; min-width:0">
                  <div style="font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ m.nombre || m.username || 'Usuario' }}</div>
                  <div style="font-size:0.85rem; color:var(--text-muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ m.email }}</div>
                </div>
              </div>
            </mat-list-item>
          </mat-list>
        </mat-card>

        <mat-card style="flex:2">
          <h3>Historial de gastos</h3>
          <div *ngIf="!gastos.length">No hay gastos todavía.</div>
          <mat-list *ngIf="gastos.length">
              <mat-list-item *ngFor="let g of gastos">
                <div style="display:flex;justify-content:space-between;width:100%">
                  <div>
                    <div style="font-weight:600">{{ g.descripcion }}</div>
                    <div style="font-size:0.9rem;color:#666">por {{ displayMember(g.id_pagador) }} · {{ g.fecha ? (g.fecha | date:'short') : '' }}</div>
                  </div>
                  <div style="display:flex;gap:0.5rem;align-items:center">
                    <div style="font-weight:700">{{ g.monto | number:'1.2-2' }} {{ g.moneda || gastosCurrency() }}</div>
                    <button mat-icon-button title="Editar gasto" (click)="editGasto(g._id || g.id || g._id?.toString())"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" title="Eliminar gasto" (click)="removeGasto(g._id || g.id || g._id?.toString())"><mat-icon>delete</mat-icon></button>
                  </div>
                </div>
              </mat-list-item>
          </mat-list>
        </mat-card>
      </div>

      <!-- Add friend modal -->
      <div *ngIf="showAddFriendModal" style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); z-index:1000;" (click)="closeAddFriendModal()">
        <div style="background:var(--secondary-bg); padding:24px; border-radius:8px; width:400px; max-width:90%; color:var(--text-main);" (click)="$event.stopPropagation()">
          <h3 style="margin:0 0 16px">Añadir amigo al grupo</h3>
          <div *ngIf="loadingFriends" style="padding:16px; text-align:center">Cargando amigos...</div>
          <div *ngIf="!loadingFriends && availableFriends.length === 0" style="padding:16px; text-align:center; color:var(--text-muted)">No hay amigos disponibles para añadir</div>
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
          <div style="display:flex; gap:8px; justify-content:flex-end">
            <button mat-button (click)="closeAddFriendModal()" [disabled]="addingFriend">Cancelar</button>
            <button mat-flat-button color="primary" (click)="addFriendToGroup()" [disabled]="!selectedFriendToAdd || addingFriend">{{ addingFriend ? 'Añadiendo...' : 'Añadir' }}</button>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AccountDetailComponent implements OnInit {
  accountId = '';
  accountName: string | null = null;
  gastos: any[] = [];
  loading = false;
  error: string | null = null;
  miembros: any[] = [];
  participantes: Array<{ userId: string; amount: number | null; included: boolean }> = [];
  splitEnabled = true;
  splitMode: 'equal' | 'custom' = 'equal';

  newGasto: any = { descripcion: '', monto: null, categoria: '', fecha: '' };
  selectedPayer: string | null = null;
  creating = false;
  createError: string | null = null;
  
  // Add friend modal state
  showAddFriendModal = false;
  availableFriends: any[] = [];
  selectedFriendToAdd: string | null = null;
  loadingFriends = false;
  addingFriend = false;
  addFriendError: string | null = null;

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id') || '';
    // optionally get account name from history state
    const state = window.history.state || {};
    if (state?.accountName) this.accountName = state.accountName;
    this.loadAccountAndGastos();
  }

  loadAccountAndGastos() {
    this.loading = true;
    this.error = null;
    // fetch account details to get miembros
    this.auth.getSharedAccountById(this.accountId).subscribe({
      next: (acc: any) => {
        // if API returns explicit miembros array (legacy), use it; otherwise fetch members relation
        const rawMiembros = Array.isArray(acc?.miembros) ? acc.miembros : null;
        const processRaw = (list: any[]) => {
          const observables = list.map((m: any) => {
            if (!m) return of(null);
            if (typeof m === 'object' && (m._id || m.id || m.email)) return of(m);
            // assume m is id string
            return this.auth.getUserById(String(m));
          });

          (forkJoin(observables) as any).subscribe(
            (resolved: any[]) => {
              // normalize members to objects with _id, nombre, email
              this.miembros = resolved.map((r: any, i: number) => {
                if (!r) {
                  const id = list[i];
                  return { _id: id };
                }
                return r;
              });
              // ensure current user is present among miembros
              const me = this.auth.getUser();
              const meId = me?._id || me?.id;
              if (meId && !this.miembros.find((m: any) => (m && (m._id || m.id)) === meId)) {
                this.miembros.unshift(me);
              }
              // default selected payer to current user if present
              this.selectedPayer = meId || (this.miembros.length ? this.miembros[0]?._id || this.miembros[0] : null);
              // initialize participantes for the form (include current user)
              this.participantes = this.miembros.map((m: any) => ({ userId: m._id || m.id || String(m), amount: null, included: true }));
              this.loadGastos();
            },
            () => {
              // fallback: use raw members as-is
              this.miembros = list.map((m: any) => (typeof m === 'object' ? m : { _id: m }));
              const meFav = this.auth.getUser();
              const meFavId = meFav?._id || meFav?.id;
              if (meFavId && !this.miembros.find((m: any) => (m && (m._id || m.id)) === meFavId)) {
                this.miembros.unshift(meFav);
              }
              this.selectedPayer = meFavId || (this.miembros.length ? this.miembros[0]._id : null);
              this.participantes = this.miembros.map((m: any) => ({ userId: m._id || m.id || String(m), amount: null, included: true }));
              this.loadGastos();
            }
          );
        };

        if (rawMiembros) {
          processRaw(rawMiembros);
        } else {
          // fetch members from relation endpoint
          this.auth.getMembersForGroup(this.accountId).subscribe({
            next: (members: any[]) => {
              processRaw(members || []);
            },
            error: () => {
              // if members endpoint fails, fallback to empty list and continue
              this.miembros = [];
              this.participantes = [];
              this.loadGastos();
            },
          });
        }
      },
      error: (err: any) => {
        // still try to load gastos even if account fetch fails
        this.miembros = [];
        this.loadGastos();
      },
    });
  }

  loadGastos() {
    this.error = null;
    this.loading = true;
    this.auth.getGastosForGroup(this.accountId).subscribe({
      next: (res: any) => {
        this.gastos = Array.isArray(res) ? res : (res?.data || []);
        // normalize fecha if it's a string
        this.gastos = this.gastos.map((g: any) => ({ ...g, fecha: g.fecha ? new Date(g.fecha) : null }));
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.message || 'No se pudieron cargar los gastos';
        this.loading = false;
      },
    });
  }

  createGastoFromForm() {
    this.createError = null;
    if (!this.newGasto.monto || !this.newGasto.descripcion) {
      this.createError = 'Introduce descripción y monto';
      return;
    }
    if (!this.selectedPayer) {
      this.createError = 'Selecciona el pagador';
      return;
    }
    this.creating = true;
    const user = this.auth.getUser();
    const payload: any = {
      id_grupo: this.accountId,
      descripcion: this.newGasto.descripcion,
      monto: Number(this.newGasto.monto),
      id_pagador: this.selectedPayer || user?._id || user?.id || 'desconocido',
      fecha: this.newGasto.fecha ? new Date(this.newGasto.fecha) : new Date(),
      categoria: this.newGasto.categoria || '',
    };

    // build participacion only if splitting enabled
    if (this.splitEnabled) {
      const participants = this.participantes.filter(p => p.included).map(p => ({ id_usuario: p.userId, monto: Number(p.amount || 0) }));
      const includedCount = participants.length;
      if (includedCount > 0) {
        // if mode is equal or no individual amounts provided, auto-split equally
        if (this.splitMode === 'equal' || participants.every(p => !p.monto)) {
          const equal = +(payload.monto / includedCount).toFixed(2);
          participants.forEach(p => (p.monto = equal));
        }
      }
      payload.participacion = participants;
    } else {
      payload.participacion = [];
    }

    this.auth.createGasto(payload).subscribe({
      next: () => {
        this.creating = false;
        this.newGasto = { descripcion: '', monto: null, categoria: '', fecha: '' };
        this.loadGastos();
      },
      error: (err: any) => {
        this.creating = false;
        this.createError = err?.error?.message || err?.message || 'No se pudo crear el gasto';
      },
    });
  }

  accountTotal() {
    return this.gastos.reduce((s, g) => s + (Number(g.monto) || 0), 0);
  }

  userTotal() {
    const me = this.auth.getUser();
    const meId = me?._id || me?.id;
    return this.gastos.reduce((s, g) => s + ((String(g.id_pagador) === String(meId) ? Number(g.monto) || 0 : 0)), 0);
  }

  gastosCurrency() {
    // try to pick currency from first gasto or fallback to EUR
    return this.gastos.length ? (this.gastos[0].moneda || 'EUR') : 'EUR';
  }

  openCreateGasto() {
    this.router.navigate(['/group', this.accountId, 'create-gasto']);
  }

  editGasto(gastoId: string | null) {
    if (!gastoId) return;
    this.router.navigate(['/group', this.accountId, 'gasto', gastoId]);
  }

  openBalance() {
    this.router.navigate(['/group', this.accountId, 'balance']);
  }

  openSettings() {
    this.router.navigate(['/group', this.accountId, 'settings']);
  }

  removeGasto(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return;
    this.auth.deleteGasto(id).subscribe({
      next: () => this.loadGastos(),
      error: (err: any) => alert('No se pudo eliminar el gasto: ' + (err?.error?.message || err?.message || 'Error')),
    });
  }

  deleteGroup() {
    if (!confirm('¿Eliminar esta cuenta/grupo compartido? Esta acción no se puede deshacer.')) return;
    this.auth.deleteSharedAccount(this.accountId).subscribe({
      next: () => {
        // navigate back to home after successful deletion
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        alert('No se pudo eliminar el grupo: ' + (err?.error?.message || err?.message || 'Error'));
        console.error('deleteGroup error', err);
      },
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  resetForm() {
    this.newGasto = { descripcion: '', monto: null, categoria: '', fecha: '' };
    const me = this.auth.getUser();
    this.selectedPayer = me?._id || me?.id || (this.miembros.length ? this.miembros[0] : null);
    this.createError = null;
    this.participantes = this.miembros.map((m: any) => ({ userId: m._id || m.id || String(m), amount: null, included: true }));
  }

  autoSplit() {
    const total = Number(this.newGasto.monto) || 0;
    const included = this.participantes.filter(p => p.included);
    if (!included.length || !total) return;
    const share = +(total / included.length).toFixed(2);
    this.participantes = this.participantes.map(p => (p.included ? { ...p, amount: share } : { ...p, amount: 0 }));
  }

  displayMember(m: any) {
    const me = this.auth.getUser();
    if (!m) return '—';
    const id = typeof m === 'object' ? (m._id || m.id) : m;
    
    // Try to find the member in miembros array
    const member = this.miembros.find((mem: any) => String(mem._id || mem.id) === String(id));
    
    // determine base label
    let label = '';
    if (member) {
      label = member.nombre || member.username || member.email || 'Usuario';
    } else if (typeof m === 'object') {
      label = m.nombre || m.username || m.email || 'Usuario';
    } else {
      label = 'Usuario';
    }
    // if this is the current user, append (yo)
    if (me && (id === me._id || id === me.id)) return `${label} (yo)`;
    return label;
  }

  closeAddFriendModal() {
    this.showAddFriendModal = false;
    this.selectedFriendToAdd = null;
    this.addFriendError = null;
    this.availableFriends = [];
  }

  openAddFriendModal() {
    this.showAddFriendModal = true;
    this.loadAvailableFriends();
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

    // Get current user's friends
    this.auth.getAmigos(String(myId)).subscribe({
      next: (res: any) => {
        const friends = res?.amigos || [];
        // Filter out friends who are already members of this group
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
      }
    });
  }

  selectFriendToAdd(friend: any) {
    this.selectedFriendToAdd = friend._id || friend.id;
  }

  addFriendToGroup() {
    if (!this.selectedFriendToAdd) return;
    
    this.addingFriend = true;
    this.addFriendError = null;

    // Add the friend to the group via createUserGroup endpoint
    const payload = {
      id_usuario: this.selectedFriendToAdd,
      id_grupo: this.accountId,
      rol: 'miembro'
    };

    this.auth.createUserGroup(payload).subscribe({
      next: () => {
        this.addingFriend = false;
        this.closeAddFriendModal();
        // Reload account and members
        this.loadAccountAndGastos();
      },
      error: (err: any) => {
        this.addingFriend = false;
        this.addFriendError = err?.error?.message || 'No se pudo añadir el amigo al grupo';
      }
    });
  }
}
