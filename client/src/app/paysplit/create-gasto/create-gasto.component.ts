import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../core/language.service';
import { NotificationService } from '../../core/notification.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { ClickOutsideDirective } from '../../shared/click-outside.directive';

@Component({
  selector: 'app-create-gasto',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatCardModule, MatDatepickerModule, MatNativeDateModule, MatIconModule, MatCheckboxModule, MatListModule, MatDividerModule, MatSelectModule, ClickOutsideDirective],
  encapsulation: ViewEncapsulation.None,
  template: `
    <section class="gasto-square-fields" style="width:60vw;max-width:1300px;margin:0 auto;padding:2.5rem 1.5rem 0 1.5rem;box-sizing:border-box;">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <h2 style="margin:0">{{ editMode ? lang.t('edit') + ' ' + lang.t('expenses').toLowerCase() : lang.t('addExpense') }}</h2>
      </div>


      <mat-card style="width:100%;max-width:1300px;box-sizing:border-box;margin:0 auto;">
        <!-- Custom Description Field -->
        <div class="custom-dropdown-container" style="margin-bottom: 1rem;">
          <input
            class="custom-dropdown-trigger"
            style="width: 100%;"
            [placeholder]="lang.t('description')"
            [(ngModel)]="descripcion"
            name="descripcion"
            type="text"
          />
        </div>

        <div style="display:flex;gap:1.5rem;align-items:stretch;width:100%;flex-wrap:wrap;">
          <!-- Custom Amount Field -->
          <div class="custom-dropdown-container" style="flex:0 0 160px; max-width:100%; min-width:120px; margin-right:1.5rem;">
            <input
              class="custom-dropdown-trigger"
              [placeholder]="lang.t('amount')"
              [(ngModel)]="monto"
              name="monto"
              type="number"
              step="0.01"
            />
          </div>
          <!-- Custom Currency Dropdown (unchanged) -->
          <div class="custom-dropdown-container" style="flex:0 0 110px; max-width:100%;" [appClickOutsideEnabled]="currencyMenuOpen" (appClickOutside)="currencyMenuOpen = false">
            <button type="button" class="custom-dropdown-trigger currency-dropdown-btn" (click)="currencyMenuOpen = !currencyMenuOpen">
              <span class="dropdown-label">{{ lang.t('currency') }}:</span>
              <span class="dropdown-value">{{ moneda }}</span>
              <mat-icon [ngClass]="{'dropdown-arrow-open': currencyMenuOpen}" style="font-size:18px;vertical-align:middle">arrow_drop_down</mat-icon>
            </button>
            <div *ngIf="currencyMenuOpen" class="custom-dropdown-menu">
              <button class="custom-menu-item" *ngFor="let opt of ['EUR', 'USD', 'GBP']" (click)="moneda = opt; currencyMenuOpen = false">
                <span>{{ opt }}</span>
                <mat-icon *ngIf="moneda === opt" style="margin-left:auto">check</mat-icon>
              </button>
            </div>
          </div>
          <!-- Custom Date Field -->
            <div class="custom-dropdown-container" style="flex:0 0 220px; max-width:100%;">
            <input
              class="custom-dropdown-trigger"
              [placeholder]="lang.t('date')"
              [(ngModel)]="fecha"
              name="fecha"
              type="date"
            />
          </div>
        </div>


        <div class="custom-dropdown-container" style="width:100%;margin-top:1rem;">
          <button type="button" class="custom-dropdown-trigger currency-dropdown-btn" style="width:100%;" (click)="pagadorMenuOpen = !pagadorMenuOpen">
            <span class="dropdown-label">{{ lang.t('paidBy') }}:</span>
            <span class="dropdown-value">{{ displayMember(getMemberById(pagador)) }}</span>
            <mat-icon [ngClass]="{'dropdown-arrow-open': pagadorMenuOpen}" style="font-size:18px;vertical-align:middle">arrow_drop_down</mat-icon>
          </button>
          <div *ngIf="pagadorMenuOpen" class="custom-dropdown-menu">
            <button class="custom-menu-item" *ngFor="let m of miembros" (click)="pagador = m._id || m.id; pagadorMenuOpen = false">
              <span>{{ displayMember(m) }}</span>
              <mat-icon *ngIf="pagador === (m._id || m.id)" style="margin-left:auto">check</mat-icon>
            </button>
          </div>
        </div>


        <div style="margin-top:1rem">
              <button mat-raised-button type="button" (click)="recalcSplit()" class="auto-divide-btn"
                style="background: var(--primary-color); color: var(--text-contrast)">{{ lang.t('divide') }}</button>

          <mat-divider style="margin:0.5rem 0"></mat-divider>

          <div *ngFor="let p of participaciones; let i = index" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0">
            <mat-checkbox [(ngModel)]="p.selected" (change)="onToggleParticipant(i)"></mat-checkbox>
            <div style="flex:1">{{ displayMember(p.user) }}</div>
            <div class="custom-dropdown-container participant-amount-container" style="margin:0">
              <input
                class="custom-dropdown-trigger participant-amount-input"
                [placeholder]="lang.t('amount')"
                type="number"
                step="0.01"
                [(ngModel)]="p.monto_asignado"
                (ngModelChange)="onAmountChange(i)"
              />
            </div>
          </div>
        </div>

        <div style="margin-top:1rem;display:flex;gap:0.5rem">
          <button mat-raised-button color="primary" (click)="createGasto()" [disabled]="creating">{{ lang.t('add') }}</button>
          <button mat-button (click)="goBack()">{{ lang.t('cancel') }}</button>
        </div>
      </mat-card>
    </section>
  `,
  styles: [`
    .full-width {
      width: 100%;
    }
    .amount-field {
      flex: 1;
      min-width: 150px;
    }
    .custom-dropdown-container {
      position: relative;
      width: 100%;
    }
    .custom-dropdown-trigger {
      padding: 12px 16px;
      background: var(--secondary-bg);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      color: var(--text-main);
      font-size: 1rem;
      text-align: left;
      cursor: pointer;
      transition: background 120ms;
      width: 100%;
      box-sizing: border-box;
      display: block;
      height: 48px;
      min-height: 48px;
      max-height: 48px;
      line-height: 24px;
    }
    .dropdown-label {
      font-size: 0.85em;
      color: var(--text-muted);
      margin-right: 0.25em;
      white-space: nowrap;
    }
    .custom-dropdown-trigger[type="date"],
    .custom-dropdown-trigger[type="number"] {
      min-height: 48px;
    }
    /* Only restrict width for participant amount fields at the bottom */
    .participant-amount-container {
      width: 140px !important;
      max-width: 140px !important;
      min-width: 0 !important;
    }
    .participant-amount-input {
      max-width: 140px !important;
      width: 100% !important;
      min-width: 0 !important;
    }
    .custom-dropdown-trigger:hover, .custom-dropdown-trigger:focus {
      background: rgba(255,255,255,0.04);
    }
    .custom-dropdown-menu {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--secondary-bg);
      border: 1px solid var(--divider-color);
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      margin-top: 8px;
      min-width: 200px;
    }
    .custom-menu-item {
      display: flex;
      align-items: center;
      width: 100%;
      padding: 12px 16px;
      background: none;
      border: none;
      color: var(--text-main) !important;
      cursor: pointer;
      font-size: 0.95rem;
      text-align: left;
      transition: background 120ms ease;
    }
    .custom-menu-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }
    .custom-menu-item:first-child {
      border-radius: 4px 4px 0 0;
    }
    .custom-menu-item:last-child {
      border-radius: 0 0 4px 4px;
    }
    .auto-divide-btn {
      transition: filter 120ms ease, box-shadow 120ms ease, transform 120ms ease;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .auto-divide-btn:hover {
      filter: brightness(1.06);
      transform: translateY(-1px);
      box-shadow: 0 6px 14px var(--primary-shadow);
    }
    .auto-divide-btn:active {
      transform: translateY(0);
      filter: brightness(0.98);
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
    }
    .currency-dropdown-btn {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      gap: 0.4em;
      width: 100%;
      height: 100%;
      line-height: 1;
    }
    .currency-dropdown-btn mat-icon {
      align-self: center;
      margin-top: 0 !important;
      margin-bottom: 0 !important;
      vertical-align: middle !important;
      line-height: 1 !important;
      height: 24px !important;
      width: 24px !important;
      display: inline-flex !important;
    }
    .dropdown-arrow-open {
      transform: rotate(180deg);
      transition: transform 0.2s;
    }
  `],
})
export class CreateGastoComponent implements OnInit {
  accountId = '';
  descripcion = '';
  monto = '';
  moneda = 'EUR';
  fecha: any = new Date();
  pagador: string | null = null;
  miembros: any[] = [];
  participaciones: Array<{ user: any; selected: boolean; monto_asignado: number }> = [];
  creating = false;
  editMode = false;
  gastoId: string | null = null;
  currencyMenuOpen = false;
  pagadorMenuOpen = false;
  private membersReadyResolve: (() => void) | null = null;
  private membersReady: Promise<void> = new Promise((r) => (this.membersReadyResolve = r));

