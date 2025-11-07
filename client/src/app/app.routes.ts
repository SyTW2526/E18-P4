import { Routes } from '@angular/router';
import { SharedAccountsListComponent } from './shared-accounts-list/shared-accounts-list.component';
import { SharedAccountBalancesComponent } from './shared-account-balances/shared-account-balances.component';
import { AuthComponent } from './auth/auth.component';
import { GastosListComponent } from './gastos-list/gastos-list.component';
import { ParticipacionesListComponent } from './participaciones-list/participaciones-list.component';
import { MembersListComponent } from './members-list/members-list.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Inicio' },
  { path: 'shared-accounts', component: SharedAccountsListComponent, title: 'Shared Accounts' },
  { path: 'shared-accounts/:id/balances', component: SharedAccountBalancesComponent, title: 'Balances' },
  { path: 'shared-accounts/:id/gastos', component: GastosListComponent, title: 'Gastos' },
  { path: 'shared-accounts/:id/participaciones', component: ParticipacionesListComponent, title: 'Participaciones' },
  { path: 'shared-accounts/:id/members', component: MembersListComponent, title: 'Members' },
  { path: 'auth', component: AuthComponent, title: 'Auth' },
];
