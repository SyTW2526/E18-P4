import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-create-gasto',
  standalone: true,
  imports: [CommonModule, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatCardModule, MatDatepickerModule, MatNativeDateModule],
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
  creating = false;

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id') || '';
    this.loadMembers();
    const me = this.auth.getUser();
    this.pagador = me?._id || me?.id || null;
  }

  loadMembers() {
    this.auth.getMembersForGroup(this.accountId).subscribe({
      next: (res: any) => {
        this.miembros = Array.isArray(res) ? res : (res?.data || []);
      },
      error: () => (this.miembros = []),
    });
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
    this.auth.createGasto(payload).subscribe({
      next: () => {
        this.creating = false;
        this.router.navigate(['/group', this.accountId]);
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
