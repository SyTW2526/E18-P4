import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LanguageService } from '../../core/language.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
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
    <section style="max-width:900px;margin:-2rem auto 0 auto;padding-top:2rem;padding-bottom:1.5rem">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <h2 style="margin:0">{{ lang.t('balances') }}</h2>
      </div>

      <mat-card>
        <div *ngIf="loading">{{ lang.t('loadingBalances') }}</div>
        <div *ngIf="error" style="color:crimson">{{ error }}</div>
        
        <!-- Usar balances detallados si están disponibles -->
        <div *ngIf="!loading && !error && detailedBalances && detailedBalances.length > 0">
          <mat-accordion>
            <mat-expansion-panel *ngFor="let b of detailedBalances">
              <mat-expansion-panel-header>
                <mat-panel-title>
                  <div style="display:flex;justify-content:space-between;width:100%;align-items:center;gap:1rem">
                    <div>
                      <div style="font-weight:600">{{ displayMember(b.user) }}</div>
                      <div style="font-size:0.9rem;color:#666">{{ lang.t('paid') }}: {{ b.paid | number:'1.2-2' }} · {{ lang.t('share') }}: {{ b.share | number:'1.2-2' }}</div>
                    </div>
                    <div [style.color]="b.balance >= 0 ? 'green' : 'crimson'" style="font-weight:700;min-width:80px;text-align:right">
                      {{ b.balance >= 0 ? '+' : '-' }}{{ (abs(b.balance) | number:'1.2-2') }}
                    </div>
                  </div>
                </mat-panel-title>
              </mat-expansion-panel-header>

              <!-- Contenido expandible: detalles de deudas -->
              <div style="padding:1rem;background:#f9f9f9">
                <!-- Si está en positivo (es acreedor) -->
                <div *ngIf="b.owesMoney && b.owesMoney.length > 0" style="margin-bottom:1rem">
                  <div style="font-weight:600;color:green;margin-bottom:0.5rem">💰 A ti te deben</div>
                  <ul style="list-style:none;padding:0;margin:0">
                    <li *ngFor="let owe of b.owesMoney" style="padding:0.5rem;background:#e8f5e9;margin:0.25rem 0;border-radius:4px;border-left:3px solid green;color:#333">
                      <strong>{{ displayMember(owe) }}</strong> debe <span style="color:green;font-weight:700">{{ owe.amount | number:'1.2-2' }}</span>
                    </li>
                  </ul>
                </div>

                <!-- Si está en negativo (es deudor) -->
                <div *ngIf="b.owes && b.owes.length > 0">
                  <div style="font-weight:600;color:crimson;margin-bottom:0.5rem">💳 Tú debes</div>
                  <ul style="list-style:none;padding:0;margin:0">
                    <li *ngFor="let ow of b.owes" style="padding:0.5rem;background:#ffebee;margin:0.25rem 0;border-radius:4px;border-left:3px solid crimson;color:#333">
                      Debes a <strong>{{ displayMember(ow) }}</strong> <span style="color:crimson;font-weight:700">{{ ow.amount | number:'1.2-2' }}</span>
                    </li>
                  </ul>
                </div>

                <div *ngIf="(!b.owes || b.owes.length === 0) && (!b.owesMoney || b.owesMoney.length === 0)" style="font-size:0.9rem;color:#999;font-style:italic">
                  Saldado
                </div>
              </div>
            </mat-expansion-panel>
          </mat-accordion>
        </div>

        <!-- Fallback: mostrar balances simples si no hay detallados -->
        <mat-list *ngIf="!loading && !error && (!detailedBalances || detailedBalances.length === 0) && balances.length > 0">
          <mat-list-item *ngFor="let b of balances">
            <div style="display:flex;justify-content:space-between;width:100%;align-items:center">
              <div>
                <div style="font-weight:600">{{ displayMember(b.user) }}</div>
                <div style="font-size:0.9rem;color:#666">{{ lang.t('paid') }}: {{ b.paid | number:'1.2-2' }} · {{ lang.t('share') }}: {{ b.share | number:'1.2-2' }}</div>
              </div>
              <div [style.color]="b.balance >= 0 ? 'green' : 'crimson'" style="font-weight:700">
                {{ b.balance >= 0 ? '+' : '-' }}{{ (abs(b.balance) | number:'1.2-2') }}
              </div>
            </div>
          </mat-list-item>
        </mat-list>
      </mat-card>
    </section>
  `,
})
export class BalanceComponent implements OnInit {
  accountId = '';
  balances: Array<any> = [];
  detailedBalances: Array<any> = [];
  loading = false;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router, public lang: LanguageService) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id') || '';
    this.loadBalances();
  }

  abs(v: number) {
    return Math.abs(v || 0);
  }

  loadBalances() {
    this.loading = true;
    this.error = null;

    // Try to load detailed balances first (new endpoint), fall back to simple balances
    const detailedBalances$ = this.auth.getDetailedBalancesForGroup(this.accountId).pipe(catchError(() => of([])));
    const members$ = this.auth.getMembersForGroup(this.accountId).pipe(catchError(() => of([])));
    const balances$ = this.auth.getBalancesForGroup(this.accountId).pipe(catchError(() => of([])));

    (forkJoin([detailedBalances$, members$, balances$]) as any).subscribe({
      next: ([detailedBalances, members, balances]: [any[], any[], any[]]) => {
        const memberList = Array.isArray(members) ? members : [];
        const balanceList = Array.isArray(balances) ? balances : [];
        const detailedList = Array.isArray(detailedBalances) ? detailedBalances : [];

        console.log('Detailed balances received:', detailedList);
        console.log('Simple balances received:', balanceList);

        if (detailedList && detailedList.length > 0) {
          // Usar balances detallados si están disponibles
          this.detailedBalances = detailedList;
          // Enriquecer con información de usuario si es necesario
          this.detailedBalances = this.detailedBalances.map((b: any) => ({
            ...b,
            user: b.userName ? { nombre: b.userName, email: b.userEmail, _id: b.userId } : { _id: b.userId }
          }));
          // Ordenar por balance descendente
          this.detailedBalances.sort((a: any, b: any) => Number(b.balance) - Number(a.balance));
        } else {
          // Fallback: construir balances simples
          const balMap: Record<string, any> = {};
          balanceList.forEach((b: any) => {
            balMap[String(b.userId)] = { paid: Number(b.paid) || 0, share: Number(b.share) || 0, balance: Number(b.balance) || 0, user: b.user || null };
          });

          const normalizedMembers = memberList.map((m: any) => (typeof m === 'object' ? m : { _id: m }));

          const me = this.auth.getUser();
          const meId = me?._id || me?.id;
          if (meId && !normalizedMembers.find((x: any) => String(x._id || x.id) === String(meId))) {
            normalizedMembers.unshift(me);
          }

          this.balances = normalizedMembers.map((u: any) => {
            const uid = String(u._id || u.id || u);
            const b = balMap[uid] || { paid: 0, share: 0, balance: 0, user: u };
            b.user = b.user || u;
            b.userId = uid;
            return b;
          });

          this.balances.sort((a: any, b: any) => Number(b.balance) - Number(a.balance));
        }

        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'No se pudieron cargar balances';
      },
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
