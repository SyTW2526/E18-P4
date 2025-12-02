import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router'; // Importar RouterModule
import { CommonModule } from '@angular/common';
import { ElementRef, ViewChild } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { ThemeService } from './core/theme.service';
import { LanguageService } from './core/language.service';
import { FooterComponent } from './shared/footer/footer.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button'; // Para botones de login/logout
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
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
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    HttpClientModule,
    FooterComponent,
    // dialog component (standalone)
    // add-friend dialog is lazy-loaded dynamically
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
      <button *ngIf="!authService.isLoggedIn() || !showAuthenticatedControls" mat-button routerLink="/login">{{ lang.t('login') }}</button>
      <button *ngIf="!authService.isLoggedIn() || !showAuthenticatedControls" mat-button routerLink="/register">{{ lang.t('register') }}</button>
      <!-- Amigos dropdown -->
      <button #friendsBtn *ngIf="authService.isLoggedIn() && showAuthenticatedControls" mat-button [matMenuTriggerFor]="friendsMenu" #friendsTrigger="matMenuTrigger" (menuOpened)="onFriendsMenuOpened()">Amigos</button>
      <mat-menu #friendsMenu="matMenu" yPosition="below" xPosition="before" [overlapTrigger]="false">
        <button mat-menu-item *ngFor="let f of friends" (click)="openFriend(f)">{{ f?.nombre || f?.name || f?.email || f }}</button>
        <button mat-menu-item disabled *ngIf="!friends || friends.length === 0">No hay amigos</button>
        <button mat-menu-item (click)="promptAddFriend()">Añadir amigo</button>
      </mat-menu>
      <button *ngIf="authService.isLoggedIn() && showAuthenticatedControls" mat-button routerLink="/settings">{{ lang.t('settings') }}</button>
      <button *ngIf="authService.isLoggedIn() && showAuthenticatedControls" mat-icon-button (click)="logout()">
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
  showAuthenticatedControls = true;
  friends: any[] = [];
  @ViewChild('friendsBtn', { read: ElementRef }) friendsBtn?: ElementRef;
  constructor(public authService: AuthService, private router: Router, private theme: ThemeService, public lang: LanguageService, private dialog: MatDialog, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // priority: user preference from server -> stored local preference -> default 'light'
    const user = this.authService.getUser();
    const userPref = user?.preferencia_tema;
    const stored = this.theme.getStoredTheme();
    const themeToApply = (userPref === 'dark' || userPref === 'light') ? userPref : (stored || 'light');
    this.theme.applyTheme(themeToApply as 'dark' | 'light');
    // hide settings/logout on the landing (root) route
    this.updateHeaderVisibility();
    this.router.events.subscribe((ev: any) => {
      if (ev?.constructor?.name === 'NavigationEnd') {
        this.updateHeaderVisibility();
      }
    });

    // load friends from the stored user object (if present)
    this.loadFriends();
  }

  private updateHeaderVisibility() {
    const url = this.router.url || '/';
    // hide authenticated-only controls on landing and on auth pages
    this.showAuthenticatedControls = !(url === '/' || url === '' || url.startsWith('/login') || url.startsWith('/register'));
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  toggleLang() {
    this.lang.toggle();
  }

  private loadFriends() {
    // prefer fetching the latest amigos from the server
    try {
      if (!this.authService.isLoggedIn()) { this.friends = []; return; }
      const user = this.authService.getUser();
      const userId = user?._id || user?.id;
      if (!userId) { this.friends = []; return; }

      this.authService.getAmigos(String(userId)).subscribe({
        next: (res: any) => {
          const ids: any[] = res?.amigos || res || [];
          if (!Array.isArray(ids) || ids.length === 0) { this.friends = []; return; }
          const calls = ids.map((fid: any) => {
            try { return this.authService.getUserById(String(fid)); }
            catch { return of(null); }
          });
          forkJoin(calls).subscribe({
            next: (arr: any[]) => { this.friends = (arr || []).filter(Boolean); },
            error: () => { this.friends = []; }
          });
        },
        error: () => { this.friends = []; }
      });
    } catch (e) {
      this.friends = [];
    }
  }

  openFriend(f: any) {
    // if friend object contains an id, navigate to a profile route, otherwise do nothing
    const id = f?.id || f?._id || f?.usuario_id;
    if (id) {
      this.router.navigate([`/users/${id}`]);
    }
  }

  onFriendsMenuOpened() {
    try {
      const btnEl = this.friendsBtn?.nativeElement as HTMLElement | undefined;
      if (!btnEl) return;
      const rect = btnEl.getBoundingClientRect();
      // find the last overlay pane (the menu that just opened)
      const panes = document.querySelectorAll('.cdk-overlay-pane');
      if (!panes || panes.length === 0) return;
      const pane = panes[panes.length - 1] as HTMLElement;
      // Defer adjustment slightly so any positioning/animation finishes
      setTimeout(() => {
        try {
          // place the pane directly under the trigger (override any inline styles)
          pane.style.setProperty('transform', 'none', 'important');
          pane.style.setProperty('left', `${Math.max(0, rect.left + window.scrollX)}px`, 'important');
          pane.style.setProperty('top', `${rect.bottom + window.scrollY}px`, 'important');
          pane.style.setProperty('right', 'auto', 'important');
        } catch (e) {
          console.error('Failed to apply styles to overlay pane', e);
        }
      }, 0);
    } catch (e) {
      // silent fallback
      console.error('Failed to reposition friends menu', e);
    }
  }

  promptAddFriend() {
    // open dialog to ask for username, then run the same lookup/add flow
    try {
      // dynamic import and open
      import('./add-friend-dialog/add-friend-dialog.component').then(m => {
        const ref = this.dialog.open(m.AddFriendDialogComponent, { width: '360px' });
        // Ensure dialog container uses app colors even if Material applies inline/author styles
        try {
          ref.afterOpened().subscribe(() => {
            try {
              const panes = document.querySelectorAll('.cdk-overlay-pane');
              if (!panes || panes.length === 0) return;
              const pane = panes[panes.length - 1] as HTMLElement;
              // position the overlay pane itself on the right side so the dialog appears on the right
              try {
                pane.style.setProperty('right', '16px', 'important');
                pane.style.setProperty('left', 'auto', 'important');
                pane.style.setProperty('top', `${Math.max(16, window.scrollY + 80)}px`, 'important');
                pane.style.setProperty('position', 'fixed', 'important');
                pane.style.setProperty('transform', 'none', 'important');
              } catch (e) { /* ignore */ }

              const dialogEl = pane.querySelector('.mat-dialog-container, .mat-mdc-dialog-container') as HTMLElement | null;
              if (dialogEl) {
                dialogEl.style.setProperty('background', 'linear-gradient(180deg, var(--secondary-bg) 0%, #151515 100%)', 'important');
                dialogEl.style.setProperty('color', 'var(--text-main)', 'important');
                dialogEl.style.setProperty('border-radius', '10px', 'important');
                // ensure inputs inside are dark/transparent
                const inputs = dialogEl.querySelectorAll('input, textarea');
                inputs.forEach((inp: any) => {
                  try { inp.style.setProperty('background-color', 'transparent', 'important'); inp.style.setProperty('color', 'var(--text-main)', 'important'); } catch(e) {}
                });
                // position the dialog on the right side of the viewport
                try {
                  // anchor 16px from right and 80px from top
                  dialogEl.style.setProperty('right', '16px', 'important');
                  dialogEl.style.setProperty('left', 'auto', 'important');
                  dialogEl.style.setProperty('top', `${Math.max(16, window.scrollY + 80)}px`, 'important');
                  dialogEl.style.setProperty('transform', 'none', 'important');
                } catch (e) { /* ignore */ }
              }
            } catch (e) { /* ignore */ }
          });
        } catch (e) { /* ignore errors if API missing */ }
        ref.afterClosed().subscribe((result: any) => {
          // dialog returns `true` on success — refresh friends and show a snackbar
          if (result === true) {
            this.snackBar.open('Solicitud de amistad enviada', 'Cerrar', { duration: 3000 });
            this.loadFriends();
          }
        });
      }).catch(err => { console.error(err); alert('Error abriendo el diálogo'); });
    } catch (e) {
      console.error(e);
      this.snackBar.open('Error inesperado', 'Cerrar', { duration: 3000 });
    }
  }
}