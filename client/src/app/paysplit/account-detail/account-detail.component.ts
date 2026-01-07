import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../core/language.service';
import { catchError, forkJoin, of, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
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
  templateUrl: './account-detail.component.html',
  styleUrls: ['./account-detail.component.css'],
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

  // Delete gasto confirmation modal state
  showDeleteGastoModal = false;
  gastoToDelete: string | null = null;
  deletingGasto = false;

  // Chart properties
  chartWidth = 800;
  chartHeight = 380;
  chartPadding = 50;
  barWidth = 32;
  barGap = 8;
  dailyExpenseData: Array<{ date: string; label: string; total: number; barHeight: number }> = [];
  
  // Balance properties
  userNetBalance: number = 0;
  loadingBalance = false;
  abs = Math.abs;

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router, public lang: LanguageService) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id') || '';
    // optionally get account name from history state
    const state = window.history.state || {};
    if (state?.accountName) this.accountName = state.accountName;
    this.loadAccountAndGastos();
    this.loadUserBalance();
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
        const baseGastos = Array.isArray(res) ? res : (res?.data || []);
        // normalize fecha if it's a string
        const normalized = baseGastos.map((g: any) => ({ ...g, fecha: g.fecha ? new Date(g.fecha) : null }));

        // fetch participaciones for each gasto and attach
        const withParticipaciones$: Array<Observable<any>> = normalized.map((g: any) => {
          const gid = g?._id?.toString ? g._id.toString() : (g?._id || g?.id);
          if (!gid) return of(g);
          return this.auth.getParticipacionesForGasto(String(gid)).pipe(
            map((parts: any[]) => {
              const normalizedParts = (parts || []).map((p: any) => {
                const amount = Number(p.monto_asignado ?? p.monto ?? p.amount ?? 0);
                const userId = p.id_usuario ?? p.userId ?? p.id;
                return { ...p, amount, userId };
              });
              return { ...g, participacion: normalizedParts };
            }),
            catchError(() => of(g))
          );
        });

        if (withParticipaciones$.length) {
          forkJoin(withParticipaciones$).subscribe({
            next: (full: any[]) => {
              this.gastos = full;
              this.calculateDailyExpenses();
              this.loading = false;
            },
            error: () => {
              // fallback without participacion
              this.gastos = normalized;
              this.calculateDailyExpenses();
              this.loading = false;
            }
          });
        } else {
          this.gastos = normalized;
          this.calculateDailyExpenses();
          this.loading = false;
        }
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

  loadUserBalance() {
    this.loadingBalance = true;
    this.auth.getDetailedBalancesForGroup(this.accountId).subscribe({
      next: (detailed: any) => {
        this.loadingBalance = false;
        const me = this.auth.getUser();
        const myId = me?._id || me?.id;
        if (me && Array.isArray(detailed)) {
          const myBalance = detailed.find((d: any) => {
            const userId = d?.userId || d?.user?._id || d?.user?.id;
            return userId && (userId === myId);
          });
          if (myBalance) {
            // Calculate net balance: what others owe me (positive) minus what I owe others (negative)
            const iOwe = (myBalance.owes || []).reduce((sum: number, debt: any) => sum + (Number(debt.amount) || 0), 0);
            const owedToMe = (myBalance.owesMoney || []).reduce((sum: number, debt: any) => sum + (Number(debt.amount) || 0), 0);
            // Net = what I'm owed minus what I owe (positive means they owe me, negative means I owe)
            this.userNetBalance = owedToMe - iOwe;
          } else {
            this.userNetBalance = 0;
          }
        } else {
          this.userNetBalance = 0;
        }
      },
      error: () => {
        this.loadingBalance = false;
      }
    });
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
    this.gastoToDelete = id;
    this.showDeleteGastoModal = true;
  }

  confirmDeleteGasto() {
    if (!this.gastoToDelete) return;
    this.deletingGasto = true;
    this.auth.deleteGasto(this.gastoToDelete).subscribe({
      next: () => {
        this.deletingGasto = false;
        this.showDeleteGastoModal = false;
        this.gastoToDelete = null;
        this.loadGastos();
      },
      error: (err: any) => {
        this.deletingGasto = false;
        this.error = 'No se pudo eliminar el gasto: ' + (err?.error?.message || err?.message || 'Error');
      },
    });
  }

  closeDeleteGastoModal() {
    this.showDeleteGastoModal = false;
    this.gastoToDelete = null;
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

  getExpenseImpactForUser(gasto: any): number {
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) return 0;

    const isUserPayer = gasto.id_pagador === myId;
    const totalAmount = Number(gasto.monto) || 0;
    
    // Get participantes - try different possible field names
    const participantes = gasto.participacion || gasto.participants || gasto.shares || [];
    
    // Use participacion if present
    const participantCount = participantes?.length || 0;

    // If no participantes data, calculate equal split assumption
    if (!participantes || participantCount === 0) {
      if (isUserPayer) {
        // Payer fronted the whole amount; others owe them
        return totalAmount;
      }
      return 0; // Can't determine impact without participation data
    }

    // Find user's participation (if exists)
    const userParticipation = participantes.find((p: any) => {
      const userId = p.userId || p.id_usuario || p.id;
      return userId === myId;
    });

    // If we have an explicit amount, use it; otherwise treat as unknown (0) to avoid forced equal split
    const rawShare = Number(userParticipation?.amount ?? userParticipation?.monto_asignado ?? userParticipation?.monto);
    const userShare = Number.isFinite(rawShare) && rawShare > 0 ? rawShare : 0;

    if (!userParticipation) {
      // User not in participantes
      if (isUserPayer) {
        return -totalAmount; // They paid full amount
      }
      return 0; // User has no stake in this expense
    }

    if (isUserPayer) {
      // Impact: amount others owe them (what they paid minus their share)
      return totalAmount - userShare;
    }

    // User didn't pay, they owe their share
    return -userShare;
  }
}
