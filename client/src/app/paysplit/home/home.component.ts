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
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent {
  Math = Math;
  sharedAccounts: any[] = [];
  groupBalances: { [groupId: string]: number } = {};
  loadingGroups = false;
  groupsError: string | null = null;
  totalDebt = 0;

  getAmountOwed(): number {
    let sum = 0;
    Object.values(this.groupBalances).forEach(balance => {
      if (balance < 0) sum += Math.abs(balance);
    });
    return sum;
  }

  getAmountOwedTo(): number {
    let sum = 0;
    Object.values(this.groupBalances).forEach(balance => {
      if (balance > 0) sum += balance;
    });
    return sum;
  }

  getUserPreferredCurrency(): string {
    const user = this.auth.getUser();
    return user?.moneda_preferida || 'EUR';
  }
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
