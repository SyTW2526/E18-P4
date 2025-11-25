import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router'; // Importar RouterModule
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { ThemeService } from './core/theme.service';
import { LanguageService } from './core/language.service';
import { FooterComponent } from './shared/footer/footer.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button'; // Para botones de login/logout
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, 
    RouterModule, 
    MatToolbarModule, 
    MatButtonModule, 
    MatIconModule
    , HttpClientModule
    , FooterComponent
  ],
  styles: [
    `
      main {
        display: flex;
        justify-content: center;
        padding: 2rem 4rem;
      }
      .spacer {
        flex: 1 1 auto;
      }
    `,
  ],
  template: `
      <mat-toolbar color="primary">
      <span>{{ lang.t('appTitle') }}</span>
      <span class="spacer"></span>
      <button mat-icon-button (click)="toggleLang()" aria-label="Toggle language">{{ lang.current === 'es' ? 'ES' : 'EN' }}</button>
      <button *ngIf="!authService.isLoggedIn()" mat-button routerLink="/login">{{ lang.t('login') }}</button>
      <button *ngIf="!authService.isLoggedIn()" mat-button routerLink="/register">{{ lang.t('register') }}</button>
      <button *ngIf="authService.isLoggedIn()" mat-button routerLink="/settings">{{ lang.t('settings') }}</button>
      <button *ngIf="authService.isLoggedIn()" mat-icon-button (click)="logout()">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
})
export class AppComponent implements OnInit {
  title = 'bill-splitter-client'; // Título actualizado
  constructor(public authService: AuthService, private router: Router, private theme: ThemeService, public lang: LanguageService) {}

  ngOnInit(): void {
    // priority: user preference from server -> stored local preference -> default 'light'
    const user = this.authService.getUser();
    const userPref = user?.preferencia_tema;
    const stored = this.theme.getStoredTheme();
    const themeToApply = (userPref === 'dark' || userPref === 'light') ? userPref : (stored || 'light');
    this.theme.applyTheme(themeToApply as 'dark' | 'light');
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleLang() {
    this.lang.toggle();
  }
}