  constructor(
    private route: ActivatedRoute, 
    private auth: AuthService, 
    private router: Router, 
    public lang: LanguageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id') || '';
    this.gastoId = this.route.snapshot.paramMap.get('gastoId') || null;
    this.loadMembers();
    const me = this.auth.getUser();
    this.pagador = me?._id || me?.id || null;

    if (this.gastoId) {
      // load gasto to edit
      this.editMode = true;
      this.auth.getGastoById(this.gastoId).subscribe({
        next: (g: any) => {
          this.descripcion = g.descripcion || '';
          this.monto = g.monto || null;
          this.moneda = g.moneda || 'EUR';
          this.pagador = g.id_pagador || this.pagador;
          // date parsing
          try { this.fecha = g.fecha ? new Date(g.fecha) : this.fecha; } catch(e) {}
          // wait for members to be ready, then load participaciones for this gasto
          if (this.membersReady) {
            this.membersReady.then(() => {
              if (this.gastoId) this.loadParticipacionesForGasto(this.gastoId);
            });
          }
        },
        error: (err: any) => {
          console.error('Failed to load gasto for edit', err);
        }
      });
    }
  }

  loadMembers() {
    this.auth.getMembersForGroup(this.accountId).subscribe({
      next: (res: any) => {
        const raw = Array.isArray(res) ? res : (res?.data || []);
        if (!raw.length) {
          // ensure current user is present even if no members returned
          const me = this.auth.getUser();
          this.miembros = me ? [me] : [];
          this.pagador = this.pagador || (me?._id || me?.id || null);
          return;
        }

        const observables = raw.map((m: any) => {
          if (!m) return of(null);
          // if we already have a full user object, keep it
          if (typeof m === 'object' && (m.nombre || m.email)) return of(m);
          // if it's an object with only _id, try to resolve full user
          if (typeof m === 'object' && (m._id || m.id)) return this.auth.getUserById(String(m._id || m.id)).pipe(catchError(() => of(m)));
          // otherwise assume it's an id string
          return this.auth.getUserById(String(m)).pipe(catchError(() => of({ _id: String(m) })));
        });

        (forkJoin(observables) as any).subscribe((resolved: any[]) => {
          this.miembros = resolved.map((r: any, i: number) => {
            if (!r) {
              const id = raw[i];
              return { _id: id };
            }
            return r;
          });
          // ensure current user is included
          const me = this.auth.getUser();
          const meId = me?._id || me?.id;
          if (meId && !this.miembros.find((x: any) => String(x._id || x.id) === String(meId))) {
            this.miembros.unshift(me);
          }
          // default selected payer is current user if not set
          this.pagador = this.pagador || meId || (this.miembros.length ? this.miembros[0]._id || this.miembros[0].id : null);
          // build participaciones array defaulting to all members selected
          this.participaciones = this.miembros.map((u: any) => ({ user: u, selected: true, monto_asignado: 0 }));
          // compute initial split if monto available
          setTimeout(() => this.recalcSplit());
          // signal members ready for consumers (e.g., edit mode)
          if (this.membersReadyResolve) { this.membersReadyResolve(); this.membersReadyResolve = null; }
        }, () => {
          // fallback: use raw as minimal objects
          this.miembros = raw.map((m: any) => (typeof m === 'object' ? m : { _id: m }));
          const me = this.auth.getUser();
          const meId = me?._id || me?.id;
          if (meId && !this.miembros.find((x: any) => String(x._id || x.id) === String(meId))) {
            this.miembros.unshift(me);
          }
          this.pagador = this.pagador || meId || (this.miembros.length ? this.miembros[0]._id || this.miembros[0].id : null);
          this.participaciones = this.miembros.map((u: any) => ({ user: u, selected: true, monto_asignado: 0 }));
          setTimeout(() => this.recalcSplit());
          if (this.membersReadyResolve) { this.membersReadyResolve(); this.membersReadyResolve = null; }
        });
      },
      error: () => {
        const me = this.auth.getUser();
        this.miembros = me ? [me] : [];
        this.pagador = this.pagador || (me?._id || me?.id || null);
        this.participaciones = this.miembros.map((u: any) => ({ user: u, selected: true, monto_asignado: 0 }));
        if (this.membersReadyResolve) { this.membersReadyResolve(); this.membersReadyResolve = null; }
      },
    });
  }

