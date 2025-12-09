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
import { MatDividerModule } from '@angular/material/divider';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
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
    MatDividerModule,
    OverlayModule,
    MatSnackBarModule,
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
      <a [routerLink]="showAuthenticatedControls ? '/home' : '/'" style="display:flex; align-items:center; text-decoration:none">
        <img src="assets/images/logo-claro.jpg" alt="PaySplit" style="height:40px;" />
      </a>
      <span class="spacer"></span>
      <button mat-icon-button (click)="toggleLang()" aria-label="Toggle language" style="font-size:24px">{{ lang.current === 'es' ? '🇪🇸' : '🇬🇧' }}</button>
      <button *ngIf="!authService.isLoggedIn() || !showAuthenticatedControls" mat-button routerLink="/login">{{ lang.t('login') }}</button>
      <button *ngIf="!authService.isLoggedIn() || !showAuthenticatedControls" mat-button routerLink="/register">{{ lang.t('register') }}</button>
      <!-- Amigos dropdown -->
      <button #friendsBtn *ngIf="authService.isLoggedIn() && showAuthenticatedControls" mat-button [matMenuTriggerFor]="friendsMenu" #friendsTrigger="matMenuTrigger" (menuOpened)="onFriendsMenuOpened()">{{ lang.t('friends') }}</button>
      <!-- Notificaciones -->
      <button
        *ngIf="authService.isLoggedIn() && showAuthenticatedControls"
        mat-icon-button
        routerLink="/notifications"
        aria-label="Notificaciones"
        style="width:48px;height:48px;display:flex;align-items:center;justify-content:center"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          style="width:28px;height:28px;display:block"
        >
          <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
      </button>
      <!-- Invitaciones a grupos -->
      <button *ngIf="authService.isLoggedIn() && showAuthenticatedControls" mat-button routerLink="/group-invitations">{{ lang.t('groupInvitations') }}</button>
      <mat-menu #friendsMenu="matMenu" yPosition="below" xPosition="before" [overlapTrigger]="false">
        <ng-container *ngIf="peticiones && peticiones.length">
          <button mat-menu-item #requestsOrigin="cdkOverlayOrigin" cdkOverlayOrigin (click)="$event.stopPropagation(); toggleRequests();">{{ lang.t('requests') }} ({{ peticiones.length }})</button>

          <ng-template
            cdk-connected-overlay
            [cdkConnectedOverlayOrigin]="requestsOrigin"
            [cdkConnectedOverlayPositions]="overlayPositions"
            [cdkConnectedOverlayOpen]="requestsOpen"
            [cdkConnectedOverlayHasBackdrop]="true"
            (backdropClick)="closeRequests()"
          >
            <div class="requests-panel" style="min-width:220px; padding:8px; background:var(--secondary-bg); color:var(--text-main); border-radius:8px;">
              <ng-container *ngFor="let p of peticiones">
                <div style="display:flex; align-items:center; justify-content:space-between; gap:8px; padding:6px 4px;">
                  <div style="flex:1; cursor:pointer;" (click)="openFriend(p)">{{ p?.nombre || p?.username || p?.email || p }}</div>
                  <div style="display:flex; gap:4px;">
                    <button mat-icon-button color="primary" (click)="acceptRequest(p)" [disabled]="p.processing"><mat-icon>check</mat-icon></button>
                    <button mat-icon-button (click)="rejectRequest(p)" [disabled]="p.processing"><mat-icon>close</mat-icon></button>
                  </div>
                </div>
              </ng-container>
              <div *ngIf="!peticiones || peticiones.length === 0">{{ lang.t('noRequests') }}</div>
            </div>
          </ng-template>
        </ng-container>

        <button mat-menu-item *ngFor="let f of friends" (click)="openFriend(f)">{{ f?.nombre || f?.name || f?.email || f }}</button>
        <button mat-menu-item disabled *ngIf="!friends || friends.length === 0">{{ lang.t('noMembers') }}</button>

        <!-- Añadir amigo: connected overlay anchored to this menu item -->
        <button mat-menu-item #addFriendOrigin="cdkOverlayOrigin" cdkOverlayOrigin (click)="$event.stopPropagation(); toggleAddFriend();">{{ lang.t('addFriend') }}</button>

        <ng-template
          cdk-connected-overlay
          [cdkConnectedOverlayOrigin]="addFriendOrigin"
          [cdkConnectedOverlayPositions]="overlayPositions"
          [cdkConnectedOverlayOpen]="addFriendOpen"
          [cdkConnectedOverlayHasBackdrop]="true"
          (backdropClick)="closeAddFriend()"
        >
          <div class="add-friend-panel" style="min-width:260px; padding:12px; background:var(--secondary-bg); color:var(--text-main); border-radius:8px;">
            <ng-container *ngIf="!addFriendSuccess; else addSuccess">
              <div style="display:flex; flex-direction:column; gap:8px;">
                <label style="font-weight:600;">{{ lang.t('name') }}</label>
                <input placeholder="username" [(ngModel)]="addFriendUsername" style="width:100%; padding:8px; background:transparent; color:var(--text-main); border:1px solid rgba(255,255,255,0.06); border-radius:4px;" />
                <div *ngIf="addFriendError" style="color:#ff4444; font-weight:600">{{ addFriendError }}</div>
                <div style="display:flex; justify-content:flex-end; gap:8px; margin-top:4px">
                  <button mat-button (click)="closeAddFriend()" [disabled]="addFriendLoading">{{ lang.t('cancel') }}</button>
                  <button mat-flat-button color="primary" (click)="onAddFriend()" [disabled]="addFriendLoading || !addFriendUsername || !addFriendUsername.trim()">{{ addFriendLoading ? lang.t('loading') : lang.t('add') }}</button>
                </div>
              </div>
            </ng-container>
            <ng-template #addSuccess>
              <div style="display:flex; flex-direction:column; align-items:center; gap:8px; padding:8px">
                <mat-icon style="font-size:28px; color:var(--primary-color)">check_circle</mat-icon>
                <div style="font-weight:700">{{ lang.t('friendRequestSent') }}</div>
              </div>
            </ng-template>
          </div>
        </ng-template>
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
  peticiones: any[] = [];
  requestsOpen = false;
  overlayPositions: any[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
  ];
  @ViewChild('friendsBtn', { read: ElementRef }) friendsBtn?: ElementRef;
  // add-friend overlay state
  addFriendOpen = false;
  addFriendUsername = '';
  addFriendLoading = false;
  addFriendError = '';
  addFriendSuccess = false;
  constructor(public authService: AuthService, private router: Router, private theme: ThemeService, public lang: LanguageService, private snackBar: MatSnackBar) {}

  ngOnInit(): void {
    // priority: user preference from server -> stored local preference -> default 'light'
    const user = this.authService.getUser();
    const userPrefRaw = user?.preferencia_tema;
    const normalizedUserPref = (() => {
      if (!userPrefRaw) return null;
      const v = String(userPrefRaw).trim().toLowerCase();
      if (v === 'oscuro' || v === 'dark') return 'dark';
      if (v === 'claro' || v === 'light') return 'light';
      return null;
    })();
    const stored = this.theme.getStoredTheme();
    const themeToApply = (normalizedUserPref === 'dark' || normalizedUserPref === 'light') ? normalizedUserPref : (stored || 'light');
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
    this.loadPeticiones();
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

  toggleRequests() {
    this.requestsOpen = !this.requestsOpen;
  }

  closeRequests() {
    this.requestsOpen = false;
  }

  toggleAddFriend() {
    this.addFriendOpen = !this.addFriendOpen;
    if (!this.addFriendOpen) {
      this.addFriendUsername = '';
      this.addFriendError = '';
      this.addFriendLoading = false;
    }
  }

  closeAddFriend() {
    this.addFriendOpen = false;
    this.addFriendUsername = '';
    this.addFriendError = '';
    this.addFriendLoading = false;
  }

  onAddFriend() {
    const v = String(this.addFriendUsername || '').trim();
    if (!v) return;
    this.addFriendError = '';
    this.addFriendLoading = true;

    this.authService.findUserByUsername(v).subscribe({
      next: (users: any[]) => {
        const match = (users || []).find(u => String(u.nombre || u.username || u.email).toLowerCase() === String(v).toLowerCase());
        if (!match) {
          this.addFriendError = 'Usuario no encontrado';
          this.addFriendLoading = false;
          return;
        }
        const receiverId = match._id || match.id;
        const me = this.authService.getUser();
        const senderId = me?._id || me?.id;
        if (!senderId) {
          this.addFriendError = 'No autenticado';
          this.addFriendLoading = false;
          return;
        }

        this.authService.addAmigo(String(receiverId), String(senderId)).subscribe({
          next: (response) => {
            console.log('Friend request SUCCESS response:', response);
            this.addFriendLoading = false;
            // show inline success feedback, then auto-close shortly after
            this.addFriendSuccess = true;
            this.snackBar.open('Solicitud de amistad enviada', 'Cerrar', { duration: 3000 });
            // refresh lists after a short delay
            setTimeout(() => {
              this.loadPeticiones();
              this.loadFriends();
              this.closeAddFriend();
              this.addFriendSuccess = false;
            }, 1400);
          },
          error: (err) => {
            console.error('Friend request ERROR:', err);
            console.error('Error status:', err.status);
            console.error('Error message:', err?.error?.message || err?.message);
            
            // Map English error messages to translation keys
            const errorMsg = err?.error?.message || err?.message || '';
            if (errorMsg.includes('Already friends')) {
              this.addFriendError = this.lang.t('alreadyFriends');
            } else if (errorMsg.includes('Friend request already sent')) {
              this.addFriendError = this.lang.t('friendRequestExists');
            } else {
              this.addFriendError = errorMsg || 'Error al enviar la solicitud';
            }
            this.addFriendLoading = false;
          }
        });
      },
      error: (err) => {
        console.error(err);
        this.addFriendError = err?.error?.message || err?.message || 'Error buscando usuario';
        this.addFriendLoading = false;
      }
    });
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
          const idsOrObjs: any[] = res?.amigos || res || [];
          if (!Array.isArray(idsOrObjs) || idsOrObjs.length === 0) { this.friends = []; return; }

          // If server already returned full friend objects (with nombre/email), use them directly.
          const looksLikeUserObjects = idsOrObjs.every(item => item && (item.nombre || item.email || item._id));
          if (looksLikeUserObjects) {
            this.friends = idsOrObjs.map((u: any) => {
              // normalize id field
              return { ...u, _id: u._id || u.id };
            });
            return;
          }

          // Otherwise treat them as ids (strings/ObjectId-like) and fetch each profile.
          const calls = idsOrObjs.map((fid: any) => {
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

  private loadPeticiones() {
    try {
      if (!this.authService.isLoggedIn()) { this.peticiones = []; return; }
      const user = this.authService.getUser();
      const userId = user?._id || user?.id;
      if (!userId) { this.peticiones = []; return; }

      this.authService.getPeticiones(String(userId)).subscribe({
        next: (res: any) => {
          const ids: any[] = res?.peticiones_amistad || res || [];
          if (!Array.isArray(ids) || ids.length === 0) { this.peticiones = []; return; }
          const calls = ids.map((fid: any) => {
            try { return this.authService.getUserBasicInfo(String(fid)); }
            catch { return of(null); }
          });
          forkJoin(calls).subscribe({
            next: (arr: any[]) => { this.peticiones = (arr || []).filter(Boolean); },
            error: () => { this.peticiones = []; }
          });
        },
        error: () => { this.peticiones = []; }
      });
    } catch (e) {
      this.peticiones = [];
    }
  }

  acceptRequest(p: any) {
    try {
      if (!p) return;
      p.processing = true;
      const me = this.authService.getUser();
      const myId = me?._id || me?.id;
      if (!myId) { this.snackBar.open('No autenticado', 'Cerrar', { duration: 3000 }); p.processing = false; return; }
      const senderId = p._id || p.id;
      this.authService.acceptAmigo(String(myId), String(senderId)).subscribe({
        next: () => {
          this.snackBar.open('Amigo aceptado', 'Cerrar', { duration: 3000 });
          this.loadPeticiones();
          this.loadFriends();
        },
        error: (err) => { console.error(err); this.snackBar.open('Error aceptando solicitud', 'Cerrar', { duration: 3000 }); p.processing = false; }
      });
    } catch (e) {
      console.error(e); p.processing = false;
    }
  }

  rejectRequest(p: any) {
    try {
      if (!p) return;
      p.processing = true;
      const me = this.authService.getUser();
      const myId = me?._id || me?.id;
      if (!myId) { this.snackBar.open('No autenticado', 'Cerrar', { duration: 3000 }); p.processing = false; return; }
      const senderId = p._id || p.id;
      this.authService.rejectAmigo(String(myId), String(senderId)).subscribe({
        next: () => {
          this.snackBar.open('Solicitud rechazada', 'Cerrar', { duration: 3000 });
          this.loadPeticiones();
        },
        error: (err) => { console.error(err); this.snackBar.open('Error rechazando solicitud', 'Cerrar', { duration: 3000 }); p.processing = false; }
      });
    } catch (e) {
      console.error(e); p.processing = false;
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

  
}