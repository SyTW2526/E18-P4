import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../core/language.service';
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
    <section style="max-width:1800px; width:95vw; margin:0 auto; text-align:left; padding-bottom:1.5rem; transform:translateY(2rem)">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <h2 style="margin:0">{{ accountName || lang.t('sharedAccount') }}</h2>
        <span style="margin-left:auto; display:flex; gap:0.5rem">
          <button mat-stroked-button color="primary" (click)="openCreateGasto()">{{ lang.t('addExpense') }}</button>
          <button mat-stroked-button color="accent" (click)="openBalance()">{{ lang.t('balances') }}</button>
          <button mat-stroked-button (click)="openSettings()"><mat-icon style="font-size:18px;margin-right:4px">settings</mat-icon>{{ lang.t('settings') }}</button>
          <button mat-stroked-button color="warn" (click)="deleteGroup()">{{ lang.t('delete') }}</button>
        </span>
      </div>

      <div style="display:flex;gap:1rem;margin-top:0.5rem">
        <mat-card style="flex:0.9">
          <h3>{{ lang.t('summary') }}</h3>
          <p style="margin-bottom:0.35rem">{{ lang.t('accountTotal') }}:</p>
          <div style="font-size:1.4rem;font-weight:700;margin:0 0 0.75rem">{{ accountTotal() | number:'1.2-2' }} {{ gastosCurrency() }}</div>
          <p style="margin-bottom:0.35rem">{{ lang.t('yourTotal') }}:</p>
          <div style="font-size:1.4rem;font-weight:700;margin:0">{{ userTotal() | number:'1.2-2' }} {{ gastosCurrency() }}</div>
        </mat-card>

          <mat-card *ngIf="gastos.length" style="flex:2.0">
            <h3>{{ lang.t('dailyExpenses') }}</h3>
            <div style="padding:1rem 0">
              <svg [attr.viewBox]="'0 0 ' + chartWidth + ' ' + chartHeight" style="width:100%; height:auto">
                <!-- X-axis -->
                <line [attr.x1]="chartPadding" [attr.y1]="chartHeight - chartPadding" 
                      [attr.x2]="chartWidth - chartPadding" [attr.y2]="chartHeight - chartPadding" 
                      stroke="var(--text-muted, #666)" stroke-width="1"/>
                <!-- Y-axis -->
                <line [attr.x1]="chartPadding" [attr.y1]="chartPadding" 
                      [attr.x2]="chartPadding" [attr.y2]="chartHeight - chartPadding" 
                      stroke="var(--text-muted, #666)" stroke-width="1"/>
                <!-- Y-axis label (currency) -->
                <text [attr.x]="chartPadding - 35"
                      [attr.y]="chartPadding - 10"
                      [attr.fill]="'var(--text-main, #fff)'"
                      font-size="12"
                      font-weight="600">{{ gastosCurrency() }}</text>
              
                <!-- Bars -->
                <g *ngFor="let day of dailyExpenseData; let i = index">
                  <rect [attr.x]="chartPadding + (i * barWidth) + (i * barGap) + barGap/2"
                        [attr.y]="chartHeight - chartPadding - day.barHeight"
                        [attr.width]="barWidth"
                        [attr.height]="day.barHeight"
                        [attr.fill]="'var(--primary-color, #B8F12D)'"
                        opacity="0.8">
                    <title>{{ day.date }}: {{ day.total | number:'1.2-2' }} {{ gastosCurrency() }}</title>
                  </rect>
                  <!-- Date labels -->
                  <text [attr.x]="chartPadding + (i * barWidth) + (i * barGap) + barGap/2 + barWidth/2"
                        [attr.y]="chartHeight - chartPadding + 15"
                        text-anchor="middle"
                        [attr.fill]="'var(--text-muted, #666)'"
                        font-size="10">{{ day.label }}</text>
                  <!-- Amount labels -->
                  <text [attr.x]="chartPadding + (i * barWidth) + (i * barGap) + barGap/2 + barWidth/2"
                        [attr.y]="chartHeight - chartPadding - day.barHeight - 5"
                        text-anchor="middle"
                        [attr.fill]="'var(--text-main, #fff)'"
                        font-size="11"
                        font-weight="600">{{ day.total | number:'1.0-0' }}</text>
                </g>
              </svg>
            </div>
          </mat-card>

          <mat-card style="flex:2.6">
          <h3>{{ lang.t('expenseHistory') }}</h3>
          <div *ngIf="!gastos.length">{{ lang.t('noExpensesYet') }}</div>
          <mat-list *ngIf="gastos.length">
              <mat-list-item *ngFor="let g of gastos">
                <div style="display:flex;justify-content:space-between;width:100%">
                  <div>
                    <div style="font-weight:600">{{ g.descripcion }}</div>
                    <div style="font-size:0.9rem;color:#666">{{ lang.t('by') }} {{ displayMember(g.id_pagador) }} · {{ g.fecha ? (g.fecha | date:'dd/MM/yyyy HH:mm') : '' }}</div>
                  </div>
                  <div style="display:flex;gap:0.5rem;align-items:center">
                    <div style="font-weight:700">{{ g.monto | number:'1.2-2' }} {{ g.moneda || gastosCurrency() }}</div>
                    <button mat-icon-button [title]="lang.t('editExpense')" (click)="editGasto(g._id || g.id || g._id?.toString())"><mat-icon>edit</mat-icon></button>
                    <button mat-icon-button color="warn" [title]="lang.t('deleteExpense')" (click)="removeGasto(g._id || g.id || g._id?.toString())"><mat-icon>delete</mat-icon></button>
                  </div>
                </div>
              </mat-list-item>
          </mat-list>
        </mat-card>
      </div>

      <!-- Add friend modal -->
      <div *ngIf="showAddFriendModal" style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.5); z-index:1000;" (click)="closeAddFriendModal()">
        <div style="background:var(--secondary-bg); padding:24px; border-radius:8px; width:400px; max-width:90%; color:var(--text-main);" (click)="$event.stopPropagation()">
          <h3 style="margin:0 0 16px">{{ lang.t('addFriend') }}</h3>
          <div *ngIf="loadingFriends" style="padding:16px; text-align:center">{{ lang.t('loading') }}</div>
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
          <div style="display:flex; gap:8px; justify-content:flex-end">
            <button mat-button (click)="closeAddFriendModal()" [disabled]="addingFriend">{{ lang.t('cancel') }}</button>
            <button mat-flat-button color="primary" (click)="addFriendToGroup()" [disabled]="!selectedFriendToAdd || addingFriend">{{ addingFriend ? lang.t('loading') : lang.t('add') }}</button>
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

  // Chart properties
  chartWidth = 800;
  chartHeight = 300;
  chartPadding = 50;
  barWidth = 32;
  barGap = 8;
  dailyExpenseData: Array<{ date: string; label: string; total: number; barHeight: number }> = [];

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router, public lang: LanguageService) {}

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
        this.calculateDailyExpenses();
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err?.error?.message || err?.message || 'No se pudieron cargar los gastos';
        this.loading = false;
      },
    });
  }

  calculateDailyExpenses() {
    // Group expenses by date
    const dailyTotals = new Map<string, number>();
    
    this.gastos.forEach((g: any) => {
      if (g.fecha && g.monto) {
        const date = new Date(g.fecha);
        const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD
        const current = dailyTotals.get(dateKey) || 0;
        dailyTotals.set(dateKey, current + Number(g.monto));
      }
    });

    // Convert to array and sort by date
    const sortedDays = Array.from(dailyTotals.entries())
      .map(([date, total]) => ({ date, total }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate bar heights
    const maxTotal = Math.max(...sortedDays.map(d => d.total), 1);
    const availableHeight = this.chartHeight - (2 * this.chartPadding);

    // Update chart dimensions based on number of days
    const numDays = sortedDays.length;
    const base = this.chartPadding * 2 + numDays * (this.barWidth + this.barGap);
    this.chartWidth = Math.min(900, Math.max(520, base + 40));

    this.dailyExpenseData = sortedDays.map(day => ({
      date: day.date,
      label: new Date(day.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      total: day.total,
      barHeight: (day.total / maxTotal) * availableHeight
    }));
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