  loadParticipacionesForGasto(gastoId: string) {
    this.auth.getParticipacionesForGasto(gastoId).subscribe({
      next: (parts: any[]) => {
        // map server participaciones onto this.participaciones by user id
        if (!Array.isArray(parts)) return;
        parts.forEach((p) => {
          // find matching participant entry
          const uid = String(p.id_usuario || p.id_usuario);
          const found = this.participaciones.find((x) => String(x.user?._id || x.user?.id || x.user) === String(uid));
          if (found) {
            found.monto_asignado = Number(p.monto_asignado || 0);
            found.selected = (Number(p.monto_asignado || 0) > 0) || true;
          } else {
            // if user not in miembros, add it
            this.participaciones.push({ user: { _id: uid }, selected: true, monto_asignado: Number(p.monto_asignado || 0) });
          }
        });
      },
      error: (err) => {
        console.warn('Failed to load participaciones for gasto', err);
      }
    });
  }

  onToggleParticipant(index: number) {
    // Manual toggling does not auto-recalculate; use the button to re-divide.
  }

  onAmountChange(index: number) {
    // manual edits currently don't change dividir behavior; kept for future extension
  }

  recalcSplit() {
    const total = Number(this.monto) || 0;
    const selected = this.participaciones.filter((p) => p.selected);
    const n = selected.length || 1;
    const per = n ? +(total / n).toFixed(2) : 0;
    // reset all assigned amounts to 0, then populate selected
    this.participaciones.forEach((p) => (p.monto_asignado = 0));
    selected.forEach((p) => (p.monto_asignado = per));
    // adjust rounding difference on first participant
    const assignedSum = this.participaciones.reduce((s, p) => s + Number(p.monto_asignado || 0), 0);
    const diff = +(total - assignedSum).toFixed(2);
    if (Math.abs(diff) >= 0.01 && selected.length > 0) {
      selected[0].monto_asignado = +(Number(selected[0].monto_asignado || 0) + diff).toFixed(2);
    }
  }

