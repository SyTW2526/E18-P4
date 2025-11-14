import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'app-create-gasto',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatDatepickerModule, MatNativeDateModule, MatIconModule, MatCheckboxModule, MatListModule, MatDividerModule],
  template: `
    <section style="max-width:900px;margin:0 auto">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <h2 style="margin:0">Añadir gasto</h2>
      </div>

      <mat-card>
        <mat-form-field style="width:100%">
          <input matInput placeholder="Descripción" [(ngModel)]="descripcion" name="descripcion" />
        </mat-form-field>

        <div style="display:flex;gap:0.5rem;align-items:center">
          <mat-form-field style="flex:1">
            <input matInput placeholder="Monto" type="number" [(ngModel)]="monto" name="monto" />
          </mat-form-field>
          <mat-form-field style="width:120px">
            <mat-select [(ngModel)]="moneda" name="moneda">
              <mat-option value="EUR">€</mat-option>
              <mat-option value="USD">$</mat-option>
              <mat-option value="GBP">£</mat-option>
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field style="width:100%;margin-top:0.5rem">
          <mat-select [(ngModel)]="pagador" name="pagador" placeholder="Pagado por">
            <mat-option *ngFor="let m of miembros" [value]="m._id || m.id">{{ displayMember(m) }}</mat-option>
          </mat-select>
        </mat-form-field>

        <div style="margin-top:1rem">
          <mat-checkbox [(ngModel)]="dividir" name="dividir" (change)="recalcSplit()">Dividir</mat-checkbox>

          <mat-divider style="margin:0.5rem 0"></mat-divider>

          <div *ngFor="let p of participaciones; let i = index" style="display:flex;align-items:center;gap:0.5rem;padding:0.5rem 0">
            <mat-checkbox [(ngModel)]="p.selected" (change)="onToggleParticipant(i)"></mat-checkbox>
            <div style="flex:1">{{ displayMember(p.user) }}</div>
            <mat-form-field style="width:140px;margin:0">
              <input matInput type="number" [(ngModel)]="p.monto_asignado" (ngModelChange)="onAmountChange(i)" />
            </mat-form-field>
          </div>
        </div>

        <div style="margin-top:1rem;display:flex;gap:0.5rem">
          <button mat-raised-button color="primary" (click)="createGasto()" [disabled]="creating">Añadir</button>
          <button mat-button (click)="goBack()">Cancelar</button>
        </div>
      </mat-card>
    </section>
  `,
})
export class CreateGastoComponent implements OnInit {
  accountId = '';
  descripcion = '';
  monto: number | null = null;
  moneda = 'EUR';
  pagador: string | null = null;
  miembros: any[] = [];
  participaciones: Array<{ user: any; selected: boolean; monto_asignado: number }> = [];
  dividir = true;
  creating = false;
  editMode = false;
  gastoId: string | null = null;

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {}

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
          this.dividir = true;
          // date parsing
          try { if (g.fecha) this.pagador = this.pagador || null } catch(e) {}
          // we don't currently load participaciones here (out of scope)
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
        });
      },
      error: () => {
        const me = this.auth.getUser();
        this.miembros = me ? [me] : [];
        this.pagador = this.pagador || (me?._id || me?.id || null);
        this.participaciones = this.miembros.map((u: any) => ({ user: u, selected: true, monto_asignado: 0 }));
      },
    });
  }

  onToggleParticipant(index: number) {
    // if dividir mode is on, recalc split across selected
    if (this.dividir) this.recalcSplit();
  }

  onAmountChange(index: number) {
    // manual edits currently don't change dividir behavior; kept for future extension
  }

  recalcSplit() {
    if (!this.dividir) return;
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

  createGasto() {
    if (!this.descripcion || !this.monto || !this.pagador) return;
    this.creating = true;
    const payload: any = {
      id_grupo: this.accountId,
      descripcion: this.descripcion,
      monto: Number(this.monto),
      id_pagador: String(this.pagador),
      fecha: new Date(),
      categoria: '',
    };

    if (this.editMode && this.gastoId) {
      // update existing gasto (participaciones not handled here)
      this.auth.updateGasto(this.gastoId, payload).subscribe({
        next: () => {
          this.creating = false;
          this.router.navigate(['/group', this.accountId]);
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

  goBack() {
    this.router.navigate(['/group', this.accountId]);
  }
}
