import { Component, OnInit, AfterViewInit, PLATFORM_ID, Inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router'; // Importar RouterModule
import { CommonModule } from '@angular/common';
import { ElementRef } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { ThemeService } from './core/theme.service';
import { LanguageService } from './core/language.service';
import { FooterComponent } from './shared/footer/footer.component';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button'; // Para botones de login/logout
import { MatIconModule } from '@angular/material/icon';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { Router } from '@angular/router';
import { ClickOutsideDirective } from './shared/click-outside.directive';

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
    OverlayModule,
    MatSnackBarModule,
    FormsModule,
    HttpClientModule,
    FooterComponent,
    ClickOutsideDirective,
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
      
      /* Navbar styles */
      .navbar-container {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        padding: 0 2rem;
      }

      .navbar-logo {
        display: flex;
        align-items: center;
        text-decoration: none;
        cursor: pointer;
      }

      .navbar-logo img {
        height: 40px;
        transition: transform 0.3s ease, filter 0.3s ease;
      }

      .navbar-logo:hover img {
        transform: scale(1.05);
        filter: drop-shadow(0 4px 12px rgba(122, 229, 130, 0.5));
      }

      .navbar-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .nav-button {
        padding: 0.6rem 1.2rem;
        border: 2px solid var(--primary-color);
        background-color: transparent;
        color: var(--primary-color);
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.85rem;
        transition: all 0.3s ease;
        text-decoration: none;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .nav-button:hover {
        background-color: var(--primary-color);
        color: var(--text-contrast);
      }

      .nav-button-filled {
        background-color: var(--primary-color);
        color: var(--text-contrast);
      }

      .nav-button-filled:hover {
        background-color: #000;
        border-color: #000;
        color: var(--primary-color);
      }

      .lang-button {
        background: none;
        border: 2px solid var(--primary-color);
        color: var(--primary-color);
        border-radius: 20px;
        padding: 0.4rem 0.9rem;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        display: inline-flex;
        align-items: center;
        gap: 8px;
      }

      .lang-button:hover {
        background-color: var(--primary-color);
        color: var(--text-contrast);
      }

      .lang-flag {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        object-fit: cover;
        box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.08);
      }

      .authenticated-actions {
        display: flex;
        align-items: center;
        gap: 1rem;
      }

      .icon-button {
        background: none;
        border: none;
        color: var(--text-main);
        cursor: pointer;
        padding: 0.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.5rem;
      }

      .icon-button:hover {
        color: var(--primary-color);
      }

      .profile-dropdown-container {
        position: relative;
      }

      .profile-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
        cursor: pointer;
        border: 2px solid var(--primary-color);
      }

      .profile-menu-dropdown {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--secondary-bg);
        border: 1px solid var(--divider-color);
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        min-width: 200px;
        z-index: 1000;
        margin-top: 8px;
      }

      .menu-header {
        padding: 12px 16px;
        font-weight: 600;
        color: var(--text-main);
        border-bottom: 1px solid var(--divider-color);
        font-size: 0.9rem;
        word-break: break-word;
      }

      .menu-item {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px 16px;
        background: none;
        border: none;
        color: var(--text-main) !important;
        cursor: pointer;
        font-size: 0.95rem;
        text-align: left;
      }

      .menu-item:hover {
        background: rgba(255, 255, 255, 0.05);
      }

      .menu-item mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
        color: var(--text-main) !important;
      }

      .menu-item span {
        color: var(--text-main) !important;
      }
    `,
  ],
  template: `
    <mat-toolbar color="primary">
      <div class="navbar-container">
        <!-- Logo -->
        <a [routerLink]="showAuthenticatedControls ? '/home' : '/'" class="navbar-logo">
          <img [src]="currentLogo" alt="PlaySplit" />
        </a>

        <!-- Acciones derecha -->
        <div class="navbar-actions">
          <!-- Botones de autenticación (sin sesión) -->
          <ng-container *ngIf="!authService.isLoggedIn() || !showAuthenticatedControls">
            <a routerLink="/login" class="nav-button">{{ lang.t('login') }}</a>
            <a routerLink="/register" class="nav-button nav-button-filled">{{ lang.t('register') }}</a>
            <button class="lang-button" (click)="toggleLang()" aria-label="Toggle language">
              <img
                class="lang-flag"
                [src]="lang.current === 'es' ? 'https://hatscripts.github.io/circle-flags/flags/es.svg' : 'https://hatscripts.github.io/circle-flags/flags/gb.svg'"
                [alt]="lang.current === 'es' ? 'Español' : 'English'"
              />
              <span>{{ lang.current === 'es' ? 'ES' : 'EN' }}</span>
            </button>
          </ng-container>

          <!-- Acciones autenticadas -->
          <ng-container *ngIf="authService.isLoggedIn() && showAuthenticatedControls">
            <!-- Idioma -->
            <button class="lang-button" (click)="toggleLang()" aria-label="Toggle language">
              <img
                class="lang-flag"
                [src]="lang.current === 'es' ? 'https://hatscripts.github.io/circle-flags/flags/es.svg' : 'https://hatscripts.github.io/circle-flags/flags/gb.svg'"
                [alt]="lang.current === 'es' ? 'Español' : 'English'"
              />
              <span>{{ lang.current === 'es' ? 'ES' : 'EN' }}</span>
            </button>

            <!-- Notificaciones -->
            <button
              class="icon-button"
              routerLink="/notifications"
              aria-label="Notificaciones"
              title="Notificaciones"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
                style="width:24px;height:24px"
              >
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
            </button>

            <!-- Perfil dropdown -->
            <div class="profile-dropdown-container" [appClickOutsideEnabled]="profileMenuOpen" (appClickOutside)="closeProfileMenu()">
              <button
                class="icon-button"
                (click)="toggleProfileMenu()"
                aria-label="Perfil"
                title="Perfil"
              >
                <ng-container *ngIf="authService.getUser()?.photo || authService.getUser()?.avatar || authService.getUser()?.picture || authService.getUser()?.foto_perfil; else defaultUserIcon">
                  <img 
                    [src]="authService.getUser()?.photo || authService.getUser()?.avatar || authService.getUser()?.picture || authService.getUser()?.foto_perfil" 
                    alt="avatar" 
                    class="profile-avatar" 
                  />
                </ng-container>
                <ng-template #defaultUserIcon>
                  <mat-icon>account_circle</mat-icon>
                </ng-template>
              </button>
              <div class="profile-menu-dropdown" *ngIf="profileMenuOpen">
                <div class="menu-header">
                  {{ authService.getUser()?.nombre || authService.getUser()?.email }}
                </div>
                <button class="menu-item" routerLink="/friends" (click)="closeProfileMenu()">
                  <mat-icon>people</mat-icon>
                  <span>{{ lang.t('friends') }}</span>
                </button>
                <button class="menu-item" routerLink="/settings" (click)="closeProfileMenu()">
                  <mat-icon>settings</mat-icon>
                  <span>{{ lang.t('settings') }}</span>
                </button>
                <button class="menu-item" (click)="logout()">
                  <mat-icon>logout</mat-icon>
                  <span>{{ lang.t('logout') }}</span>
                </button>
              </div>
            </div>
          </ng-container>
        </div>
      </div>
    </mat-toolbar>
    <main>
      <router-outlet></router-outlet>
    </main>
    <app-footer></app-footer>
  `,
})
export class AppComponent implements OnInit, AfterViewInit {
  title = 'bill-splitter-client';
  showAuthenticatedControls = true;
  friends: any[] = [];
  peticiones: any[] = [];
  requestsOpen = false;
  profileMenuOpen = false;
  overlayPositions: any[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top' },
    { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
  ];
  addFriendOpen = false;
  addFriendUsername = '';
  addFriendLoading = false;
  addFriendError = '';
  addFriendSuccess = false;
  constructor(
    public authService: AuthService, 
    private router: Router, 
    private theme: ThemeService, 
    public lang: LanguageService, 
    private snackBar: MatSnackBar,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  

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

  ngAfterViewInit(): void {
    this.startOverlayGuard();
  }

  get currentLogo(): string {
    return 'assets/images/logo_paysplit_def.svg';
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

  toggleProfileMenu() {
    this.profileMenuOpen = !this.profileMenuOpen;
  }

  closeProfileMenu() {
    this.profileMenuOpen = false;
  }

  navigateToFriends() {
    this.closeProfileMenu();
    setTimeout(() => this.router.navigate(['/friends']), 100);
  }

  toggleLang() {
    this.lang.toggle();
  }

  // Keep overlays sane: strip position: static from panes, keep them absolute
  // and ensure bounding boxes use flex-start vertically. Runs globally via MutationObserver.
  startOverlayGuard() {
    // Only run in browser, not during SSR
    if (!isPlatformBrowser(this.platformId)) return;
    
    const container = document.querySelector('.cdk-overlay-container');
    if (!container) {
      setTimeout(() => this.startOverlayGuard(), 100);
      return;
    }

    // Track which panes we've already patched to avoid duplicate work
    const patchedPanes = new WeakSet<HTMLElement>();

    const fixPane = (pane: HTMLElement) => {
      // Always force position to absolute
      if (pane.style.position !== 'absolute') {
        pane.style.setProperty('position', 'absolute', 'important');
      }
      
      // Check if pane has positioning coordinates - if not, it will render in flow
      const hasCoords = pane.style.top || pane.style.left || pane.style.right || pane.style.bottom;
      if (!hasCoords) {
        // Find the parent bounding box to understand the positioning context
        const boundingBox = pane.closest('.cdk-overlay-connected-position-bounding-box') as HTMLElement;
        if (boundingBox) {
          // Profile menu uses xPosition="before", so it should be right-aligned
          // Position at top of bounding box (Angular Material should handle correct top offset)
          pane.style.setProperty('top', '0', 'important');
          pane.style.setProperty('right', '0', 'important');
          pane.style.removeProperty('left');
          pane.style.removeProperty('bottom');
        } else {
          // Fallback: top-left
          pane.style.setProperty('top', '0', 'important');
          pane.style.setProperty('left', '0', 'important');
        }
      }
      
      // If already patched, we're done
      if (patchedPanes.has(pane)) {
        return;
      }
      
      // Intercept setAttribute to catch style attribute changes
      const originalSetAttribute = pane.setAttribute.bind(pane);
      pane.setAttribute = function(name: string, value: string) {
        if (name === 'style' && /position:\s*static/i.test(value)) {
          value = value.replace(/position:\s*static;?/gi, '') + '; position: absolute !important;';
        }
        return originalSetAttribute(name, value);
      };
      
      // Intercept direct style.position setter
      const styleDesc = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'style');
      if (styleDesc && styleDesc.get) {
        const originalStyle = styleDesc.get.call(pane);
        const positionDesc = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'position');
        
        if (positionDesc && positionDesc.set) {
          const originalPositionSetter = positionDesc.set;
          
          Object.defineProperty(originalStyle, 'position', {
            get: function() {
              return this.getPropertyValue('position') || 'absolute';
            },
            set: function(value: string) {
              if (value === 'static') {
                console.log('🚫 Blocked attempt to set position:static');
                this.setProperty('position', 'absolute', 'important');
              } else {
                originalPositionSetter.call(this, value);
              }
            },
            configurable: true,
            enumerable: true
          });
        }
      }
      
      // Force it right now
      pane.style.setProperty('position', 'absolute', 'important');
      
      patchedPanes.add(pane);
    };

    const fixBox = (box: HTMLElement) => {
      // Ensure bounding box has proper positioning
      if (!box.style.position || box.style.position === 'static') {
        box.style.setProperty('position', 'absolute', 'important');
      }
      
      // Force flex alignment with !important
      box.style.setProperty('align-items', 'flex-start', 'important');
      box.style.setProperty('justify-content', 'flex-start', 'important');
      
      // IMPORTANT: Reset height and width to auto so backdrop clicks work
      // Don't let the bounding box cover the entire viewport
      box.style.setProperty('height', 'auto', 'important');
      box.style.setProperty('width', 'auto', 'important');
    };

    const scan = (node: Node) => {
      if (!(node instanceof HTMLElement)) return;
      if (node.classList.contains('cdk-overlay-pane')) {
        fixPane(node);
      }
      if (node.classList.contains('cdk-overlay-connected-position-bounding-box')) {
        fixBox(node);
      }
    };

    const deepScan = () => {
      container.querySelectorAll('.cdk-overlay-pane').forEach(pane => fixPane(pane as HTMLElement));
      container.querySelectorAll('.cdk-overlay-connected-position-bounding-box').forEach(box => fixBox(box as HTMLElement));
    };

    // Initial pass
    deepScan();

    const obs = new MutationObserver((mutations) => {
      mutations.forEach(m => {
        // Check added nodes
        m.addedNodes.forEach(scan);
        
        // Check if style attribute changed on overlay elements
        if (m.type === 'attributes' && m.attributeName === 'style' && m.target instanceof HTMLElement) {
          if (m.target.classList.contains('cdk-overlay-pane')) {
            fixPane(m.target);
          }
          if (m.target.classList.contains('cdk-overlay-connected-position-bounding-box')) {
            fixBox(m.target);
          }
        }
      });
    });
    
    obs.observe(container, { 
      childList: true, 
      subtree: true, 
      attributes: true, 
      attributeFilter: ['style']
    });

    // Run periodic checks to catch any missed changes
    setInterval(deepScan, 250);
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
}