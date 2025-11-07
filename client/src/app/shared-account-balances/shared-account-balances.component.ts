import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { SharedAccountService } from '../shared-account.service';

@Component({
  selector: 'app-shared-account-balances',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section style="max-width:900px; width:100%">
      <h2>Balances</h2>
      <div *ngIf="loading">Cargando...</div>
      <table *ngIf="!loading">
        <thead>
          <tr><th>Usuario</th><th>Paid</th><th>Share</th><th>Balance</th></tr>
        </thead>
        <tbody>
          <tr *ngFor="let r of balances">
            <td>{{ r.userId }}</td>
            <td>{{ r.paid }}</td>
            <td>{{ r.share }}</td>
            <td [ngStyle]="{ color: r.balance >= 0 ? 'green' : 'red' }">{{ r.balance }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  `,
})
export class SharedAccountBalancesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private svc = inject(SharedAccountService);
  balances: any[] = [];
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (typeof window === 'undefined') {
      this.loading = false;
      return;
    }
    if (id) {
      this.svc.getBalances(id).subscribe((b) => {
        this.balances = b || [];
        this.loading = false;
      });
    } else {
      this.loading = false;
    }
  }
}
