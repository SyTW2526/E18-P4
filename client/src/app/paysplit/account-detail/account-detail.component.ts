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
        <h2 style="margin:0">Añadir Gasto</h2>
      </div>

      <div style="margin:0.5rem 0">
        <mat-button-toggle-group appearance="legacy" value="gasto">
          <mat-button-toggle value="gasto">Gasto</mat-button-toggle>
          <mat-button-toggle value="ingreso">Ingreso</mat-button-toggle>
          <mat-button-toggle value="transferencia">Transferencia</mat-button-toggle>
        </mat-button-toggle-group>
      </div>

      <div style="margin-top:0.5rem">
        <mat-form-field style="width:100%">
          <input matInput placeholder="Por ejemplo, Bebidas" name="descripcion" [(ngModel)]="newGasto.descripcion" required />
          <button mat-icon-button matSuffix type="button" aria-label="Tag"><mat-icon>sell</mat-icon></button>
          <button mat-icon-button matSuffix type="button" aria-label="Foto"><mat-icon>photo_camera</mat-icon></button>
        </mat-form-field>
      </div>

      <div style="display:flex;gap:0.5rem;align-items:center;margin-top:0.5rem">
        <mat-form-field style="flex:1">
          <input matInput placeholder="0,00" name="monto" type="number" [(ngModel)]="newGasto.monto" required />
        </mat-form-field>
        <mat-form-field style="width:120px">
          <mat-select [(ngModel)]="newGasto.moneda" name="moneda">
            <mat-option value="EUR">€</mat-option>
            <mat-option value="USD">$</mat-option>
            <mat-option value="GBP">£</mat-option>
          </mat-select>
        </mat-form-field>
      </div>

      <div style="display:flex;gap:0.5rem;align-items:center;margin-top:0.75rem">
        <div style="flex:1">
          <label style="display:block;font-weight:600;margin-bottom:0.25rem">Pagado por</label>
          <mat-form-field style="width:100%">
            <mat-select name="pagador" [(ngModel)]="selectedPayer" required>
              <mat-option *ngFor="let m of miembros" [value]="m._id">{{ displayMember(m) }}</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <div style="min-width:220px">
          <label style="display:block;font-weight:600;margin-bottom:0.25rem">Cuando</label>
          <mat-form-field style="width:100%">
            <input matInput [matDatepicker]="picker" name="fecha" [(ngModel)]="newGasto.fecha" />
            <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
          </mat-form-field>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;align-items:center;margin-top:0.5rem">
        <div style="display:flex;align-items:center;gap:0.5rem">
          <mat-checkbox [(ngModel)]="splitEnabled" name="split">Dividir</mat-checkbox>
        </div>
        <div>
          <mat-form-field>
            <mat-select [(ngModel)]="splitMode" name="splitMode" style="min-width:120px">
              <mat-option value="equal">Igualmente</mat-option>
              <mat-option value="custom">Personalizado</mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      <mat-card style="margin-top:0.5rem">
        <div *ngFor="let p of participantes; let i = index" style="display:flex;align-items:center;justify-content:space-between;padding:0.5rem 0;border-bottom:1px solid rgba(0,0,0,0.06)">
          <div style="display:flex;align-items:center;gap:0.75rem">
            <mat-checkbox [(ngModel)]="participantes[i].included" name="inc{{i}}"></mat-checkbox>
            <div>{{ displayMember(miembros[i]) }}</div>
          </div>
          <div style="min-width:120px;text-align:right">{{ participantes[i].amount ? (participantes[i].amount | number:'1.2-2') : '0,00' }} {{ newGasto.moneda || '€' }}</div>
        </div>
      </mat-card>

      <div style="margin-top:1rem">
        <button mat-raised-button color="primary" style="width:100%;height:48px;font-size:16px" (click)="createGastoFromForm()" [disabled]="creating">Añadir</button>
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
        const rawMiembros = Array.isArray(acc?.miembros) ? acc.miembros : [];
        // rawMiembros may be array of ids or objects; resolve ids to full user objects
        const observables = rawMiembros.map((m: any) => {
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
                const id = rawMiembros[i];
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
            this.miembros = rawMiembros.map((m: any) => (typeof m === 'object' ? m : { _id: m }));
            // ensure current user is included
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

  removeGasto(id: string) {
    if (!confirm('¿Eliminar este gasto?')) return;
    this.auth.deleteGasto(id).subscribe({
      next: () => this.loadGastos(),
      error: (err: any) => alert('No se pudo eliminar el gasto: ' + (err?.error?.message || err?.message || 'Error')),
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
    // determine base label
    let label = '';
    if (typeof m === 'object') {
      label = m.nombre || m.email || m._id || JSON.stringify(m);
    } else {
      label = String(m).slice(0, 12);
    }
    // if this is the current user, append (yo)
    if (me && (id === me._id || id === me.id)) return `${label} (yo)`;
    return label;
  }
}
