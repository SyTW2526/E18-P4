import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet, RouterModule } from '@angular/router'; // Importar RouterModule
import { CommonModule } from '@angular/common';
import { AuthService } from './auth/auth.service';
import { ThemeService } from './core/theme.service';
import { LanguageService } from './core/language.service';
import { FooterComponent } from './shared/footer/footer.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button'; // Para botones de login/logout
import { MatIconModule } from '@angular/material/icon';
import { HttpClientModule } from '@angular/common/http';

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
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
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