  displayMember(m: any) {
    if (!m) return '—';
    if (typeof m === 'object') return m.nombre || m.email || m._id || JSON.stringify(m);
    return String(m).slice(0, 12);
  }

  getMemberById(id: any): any {
    if (!id) return null;
    return this.miembros.find((m: any) => String(m._id || m.id) === String(id));
  }

  createGasto() {
    if (!this.descripcion || !this.monto || !this.pagador) return;
    this.creating = true;
    const payload: any = {
      id_grupo: this.accountId,
      descripcion: this.descripcion,
      monto: Number(this.monto),
      id_pagador: String(this.pagador),
      fecha: this.fecha ? new Date(this.fecha) : new Date(),
      categoria: '',
    };

    if (this.editMode && this.gastoId) {
      // update existing gasto and its participaciones
      this.auth.updateGasto(this.gastoId, payload).subscribe({
        next: () => {
          // after gasto updated, refresh participaciones: delete existing ones and create new
          const gastoId = this.gastoId as string;
          this.auth.getParticipacionesForGasto(gastoId).subscribe({
            next: (existing: any[]) => {
              const deletes = (existing || []).map((p) => this.auth.deleteParticipacion(String(p._id || p.id))).concat();
              // run deletes first
              (forkJoin(deletes.length ? deletes : [of(null)]) as any).subscribe({
                next: () => {
                  // create new participaciones from current form
                  const selectedParts = this.participaciones.filter((p) => p.selected && (Number(p.monto_asignado) > 0 || Number(this.monto) === 0));
                  const calls = selectedParts.map((p) => this.auth.createParticipacion({ id_usuario: String(p.user._id || p.user.id), id_gasto: gastoId, monto_asignado: Number(p.monto_asignado) }));
                  (forkJoin(calls.length ? calls : [of(null)]) as any).subscribe({
                    next: () => { 
                      this.sendEditNotificationsToParticipants(gastoId, selectedParts);
                      this.creating = false; 
                      this.router.navigate(['/group', this.accountId]); 
                    },
                    error: (err2: any) => { this.creating = false; console.error('createParticipaciones error', err2); }
                  });
                },
                error: (errDel: any) => { this.creating = false; console.error('deleteParticipaciones error', errDel); }
              });
            },
            error: (errGet: any) => {
              // cannot fetch existing, still attempt to create from current form
              const selectedParts = this.participaciones.filter((p) => p.selected && (Number(p.monto_asignado) > 0 || Number(this.monto) === 0));
              const calls = selectedParts.map((p) => this.auth.createParticipacion({ id_usuario: String(p.user._id || p.user.id), id_gasto: gastoId, monto_asignado: Number(p.monto_asignado) }));
              (forkJoin(calls.length ? calls : [of(null)]) as any).subscribe({
                next: () => { 
                  this.sendEditNotificationsToParticipants(gastoId, selectedParts);
                  this.creating = false; 
                  this.router.navigate(['/group', this.accountId]); 
                },
                error: (err2: any) => { this.creating = false; console.error('createParticipaciones error', err2); }
              });
            }
          });
        },
        error: (err: any) => {
          this.creating = false;
          console.error('updateGasto error', err);
        }
      });
      return;
    }

    // otherwise create new gasto (existing behavior)
    this.auth.createGasto(payload).subscribe({
      next: (res: any) => {
        const gastoId = res?.id || res?.insertedId || null;
        if (!gastoId) {
          this.creating = false;
          console.error('createGasto: no gasto id returned', res);
          return;
        }

        // build participaciones payloads for selected participants
        const selectedParts = this.participaciones.filter((p) => p.selected && (p.monto_asignado > 0 || Number(this.monto) === 0));
        if (!selectedParts.length) {
          // fallback: create a single participacion for pagador with full amount
          const body = { id_usuario: String(this.pagador), id_gasto: String(gastoId), monto_asignado: Number(this.monto) };
          this.auth.createParticipacion(body).subscribe({
            next: () => {
              this.creating = false;
              this.router.navigate(['/group', this.accountId]);
            },
            error: (err: any) => {
              this.creating = false;
              console.error('createParticipacion error', err);
            },
          });
          return;
        }

        const calls = selectedParts.map((p) => {
          return this.auth.createParticipacion({ id_usuario: String(p.user._id || p.user.id), id_gasto: String(gastoId), monto_asignado: Number(p.monto_asignado) });
        });

        (forkJoin(calls) as any).subscribe({
          next: () => {
            // Enviar notificaciones a todos los participantes excepto el creador
            this.sendNotificationsToParticipants(gastoId, selectedParts);
            this.creating = false;
            this.router.navigate(['/group', this.accountId]);
          },
          error: (err: any) => {
            this.creating = false;
            console.error('createParticipaciones error', err);
          },
        });
      },
      error: (err: any) => {
        this.creating = false;
        console.error('createGasto error', err);
      },
    });
  }

