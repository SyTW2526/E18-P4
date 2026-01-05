import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LanguageService } from '../../core/language.service';
import { NotificationService } from '../../core/notification.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatListModule, MatButtonModule, MatIconModule, MatExpansionModule],
  template: `
    <section style="max-width:1000px;margin:0 auto;padding-bottom:1.5rem">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem">
        <button mat-raised-button (click)="goBack()" style="background:var(--primary-color);color:white;display:flex;align-items:center;gap:0.5rem">
          <mat-icon>arrow_back</mat-icon>
          <span>Atrás</span>
        </button>
        <h2 style="margin:0">{{ lang.t('balances') }}</h2>
      </div>

      <div style="display:grid;grid-template-columns:1.1fr 0.9fr;gap:1rem;align-items:start">
        <!-- Panel: saldos de todos -->
        <mat-card>
          <div *ngIf="loading">{{ lang.t('loadingBalances') }}</div>
          <div *ngIf="error" style="color:crimson">{{ error }}</div>
          <h3 style="margin:0 0 0.5rem 0">Saldos por integrante</h3>
          <div *ngIf="!loading && !error && detailedBalances && detailedBalances.length > 0" style="display:flex;flex-direction:column;gap:0.75rem">
            <div *ngFor="let b of detailedBalances" style="display:flex;justify-content:space-between;align-items:flex-start;padding:0.75rem;background:#1a1a1a;border-radius:6px;border-left:4px solid #22c55e">
              <div style="flex:1">
                <div style="font-weight:700;font-size:1rem;color:#22c55e;margin-bottom:0.25rem">{{ b.userName || b.userEmail || '—' }}</div>
                <div style="font-size:0.85rem;color:#999;line-height:1.4">
                  <div>Pagó: <span style="color:#e0e0e0;font-weight:600">{{ b.paid | number:'1.2-2' }}</span></div>
                  <div>Su parte: <span style="color:#e0e0e0;font-weight:600">{{ b.share | number:'1.2-2' }}</span></div>
                </div>
              </div>
              <div style="text-align:right;min-width:100px">
                <div [style.color]="b.balance >= 0 ? 'limegreen' : 'crimson'" style="font-weight:700;font-size:1.15rem">
                  {{ b.balance >= 0 ? '+' : '' }}{{ (b.balance | number:'1.2-2') }}
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="!loading && !error && (!detailedBalances || detailedBalances.length === 0) && balances.length > 0" style="display:flex;flex-direction:column;gap:0.75rem">
            <div *ngFor="let b of balances" style="display:flex;justify-content:space-between;align-items:flex-start;padding:0.75rem;background:#1a1a1a;border-radius:6px;border-left:4px solid #22c55e">
              <div style="flex:1">
                <div style="font-weight:700;font-size:1rem;color:#22c55e;margin-bottom:0.25rem">{{ displayMember(b.user) }}</div>
                <div style="font-size:0.85rem;color:#999;line-height:1.4">
                  <div>Pagó: <span style="color:#e0e0e0;font-weight:600">{{ b.paid | number:'1.2-2' }}</span></div>
                  <div>Su parte: <span style="color:#e0e0e0;font-weight:600">{{ b.share | number:'1.2-2' }}</span></div>
                </div>
              </div>
              <div style="text-align:right;min-width:100px">
                <div [style.color]="b.balance >= 0 ? 'limegreen' : 'crimson'" style="font-weight:700;font-size:1.15rem">
                  {{ b.balance >= 0 ? '+' : '' }}{{ (b.balance | number:'1.2-2') }}
                </div>
              </div>
            </div>
          </div>
        </mat-card>

        <!-- Panel: deudas/cobros del usuario -->
        <mat-card>
          <h3 style="margin:0 0 0.5rem 0">Tus deudas y cobros</h3>
          <div *ngIf="!meDetailed" style="color:#666;font-size:0.95rem">No hay datos de balance para ti aún.</div>

          <div *ngIf="meDetailed">
            <div style="margin-bottom:0.25rem;font-weight:600;display:flex;align-items:center;gap:0.35rem">
              <mat-icon fontIcon="account_balance_wallet"></mat-icon>
              <span>Tu balance: <span [style.color]="meDetailed.balance >= 0 ? 'limegreen' : 'crimson'" style="font-weight:700">{{ meDetailed.balance >= 0 ? '+' : '-' }}{{ (abs(meDetailed.balance) | number:'1.2-2') }}</span></span>
            </div>

            <div *ngIf="myCredits && myCredits.length > 0" style="margin:0.5rem 0">
              <div style="font-weight:600;color:green;margin-bottom:0.35rem">Te deben</div>
              <ul style="list-style:none;padding:0;margin:0">
                <li *ngFor="let owe of myCredits" style="padding:0.45rem;background:#e8f5e9;margin:0.25rem 0;border-radius:4px;border-left:3px solid green;color:#333;display:flex;align-items:center;gap:0.5rem;justify-content:space-between;flex-wrap:wrap">
                  <span><strong>{{ displayMember(owe) }}</strong> te debe <span style="color:green;font-weight:700">{{ owe.amount | number:'1.2-2' }}</span></span>
                  <button mat-stroked-button color="accent"
                    (click)="requestPayment(owe)"
                    [disabled]="isRequesting(owe) || owe.amount <= 0">
                    {{ isRequesting(owe) ? 'Enviando...' : 'Reclamar pago' }}
                  </button>
                </li>
              </ul>
            </div>

            <div *ngIf="myDebts && myDebts.length > 0" style="margin:0.5rem 0">
              <div style="font-weight:600;color:crimson;margin-bottom:0.35rem">Tú debes</div>
              <ul style="list-style:none;padding:0;margin:0">
                <li *ngFor="let ow of myDebts" style="padding:0.45rem;background:#ffebee;margin:0.25rem 0;border-radius:4px;border-left:3px solid crimson;color:#333;display:flex;align-items:center;gap:0.5rem;justify-content:space-between;flex-wrap:wrap">
                  <span>Debes a <strong>{{ displayMember(ow) }}</strong> <span style="color:crimson;font-weight:700">{{ ow.amount | number:'1.2-2' }}</span></span>
                  <button mat-stroked-button color="primary"
                    (click)="payDebt(meDetailed, ow)"
                    [disabled]="isPaying(meDetailed, ow) || meDetailed.balance >= 0 || ow.amount <= 0">
                    {{ isPaying(meDetailed, ow) ? 'Pagando...' : 'Pagar' }}
                  </button>
                </li>
              </ul>
            </div>

            <div *ngIf="(!myDebts || myDebts.length === 0) && (!myCredits || myCredits.length === 0)" style="font-size:0.9rem;color:#999;font-style:italic">
              No tienes deudas ni cobros pendientes.
            </div>
          </div>
        </mat-card>
      </div>
    </section>
  `,
})
export class BalanceComponent implements OnInit {
  accountId = '';
  balances: Array<any> = [];
  detailedBalances: Array<any> = [];
  meDetailed: any | null = null;
  myDebts: Array<any> = [];
  myCredits: Array<any> = [];
  loading = false;
  error: string | null = null;
  payingKeys = new Set<string>();
  requestingKeys = new Set<string>();
  abs = Math.abs;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    public lang: LanguageService,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.accountId = this.route.snapshot.paramMap.get('id') || this.route.snapshot.paramMap.get('accountId') || '';
    this.loadBalances();
  }

  private loadBalances() {
    if (!this.accountId) {
      this.error = 'No se encontró el grupo';
      return;
    }

    this.loading = true;
    this.error = null;

    forkJoin({
      balances: this.auth.getBalancesForGroup(this.accountId).pipe(catchError(() => of([]))),
      detailed: this.auth.getDetailedBalancesForGroup(this.accountId).pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ balances, detailed }) => {
        this.loading = false;
        this.balances = balances || [];
        const sortedDetailed = Array.isArray(detailed) ? [...detailed] : [];
        sortedDetailed.sort((a: any, b: any) => {
          const aName = a?.userName || a?.nombre || a?.user?.nombre || a?.user?.name || a?.user?.email || '';
          const bName = b?.userName || b?.nombre || b?.user?.nombre || b?.user?.name || b?.user?.email || '';
          return aName.localeCompare(bName);
        });
        this.detailedBalances = sortedDetailed;

        const me = this.auth.getUser();
        this.meDetailed = null;
        this.myDebts = [];
        this.myCredits = [];
        if (me) {
          const meDet = this.detailedBalances.find((d) => {
            const id = d?.userId || d?.user?._id || d?.user?.id || d?.user?.userId;
            return id && (id === me._id || id === me.id);
          });
          if (meDet) {
            this.meDetailed = meDet;
            this.myDebts = meDet.owes || [];
            this.myCredits = meDet.owesMoney || [];
          }
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'No se pudieron cargar balances';
      },
    });
  }

  private getDebtKey(b: any, ow: any): string {
    const debtorId = String(b?.userId || b?.user?._id || b?.user?.id || '');
    const creditorId = String(ow?.userId || ow?._id || ow?.id || '');
    const amount = Number(ow?.amount || 0).toFixed(2);
    return `${debtorId}-${creditorId}-${amount}`;
  }

  isPaying(b: any, ow: any) {
    return this.payingKeys.has(this.getDebtKey(b, ow));
  }

  payDebt(b: any, ow: any) {
    const key = this.getDebtKey(b, ow);
    if (!key || this.payingKeys.has(key)) return;
    const debtorId = String(b?.userId || b?.user?._id || b?.user?.id || '');
    const creditorId = String(ow?.userId || ow?._id || ow?.id || '');
    const amount = Number(ow?.amount || 0);
    if (!debtorId || !creditorId || !amount) return;
    // Solo permitir pago si este usuario está en negativo (debe dinero)
    if (Number(b?.balance || 0) >= 0) return;

    this.payingKeys.add(key);
    this.error = null;

    const desc = `Pago a ${ow?.userName || ow?.nombre || ow?.email || ow?.userEmail || creditorId}`;
    // Modelar el pago: el deudor paga (paid += amount) y el acreedor recibe (share += amount).
    const payload: any = {
      id_grupo: this.accountId,
      descripcion: desc,
      monto: amount,
      id_pagador: debtorId,
      fecha: new Date(),
      categoria: 'pago',
    };

    this.auth
      .createGasto(payload)
      .pipe(
        switchMap((res: any) => {
          const gastoId = res?.id || res?.insertedId || res?._id;
          if (!gastoId) throw new Error('No se obtuvo id de gasto');
          const body = { id_usuario: creditorId, id_gasto: gastoId, monto_asignado: amount };
          return this.auth.createParticipacion(body);
        }),
        catchError((err) => {
          console.error('payDebt error', err);
          this.error = 'No se pudo registrar el pago';
          return of(null);
        })
      )
      .subscribe({
        next: () => {
          this.payingKeys.delete(key);
          this.loadBalances();
        },
        error: () => {
          this.payingKeys.delete(key);
        },
      });
  }

  private getRequestKey(ow: any): string {
    const debtorId = String(ow?.userId || ow?._id || ow?.id || '');
    const amount = Number(ow?.amount || 0).toFixed(2);
    return `${debtorId}-${amount}`;
  }

  isRequesting(ow: any) {
    return this.requestingKeys.has(this.getRequestKey(ow));
  }

  requestPayment(ow: any) {
    const key = this.getRequestKey(ow);
    if (!key || this.requestingKeys.has(key)) return;
    
    const debtorId = String(ow?.userId || ow?._id || ow?.id || '');
    const amount = Number(ow?.amount || 0);
    
    if (!debtorId || !amount) {
      console.error('Invalid debtor ID or amount:', { debtorId, amount });
      return;
    }

    this.requestingKeys.add(key);
    
    const me = this.auth.getUser();
    if (!me || !me._id) {
      console.error('User not authenticated');
      alert('Error: Usuario no autenticado');
      this.requestingKeys.delete(key);
      return;
    }

    const creditorName = me.nombre || me.name || me.email || 'Alguien';
    const debtorName = ow?.userName || ow?.nombre || ow?.email || ow?.userEmail || debtorId;
    
    // Crear notificación en el backend
    const notification = {
      tipo: 'solicitud_pago' as const,
      de_usuario: me._id,
      para_usuario: debtorId,
      id_grupo: this.accountId,
      mensaje: `${creditorName} te solicita el pago de ${amount.toFixed(2)}`,
      monto: amount
    };

    console.log('Enviando notificación:', notification);

    this.notificationService.createNotification(notification).subscribe({
      next: () => {
        alert(`Se ha enviado una solicitud de pago a ${debtorName} por ${amount.toFixed(2)}`);
        this.requestingKeys.delete(key);
      },
      error: (err: any) => {
        console.error('Error creando notificación:', err);
        const errorMsg = err?.error?.error || err?.message || 'Error desconocido';
        alert(`Error al enviar solicitud de pago: ${errorMsg}`);
        this.requestingKeys.delete(key);
      }
    });
  }

  displayMember(u: any) {
    if (!u) return '—';
    const me = this.auth.getUser();
    const id = typeof u === 'object' ? (u._id || u.id || u.userId) : u;
    let label = '';
    if (typeof u === 'object') {
      label = u.nombre || u.name || u.userName || u.email || u.userEmail || u._id || u.userId || JSON.stringify(u);
    } else {
      label = String(u).slice(0, 12);
    }
    if (me && (id === me._id || id === me.id)) return `${label} (yo)`;
    return label;
  }

  goBack() {
    this.router.navigate(['/group', this.accountId]);
  }
}
