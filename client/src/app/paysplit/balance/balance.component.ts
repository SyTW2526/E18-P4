import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-balance',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatListModule, MatButtonModule, MatIconModule],
  template: `
    <section style="max-width:900px;margin:0 auto;padding-bottom:1.5rem">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:0.5rem">
        <button mat-icon-button (click)="goBack()"><mat-icon>arrow_back</mat-icon></button>
        <h2 style="margin:0">Balances</h2>
      </div>

      <mat-card>
        <div *ngIf="loading">Cargando balances...</div>
        <div *ngIf="error" style="color:crimson">{{ error }}</div>
        <mat-list *ngIf="!loading && !error">
          <mat-list-item *ngFor="let b of balances">
            <div style="display:flex;justify-content:space-between;width:100%;align-items:center">
              <div>
                <div style="font-weight:600">{{ displayMember(b.user) }}</div>
                <div style="font-size:0.9rem;color:#666">Pagó: {{ b.paid | number:'1.2-2' }} · Su parte: {{ b.share | number:'1.2-2' }}</div>
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
  loading = false;
  error: string | null = null;

  constructor(private route: ActivatedRoute, private auth: AuthService, private router: Router) {}

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

    // fetch both members and balances, then merge so every member appears
    const members$ = this.auth.getMembersForGroup(this.accountId).pipe(catchError(() => of([])));
    const balances$ = this.auth.getBalancesForGroup(this.accountId).pipe(catchError(() => of([])));

    (forkJoin([members$, balances$]) as any).subscribe({
      next: ([members, balances]: [any[], any[]]) => {
  const memberList = Array.isArray(members) ? members : [];
  const balanceList = Array.isArray(balances) ? balances : [];

        // build map of balances by userId
        const balMap: Record<string, any> = {};
        balanceList.forEach((b: any) => {
          balMap[String(b.userId)] = { paid: Number(b.paid) || 0, share: Number(b.share) || 0, balance: Number(b.balance) || 0, user: b.user || null };
        });

        // normalize members to objects
        const normalizedMembers = memberList.map((m: any) => (typeof m === 'object' ? m : { _id: m }));

        // ensure current user included if not present
        const me = this.auth.getUser();
        const meId = me?._id || me?.id;
        if (meId && !normalizedMembers.find((x: any) => String(x._id || x.id) === String(meId))) {
          normalizedMembers.unshift(me);
        }

        // combine: for each member, use balance if exists or zeros
        this.balances = normalizedMembers.map((u: any) => {
          const uid = String(u._id || u.id || u);
          const b = balMap[uid] || { paid: 0, share: 0, balance: 0, user: u };
          // prefer server-provided user object if any, otherwise use member object
          b.user = b.user || u;
          b.userId = uid;
          return b;
        });

        // sort by balance descending (highest positive first)
        this.balances.sort((a: any, b: any) => Number(b.balance) - Number(a.balance));

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
    const id = typeof u === 'object' ? (u._id || u.id) : u;
    let label = '';
    if (typeof u === 'object') {
      label = u.nombre || u.email || u._id || JSON.stringify(u);
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