  sendNotificationsToParticipants(gastoId: string, selectedParts: Array<{ user: any; selected: boolean; monto_asignado: number }>) {
    const me = this.auth.getUser();
    if (!me || !me._id) return;

    const creatorName = me.nombre || me.name || me.email || 'Alguien';
    
    // Enviar notificación a cada participante excepto el creador
    selectedParts.forEach(part => {
      const userId = String(part.user._id || part.user.id);
      if (userId === me._id) return; // No notificar al creador

      const notification = {
        tipo: 'gasto_creado' as const,
        de_usuario: me._id,
        para_usuario: userId,
        id_grupo: this.accountId,
        id_gasto: gastoId,
        mensaje: `${creatorName} creó un gasto: ${this.descripcion} (${Number(this.monto).toFixed(2)} ${this.moneda})`
      };

      this.notificationService.createNotification(notification).subscribe({
        next: () => {
          console.log('Notificación enviada a', userId);
        },
        error: (err: any) => {
          console.error('Error enviando notificación:', err);
        }
      });
    });
  }

  sendEditNotificationsToParticipants(gastoId: string, selectedParts: Array<{ user: any; selected: boolean; monto_asignado: number }>) {
    const me = this.auth.getUser();
    if (!me || !me._id) return;

    const editorName = me.nombre || me.name || me.email || 'Alguien';
    
    // Enviar notificación a cada participante excepto el editor
    selectedParts.forEach(part => {
      const userId = String(part.user._id || part.user.id);
      if (userId === me._id) return; // No notificar al editor

      const notification = {
        tipo: 'gasto_creado' as const,
        de_usuario: me._id,
        para_usuario: userId,
        id_grupo: this.accountId,
        id_gasto: gastoId,
        mensaje: `${editorName} editó un gasto: ${this.descripcion} (${Number(this.monto).toFixed(2)} ${this.moneda})`
      };

      this.notificationService.createNotification(notification).subscribe({
        next: () => {
          console.log('Notificación de edición enviada a', userId);
        },
        error: (err: any) => {
          console.error('Error enviando notificación de edición:', err);
        }
      });
    });
  }

  goBack() {
    this.router.navigate(['/group', this.accountId]);
  }
}
