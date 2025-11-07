import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SharedAccountService } from '../shared-account.service';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-shared-accounts-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <section style="max-width:900px; width:100%">
      <h2>Cuentas compartidas</h2>
      <div style="display:flex;gap:1rem;align-items:flex-end;flex-wrap:wrap">
        <form (ngSubmit)="create()" style="display:flex;gap:0.5rem;align-items:flex-end">
          <mat-form-field style="width:220px">
            <input matInput placeholder="Nombre" [(ngModel)]="model.nombre" name="nombre" required (ngModelChange)="clearError()" />
          </mat-form-field>
          <mat-form-field style="width:220px">
            <input matInput placeholder="Descripción" [(ngModel)]="model.descripcion" name="descripcion" (ngModelChange)="clearError()" />
          </mat-form-field>
          <mat-form-field style="width:120px">
            <input matInput placeholder="Moneda" [(ngModel)]="model.moneda" name="moneda" (ngModelChange)="clearError()" />
          </mat-form-field>
          <button mat-raised-button color="primary" type="submit" [disabled]="loading">{{ loading ? 'Creando...' : 'Crear cuenta' }}</button>
        </form>
        <div *ngIf="error" style="color:#b00020;font-size:0.9rem">{{ error }}</div>
      </div>
      <ul>
        <li *ngFor="let g of groups">
          <strong>{{ g.nombre }}</strong> — {{ g.descripcion || '' }}
          <a [routerLink]="['/shared-accounts', g._id, 'balances']">Ver balances</a>
          &nbsp;|&nbsp;
          <a [routerLink]="['/shared-accounts', g._id, 'gastos']">Gastos</a>
          &nbsp;|&nbsp;
          <a [routerLink]="['/shared-accounts', g._id, 'participaciones']">Participaciones</a>
          &nbsp;|&nbsp;
          <a [routerLink]="['/shared-accounts', g._id, 'members']">Miembros</a>
        </li>
      </ul>
    </section>
  `,
})
export class SharedAccountsListComponent implements OnInit {
  groups: any[] = [];
  model: any = { nombre: '', descripcion: '', moneda: 'EUR' };
  loading = false;
  error: string | null = null;

  constructor(private svc: SharedAccountService, private router: Router) {}

  ngOnInit(): void {
    if (typeof window !== 'undefined') this.load();
  }

  load() {
    this.svc.getSharedAccounts().subscribe((arr) => (this.groups = arr || []));
  }

  create() {
    this.clearError();
    this.loading = true;
    const payload = { ...this.model };
    this.svc.createSharedAccount(payload).subscribe({
      next: () => {
        this.loading = false;
        this.model = { nombre: '', descripcion: '', moneda: 'EUR' };
        this.load();
      },
      error: (e) => {
        this.loading = false;
        this.error = e?.error?.message || e?.message || 'Error creando la cuenta';
        console.error('create shared account error', e);
      },
    });
  }

  clearError() {
    this.error = null;
  }
}
