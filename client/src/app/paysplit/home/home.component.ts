import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { LanguageService } from '../../core/language.service';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatIconModule, MatCardModule, MatListModule],
  template: `
    <section style="max-width:900px; width:100%; text-align:center; padding-top:2rem">
      <h1>{{ lang.t('welcome') }}</h1>

      <ng-container *ngIf="!auth.isLoggedIn()">
        <p>{{ lang.t('mustLoginFirst') }}</p>

        <div style="display:flex;gap:2rem;justify-content:center; margin-top:1rem">
          <div style="min-width:300px">
            <h3>{{ lang.t('signup') }}</h3>
            <form (ngSubmit)="signup()">
              <mat-form-field style="width:100%">
                <input matInput [placeholder]="lang.t('name')" [(ngModel)]="signupModel.nombre" name="nombre" required (ngModelChange)="clearSignupError()" />
              </mat-form-field>
              <mat-form-field style="width:100%">
                <input matInput [placeholder]="lang.t('email')" [(ngModel)]="signupModel.email" name="email" required (ngModelChange)="clearSignupError()" />
              </mat-form-field>
              <mat-form-field style="width:100%">
                <input matInput [placeholder]="lang.t('password')" [(ngModel)]="signupModel.password" name="password" [type]="showSignupPassword ? 'text' : 'password'" required (ngModelChange)="clearSignupError()" />
                <button mat-icon-button matSuffix type="button" (click)="toggleSignupPassword()" [attr.aria-label]="showSignupPassword ? lang.t('hidePassword') : lang.t('showPassword')">
                  <mat-icon>{{ showSignupPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
              <div style="display:flex;flex-direction:column;gap:0.5rem">
                <button mat-raised-button color="primary" type="submit" [disabled]="signupLoading">{{ signupLoading ? lang.t('signingUp') : lang.t('signup') }}</button>
                <div *ngIf="signupError" style="color:#b00020;font-size:0.9rem;text-align:left">{{ signupError }}</div>
              </div>
            </form>
          </div>

          <div style="min-width:300px">
            <h3>{{ lang.t('signin') }}</h3>
            <form (ngSubmit)="signin()">
              <mat-form-field style="width:100%">
                <input matInput [placeholder]="lang.t('email')" [(ngModel)]="signinModel.email" name="se_email" required (ngModelChange)="clearSigninError()" />
              </mat-form-field>
              <mat-form-field style="width:100%">
                <input matInput [placeholder]="lang.t('password')" [(ngModel)]="signinModel.password" name="se_password" [type]="showSigninPassword ? 'text' : 'password'" required (ngModelChange)="clearSigninError()" />
                <button mat-icon-button matSuffix type="button" (click)="toggleSigninPassword()" [attr.aria-label]="showSigninPassword ? lang.t('hidePassword') : lang.t('showPassword')">
                  <mat-icon>{{ showSigninPassword ? 'visibility_off' : 'visibility' }}</mat-icon>
                </button>
              </mat-form-field>
              <div style="display:flex;flex-direction:column;gap:0.5rem">
                <button mat-raised-button color="accent" type="submit" [disabled]="signinLoading">{{ signinLoading ? lang.t('signingIn') : lang.t('signin') }}</button>
                <div *ngIf="signinError" style="color:#b00020;font-size:0.9rem;text-align:left">{{ signinError }}</div>
              </div>
            </form>
          </div>
        </div>
      </ng-container>

      <div *ngIf="auth.isLoggedIn()" style="margin-top:1rem">
        <div style="display:flex;flex-wrap:wrap;gap:2rem;margin-top:1rem;max-width:900px;margin-left:auto;margin-right:auto">
          <!-- Left sidebar with debt info -->
          <div style="flex:0 0 auto;padding:1.5rem;background:var(--secondary-bg);border-radius:8px;height:fit-content;min-width:180px">
            <h3 style="margin:0 0 1rem 0;font-size:0.95rem;color:var(--text-secondary);text-transform:uppercase;letter-spacing:0.5px">{{ totalDebt < 0 ? lang.t('youOwe') : lang.t('youWillReceive') }}</h3>
            <div [style.color]="totalDebt < 0 ? '#d32f2f' : '#4caf50'" style="font-size:2.5rem;font-weight:bold;margin-bottom:0.5rem">{{ Math.abs(totalDebt).toFixed(2) }} €</div>
          </div>

          <!-- Right content area with groups -->
          <div style="flex:1;min-width:280px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <h3>{{ lang.t('myGroups') }}</h3>
              <div style="display:flex;gap:0.5rem">
              <button mat-flat-button class="btn-primary" (click)="createFormVisible = !createFormVisible">{{ lang.t('create') }}</button>
              <button mat-flat-button class="btn-primary" (click)="joinFormVisible = !joinFormVisible">{{ lang.t('join') }}</button>
            </div>
          </div>

          <div *ngIf="createFormVisible" style="margin-top:0.75rem;">
            <mat-form-field style="width:60%">
              <input matInput [placeholder]="lang.t('newGroupName')" [(ngModel)]="createName" name="createName" />
            </mat-form-field>
            <button mat-raised-button color="primary" (click)="createGroupFromForm()" [disabled]="createLoading">{{ createLoading ? lang.t('creating') : lang.t('createGroup') }}</button>
          </div>

          <div *ngIf="joinFormVisible" style="margin-top:0.75rem;">
            <mat-form-field style="width:60%">
              <input matInput [placeholder]="lang.t('groupId')" [(ngModel)]="joinId" name="joinId" />
            </mat-form-field>
            <button mat-raised-button color="accent" (click)="joinGroupFromForm()" [disabled]="joinLoading">{{ joinLoading ? lang.t('joining') : lang.t('join') }}</button>
          </div>

          <div *ngIf="loadingGroups" style="margin-top:1rem">{{ lang.t('loadingGroups') }}</div>
          <div *ngIf="groupsError" style="color:#b00020;margin-top:1rem">{{ groupsError }}</div>

          <div *ngIf="!loadingGroups && sharedAccounts.length" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:1rem;margin-top:1rem">
            <mat-card *ngFor="let g of sharedAccounts" class="group-card" tabindex="0" (click)="openGroup(g)" (keydown.enter)="openGroup(g)">
              <div style="display:flex; align-items:center; gap:12px; padding:4px 4px 0 4px">
                <div style="width:56px; height:56px; border-radius:50%; overflow:hidden; background:var(--secondary-bg); display:flex; align-items:center; justify-content:center; flex-shrink:0; border:1px solid var(--divider-color)">
                  <ng-container *ngIf="g.foto_grupo; else groupInitial">
                    <img [src]="g.foto_grupo" alt="" style="width:100%; height:100%; object-fit:cover" />
                  </ng-container>
                  <ng-template #groupInitial>
                    <span style="font-weight:700; font-size:1.2rem; color:var(--text-main)">{{ getGroupInitial(g) }}</span>
                  </ng-template>
                </div>
                <div style="flex:1; min-width:0; text-align:left">
                  <div style="font-weight:700; font-size:1.05rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ g.nombre }}</div>
                  <div *ngIf="g.descripcion" style="margin-top:0.25rem; color:var(--text-muted); font-size:0.9rem; max-height:2.6em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap">{{ g.descripcion }}</div>
                </div>
              </div>
              <mat-card-content>
                <div style="margin-top:1rem;padding-top:1rem;border-top:1px solid var(--divider-color);">
                  <p style="margin:0;font-size:0.9rem;color:var(--text-muted);">{{ (groupBalances[g._id || g.id] || 0) < 0 ? lang.t('youOwe') : lang.t('youWillReceive') }}:</p>
                  <p [style.color]="(groupBalances[g._id || g.id] || 0) < 0 ? '#d32f2f' : '#4caf50'" style="margin:0.25rem 0 0 0;font-size:1.3rem;font-weight:bold;">{{ Math.abs(groupBalances[g._id || g.id] || 0).toFixed(2) }} {{ getCurrencySymbol(g.moneda || 'EUR') }}</p>
                </div>
              </mat-card-content>
            </mat-card>
          </div>

          <div *ngIf="!loadingGroups && !sharedAccounts.length" style="margin-top:1rem">No perteneces a ningún grupo todavía.</div>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class HomeComponent {
  Math = Math;
  sharedAccounts: any[] = [];
  groupBalances: { [groupId: string]: number } = {};
  loadingGroups = false;
  groupsError: string | null = null;
  totalDebt = 0;
  signupModel = { nombre: '', email: '', password: '' };
  signinModel = { email: '', password: '' };
  showSignupPassword = false;
  showSigninPassword = false;
  signupError: string | null = null;
  signinError: string | null = null;
  signupLoading = false;
  signinLoading = false;
  // UI state for create/join forms
  createFormVisible = false;
  joinFormVisible = false;
  createName = '';
  joinId = '';
  createLoading = false;
  joinLoading = false;

  constructor(
    public auth: AuthService, 
    private router: Router, 
    public lang: LanguageService
  ) {}

  ngOnInit(): void {
    if (this.auth.isLoggedIn()) {
      this.loadSharedAccounts();
    }
  }

  toggleSignupPassword() {
    this.showSignupPassword = !this.showSignupPassword;
  }

  toggleSigninPassword() {
    this.showSigninPassword = !this.showSigninPassword;
  }

  signup() {
    this.signupError = null;
    this.signupLoading = true;
    this.auth.signup(this.signupModel).subscribe({
      next: () => {
        this.signupLoading = false;
        // after signup go to the protected home view
        this.router.navigate(['/home']);
      },
      error: (e: any) => {
        this.signupLoading = false;
        this.signupError = e?.error?.message || e?.message || 'Error al registrarse. Intenta de nuevo.';
        console.error('signup error', e);
      },
    });
  }

  signin() {
    this.signinError = null;
    this.signinLoading = true;
    this.auth.signin(this.signinModel).subscribe({
      next: () => {
        this.signinLoading = false;
        // after signin go to the protected home view
        this.router.navigate(['/home']);
      },
      error: (e: any) => {
        this.signinLoading = false;
        this.signinError = e?.error?.message || e?.message || 'Error al iniciar sesión. Revisa tus credenciales.';
        console.error('signin error', e);
      },
    });
  }

  loadSharedAccounts() {
    this.groupsError = null;
    this.loadingGroups = true;
    this.totalDebt = 0;
    const user = this.auth.getUser();
    const userId = user?._id || user?.id;
    if (!userId) {
      this.sharedAccounts = [];
      this.loadingGroups = false;
      return;
    }

    // fetch only the groups the current user belongs to
    this.auth.getGroupsForUser(String(userId)).subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        // the server may return fallback objects like { id: 'nonObjectId' }
        // normalize so template can always read _id
        this.sharedAccounts = list.map((g: any) => {
          if (!g) return g;
          if (!g._id && g.id) g._id = g.id;
          return g;
        });
        
        // Load balances for each group and calculate total debt
        if (this.sharedAccounts.length > 0) {
          this.loadBalancesForAllGroups();
        } else {
          this.loadingGroups = false;
        }
      },
      error: (err: any) => {
        this.groupsError = err?.error?.message || err?.message || 'No se pudieron cargar los grupos';
        this.sharedAccounts = [];
        this.loadingGroups = false;
        console.error('loadSharedAccounts error', err);
      },
    });
  }

  private loadBalancesForAllGroups() {
    const user = this.auth.getUser();
    const userId = user?._id || user?.id;
    let debtSum = 0;
    let completedGroups = 0;

    this.sharedAccounts.forEach((group) => {
      const groupId = group._id || group.id;
      if (!groupId) {
        completedGroups++;
        if (completedGroups === this.sharedAccounts.length) {
          this.totalDebt = debtSum;
          this.loadingGroups = false;
        }
        return;
      }

      this.auth.getBalancesForGroup(String(groupId)).subscribe({
        next: (balances: any[]) => {
          // Find the balance for the current user
          const userBalance = balances.find((b: any) => String(b.userId) === String(userId));
          if (userBalance) {
            const balance = userBalance.balance;
            this.groupBalances[groupId] = balance;
            // Add all balances (negative = owes, positive = owed to) to net total
            debtSum += balance;
          }
          completedGroups++;
          if (completedGroups === this.sharedAccounts.length) {
            this.totalDebt = debtSum;
            this.loadingGroups = false;
          }
        },
        error: (err: any) => {
          console.error(`Error loading balances for group ${groupId}:`, err);
          completedGroups++;
          if (completedGroups === this.sharedAccounts.length) {
            this.totalDebt = debtSum;
            this.loadingGroups = false;
          }
        },
      });
    });
  }

  createGroup() {
    const nombre = prompt('Nombre del nuevo grupo:');
    if (!nombre) return;
    const user = this.auth.getUser();
    // server schema expects 'creador_id', 'moneda' and 'fecha_creacion'
    const payload: any = { nombre };
    payload.fecha_creacion = new Date();
    payload.moneda = 'EUR';
    if (user?._id) payload.creador_id = user._id;

    this.auth.createSharedAccount(payload).subscribe({
      next: (res: any) => {
        // refresh list
        this.loadSharedAccounts();
      },
      error: (err: any) => {
        alert('No se pudo crear el grupo: ' + (err?.error?.message || err?.message || 'Error'));
        console.error('createGroup error', err);
      },
    });
  }

  joinGroup() {
    const id = prompt('Introduce el id del grupo al que quieres unirte:');
    if (!id) return;
    const user = this.auth.getUser();
    this.groupsError = null;
    this.loadingGroups = true;

    // reload accounts to find the target
    this.auth.getSharedAccounts().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        const target = list.find((g: any) => (g._id || g.id) === id);
        if (!target) {
          this.groupsError = 'Grupo no encontrado';
          this.loadingGroups = false;
          return;
        }

        // Instead of mutating shared_accounts (schema doesn't allow extra fields),
        // create a user_groups relation entry on the server.
        const uid = user?._id || user?.id;
        if (!uid) {
          this.groupsError = 'Usuario no identificado';
          this.loadingGroups = false;
          return;
        }
        const relation = { id_usuario: String(uid), id_grupo: String(target._id || target.id), rol: 'miembro' };
        this.auth.createUserGroup(relation).subscribe({
          next: () => {
            this.loadSharedAccounts();
          },
          error: (err: any) => {
            this.groupsError = err?.error?.message || err?.message || 'No se pudo unirse al grupo';
            this.loadingGroups = false;
            console.error('joinGroup error', err);
          },
        });
      },
      error: (err: any) => {
        this.groupsError = err?.error?.message || err?.message || 'No se pudieron cargar los grupos';
        this.loadingGroups = false;
      },
    });
  }

  clearSignupError() {
    this.signupError = null;
  }

  clearSigninError() {
    this.signinError = null;
  }

  openGroup(g: any) {
    // navigate to account detail route
    this.router.navigate(['/group', g._id], { state: { accountName: g.nombre } });
  }

  createGroupFromForm() {
    if (!this.createName || !this.createName.trim()) {
      this.groupsError = 'Introduce un nombre para el grupo.';
      return;
    }
    this.createLoading = true;
    const user = this.auth.getUser();
    // match server schema: nombre, fecha_creacion, moneda, creador_id
    const payload: any = { nombre: this.createName.trim(), fecha_creacion: new Date(), moneda: 'EUR' };
    if (user?._id) payload.creador_id = user._id;

    this.auth.createSharedAccount(payload).subscribe({
      next: () => {
        this.createLoading = false;
        this.createName = '';
        this.createFormVisible = false;
        this.loadSharedAccounts();
      },
      error: (err: any) => {
        this.createLoading = false;
        this.groupsError = err?.error?.message || err?.message || 'No se pudo crear el grupo';
        console.error('createGroupFromForm error', err);
      },
    });
  }

  joinGroupFromForm() {
    if (!this.joinId || !this.joinId.trim()) {
      this.groupsError = 'Introduce el id del grupo.';
      return;
    }
    this.joinLoading = true;
    const uid = this.auth.getUser()?._id || this.auth.getUser()?.id;
    if (!uid) {
      this.groupsError = 'Usuario no identificado.';
      this.joinLoading = false;
      return;
    }

    this.auth.getSharedAccounts().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        const target = list.find((g: any) => (g._id || g.id) === this.joinId.trim());
        if (!target) {
          this.groupsError = 'Grupo no encontrado';
          this.joinLoading = false;
          return;
        }
        // create a user_groups relation instead of mutating the shared_account document
        const relation = { id_usuario: String(uid), id_grupo: String(target._id || target.id), rol: 'miembro' };
        this.auth.createUserGroup(relation).subscribe({
          next: () => {
            this.joinLoading = false;
            this.joinId = '';
            this.joinFormVisible = false;
            this.loadSharedAccounts();
          },
          error: (err: any) => {
            this.groupsError = err?.error?.message || err?.message || 'No se pudo unir al grupo';
            this.joinLoading = false;
            console.error('joinGroupFromForm error', err);
          },
        });
      },
      error: (err: any) => {
        this.groupsError = err?.error?.message || err?.message || 'No se pudieron cargar los grupos';
        this.joinLoading = false;
      },
    });
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  getGroupInitial(group: any): string {
    return (group?.nombre || 'G').charAt(0).toUpperCase();
  }

  getCurrencySymbol(code: string): string {
    const symbols: { [key: string]: string } = {
      'EUR': '€',
      'USD': '$',
      'GBP': '£',
      'JPY': '¥',
      'CHF': 'CHF',
      'CAD': 'C$',
      'AUD': 'A$',
      'NZD': 'NZ$',
      'CNY': '¥',
      'INR': '₹',
      'BRL': 'R$',
      'MXN': '$',
      'SEK': 'kr',
      'NOK': 'kr',
      'DKK': 'kr',
      'PLN': 'zł',
      'CZK': 'Kč',
      'HUF': 'Ft',
      'RON': 'lei',
      'BGN': 'лв',
      'HRK': 'kn',
      'RUB': '₽',
      'TRY': '₺',
      'ZAR': 'R',
      'SGD': 'S$',
      'HKD': 'HK$',
      'THB': '฿',
      'MYR': 'RM',
      'PHP': '₱',
      'IDR': 'Rp',
      'VND': '₫',
      'KRW': '₩',
      'TWD': 'NT$',
      'AED': 'د.إ',
      'SAR': '﷼',
      'KWD': 'د.ك',
      'QAR': 'ر.ق',
      'ILS': '₪'
    };
    return symbols[code] || code;
  }
}
