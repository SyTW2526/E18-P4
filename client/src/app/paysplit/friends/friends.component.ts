import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { LanguageService } from '../../core/language.service';

@Component({
  selector: 'app-friends',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
  ],
  template: `
    <div class="friends-container">
      <div style="display:flex;align-items:center;gap:1rem;margin-bottom:2rem">
        <button mat-icon-button (click)="goBack()" class="back-button">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 style="margin:0">{{ lang.t('friends') }}</h1>
      </div>

      <!-- TABS para cambiar entre vistas -->
      <div
        style="display:flex;gap:1rem;margin-bottom:2rem;border-bottom:2px solid rgba(255,255,255,0.1)"
      >
        <button
          mat-button
          (click)="currentTab = 'requests'"
          [style.color]="
            currentTab === 'requests'
              ? 'var(--primary-color)'
              : 'var(--text-muted)'
          "
          style="border-bottom:3px solid transparent"
          [style.border-bottom]="
            currentTab === 'requests'
              ? '3px solid var(--primary-color)'
              : '3px solid transparent'
          "
        >
          <mat-icon>mail_outline</mat-icon>
          {{ lang.t('requests') }}
          <span
            *ngIf="peticiones.length > 0"
            style="margin-left:0.5rem;background:var(--primary-color);color:white;padding:0.1rem 0.5rem;border-radius:20px;font-size:0.8rem"
            >{{ peticiones.length }}</span
          >
        </button>
        <button
          mat-button
          (click)="currentTab = 'friends'"
          [style.color]="
            currentTab === 'friends'
              ? 'var(--primary-color)'
              : 'var(--text-muted)'
          "
          style="border-bottom:3px solid transparent"
          [style.border-bottom]="
            currentTab === 'friends'
              ? '3px solid var(--primary-color)'
              : '3px solid transparent'
          "
        >
          <mat-icon>people</mat-icon>
          {{ lang.t('friends') }}
        </button>
        <button
          mat-button
          (click)="currentTab = 'add'"
          [style.color]="
            currentTab === 'add' ? 'var(--primary-color)' : 'var(--text-muted)'
          "
          style="border-bottom:3px solid transparent"
          [style.border-bottom]="
            currentTab === 'add'
              ? '3px solid var(--primary-color)'
              : '3px solid transparent'
          "
        >
          <mat-icon>person_add</mat-icon>
          {{ lang.t('addFriend') || 'Añadir' }}
        </button>
      </div>

      <!-- REQUESTS TAB -->
      <div *ngIf="currentTab === 'requests'" class="section">
        <div
          *ngIf="loadingRequests"
          style="text-align:center;padding:2rem;color:var(--text-muted)"
        >
          {{ lang.t('loading') }}...
        </div>

        <div
          *ngIf="!loadingRequests && peticiones.length === 0"
          style="text-align:center;padding:2rem"
        >
          <mat-card style="padding:2rem">
            <mat-icon
              style="font-size:48px;width:48px;height:48px;color:var(--text-muted);margin-bottom:1rem"
              >person_add_disabled</mat-icon
            >
            <p style="color:var(--text-muted);margin:0">
              {{
                lang.t('noFriendRequests') || 'No tienes solicitudes pendientes'
              }}
            </p>
          </mat-card>
        </div>

        <div
          *ngIf="!loadingRequests && peticiones.length > 0"
          style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:1.5rem"
        >
          <mat-card
            *ngFor="let request of peticiones"
            style="padding:0;overflow:hidden;display:flex;flex-direction:column"
          >
            <!-- Header con foto -->
            <div
              style="height:120px;background:linear-gradient(135deg, var(--primary-color) 0%, #667eea 100%);display:flex;align-items:center;justify-content:center;position:relative"
            >
              <div
                *ngIf="request.foto_perfil"
                style="width:80px;height:80px;border-radius:50%;overflow:hidden;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)"
              >
                <img
                  [src]="request.foto_perfil"
                  style="width:100%;height:100%;object-fit:cover"
                />
              </div>
              <div
                *ngIf="!request.foto_perfil"
                style="width:80px;height:80px;border-radius:50%;background:rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;color:white;font-weight:700;font-size:32px;border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.2)"
              >
                {{ (request.nombre || 'U').charAt(0).toUpperCase() }}
              </div>
            </div>

            <!-- Content -->
            <div
              style="padding:1.5rem;flex:1;display:flex;flex-direction:column"
            >
              <div style="margin-bottom:1rem">
                <h3
                  style="margin:0 0 0.25rem 0;color:var(--text-main);font-size:1.1rem"
                >
                  {{ request.nombre }}
                </h3>
                <p style="margin:0;color:var(--text-muted);font-size:0.85rem">
                  {{ request.email }}
                </p>
              </div>

              <p
                style="margin:1rem 0 0 0;color:var(--text-muted);font-size:0.9rem;flex:1"
              >
                {{ lang.t('youHaveSent') }}
              </p>
            </div>

            <!-- Actions -->
            <div
              style="display:flex;gap:0.5rem;padding:1rem;background:rgba(255,255,255,0.03);border-top:1px solid rgba(255,255,255,0.1)"
            >
              <button
                mat-stroked-button
                color="warn"
                (click)="rechazar(request)"
                [disabled]="request.loading"
                style="flex:1"
              >
                <mat-icon>close</mat-icon>
                {{ lang.t('reject') || 'Rechazar' }}
              </button>
              <button
                mat-flat-button
                color="primary"
                (click)="aceptar(request)"
                [disabled]="request.loading"
                style="flex:1"
              >
                <mat-icon>check</mat-icon>
                {{
                  request.loading
                    ? (lang.t('loading') || 'Cargando') + '...'
                    : lang.t('accept') || 'Aceptar'
                }}
              </button>
            </div>
          </mat-card>
        </div>
      </div>

      <!-- FRIENDS TAB -->
      <div *ngIf="currentTab === 'friends'" class="section">
        <h2>{{ lang.t('friends') }}</h2>
        <div
          *ngIf="amigos && amigos.length > 0; else noFriends"
          class="friends-list"
        >
          <div *ngFor="let friend of amigos" class="friend-item">
            <div style="display:flex;align-items:center;gap:1rem;flex:1">
              <mat-icon>account_circle</mat-icon>
              <span>{{
                friend?.nombre ||
                  friend?.name ||
                  friend?.username ||
                  friend?.email
              }}</span>
            </div>
            <button
              mat-icon-button
              color="warn"
              (click)="eliminarAmigo(friend)"
              title="Remove friend"
            >
              <mat-icon>delete</mat-icon>
            </button>
          </div>
        </div>
        <ng-template #noFriends>
          <p class="no-data">
            {{ lang.t('noFriendsList') || 'No tienes amigos aún' }}
          </p>
        </ng-template>
      </div>

      <!-- ADD FRIENDS TAB -->
      <div *ngIf="currentTab === 'add'">
        <mat-card style="padding:24px;margin-bottom:2rem">
          <h3 style="margin:0 0 1rem 0">
            {{ lang.t('searchUser') || 'Buscar usuario' }}
          </h3>

          <div style="display:flex;gap:1rem;margin-bottom:1.5rem">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="buscar()"
              [placeholder]="lang.t('typeUserName')"
              style="flex:1;padding:10px 12px;border:1px solid rgba(255,255,255,0.2);border-radius:4px;background:var(--secondary-bg);color:var(--text-main);font-size:0.95rem"
            />
            <button
              mat-stroked-button
              (click)="buscar()"
              [disabled]="searchQuery.length < 2"
            >
              <mat-icon>search</mat-icon>
            </button>
          </div>

          <div
            *ngIf="loadingSearch"
            style="text-align:center;padding:1rem;color:var(--text-muted)"
          >
            {{ lang.t('loading') }}...
          </div>

          <div
            *ngIf="
              !loadingSearch &&
              searchResults.length === 0 &&
              searchQuery.length >= 2
            "
            style="text-align:center;padding:1rem;color:var(--text-muted)"
          >
            {{ lang.t('noResults') || 'No se encontraron usuarios' }}
          </div>

          <div
            *ngIf="searchResults.length > 0"
            style="display:flex;flex-direction:column;gap:0.75rem"
          >
            <div
              *ngFor="let user of searchResults"
              (click)="seleccionar(user)"
              [style.background]="
                selectedUser?._id === user._id
                  ? 'rgba(var(--primary-color-rgb, 103, 58, 183), 0.15)'
                  : 'transparent'
              "
              style="padding:1rem;border:1px solid rgba(255,255,255,0.1);border-radius:6px;cursor:pointer;transition:all 0.2s;display:flex;align-items:center;gap:1rem"
            >
              <div
                *ngIf="user.foto_perfil"
                style="width:50px;height:50px;border-radius:50%;overflow:hidden;flex-shrink:0"
              >
                <img
                  [src]="user.foto_perfil"
                  style="width:100%;height:100%;object-fit:cover"
                />
              </div>
              <div
                *ngIf="!user.foto_perfil"
                style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg, var(--primary-color) 0%, #667eea 100%);display:flex;align-items:center;justify-content:center;color:white;font-weight:600;flex-shrink:0"
              >
                {{ (user.nombre || 'U').charAt(0).toUpperCase() }}
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-weight:600;color:var(--text-main)">
                  {{ user.nombre }}
                </div>
                <div style="font-size:0.85rem;color:var(--text-muted)">
                  {{ user.email }}
                </div>
              </div>
              <mat-icon *ngIf="selectedUser?._id === user._id" color="primary"
                >check_circle</mat-icon
              >
            </div>
          </div>
        </mat-card>

        <mat-card *ngIf="selectedUser" style="padding:24px">
          <h3 style="margin:0 0 1rem 0">{{ selectedUser.nombre }}</h3>

          <div
            style="display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem"
          >
            <div
              *ngIf="selectedUser.foto_perfil"
              style="width:80px;height:80px;border-radius:50%;overflow:hidden"
            >
              <img
                [src]="selectedUser.foto_perfil"
                style="width:100%;height:100%;object-fit:cover"
              />
            </div>
            <div
              *ngIf="!selectedUser.foto_perfil"
              style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg, var(--primary-color) 0%, #667eea 100%);display:flex;align-items:center;justify-content:center;color:white;font-weight:600;font-size:32px"
            >
              {{ (selectedUser.nombre || 'U').charAt(0).toUpperCase() }}
            </div>
            <div>
              <div
                style="font-size:0.9rem;color:var(--text-muted);margin-bottom:0.5rem"
              >
                {{ lang.t('email') }}
              </div>
              <div style="font-size:0.95rem">{{ selectedUser.email }}</div>
            </div>
          </div>

          <div
            *ngIf="isFriend"
            style="padding:1rem;background:rgba(34, 197, 94, 0.1);border-radius:6px;margin-bottom:1rem;color:#22c55e;display:flex;align-items:center;gap:0.5rem"
          >
            <mat-icon>check_circle</mat-icon>
            <span>{{ lang.t('youAreFriends') }}</span>
          </div>

          <div
            *ngIf="hasPendingRequest"
            style="padding:1rem;background:rgba(59, 130, 246, 0.1);border-radius:6px;margin-bottom:1rem;color:#3b82f6;display:flex;align-items:center;gap:0.5rem"
          >
            <mat-icon>pending</mat-icon>
            <span>{{ lang.t('friendRequestSentMsg') }}</span>
          </div>

          <div
            *ngIf="errorAdd"
            style="padding:1rem;background:rgba(239, 68, 68, 0.1);border-radius:6px;margin-bottom:1rem;color:#ef4444;display:flex;align-items:center;gap:0.5rem"
          >
            <mat-icon>error</mat-icon>
            <span>{{ errorAdd }}</span>
          </div>

          <div style="display:flex;gap:1rem">
            <button mat-stroked-button (click)="clearSelection()">
              {{ lang.t('cancel') || 'Cancelar' }}
            </button>
            <button
              mat-flat-button
              color="primary"
              (click)="enviarSolicitud()"
              [disabled]="sending || isFriend || hasPendingRequest"
            >
              {{
                sending
                  ? (lang.t('loading') || 'Enviando') + '...'
                  : lang.t('sendInvitation') || 'Enviar solicitud'
              }}
            </button>
          </div>
        </mat-card>
      </div>
    </div>
  `,
  styles: [
    `
      .friends-container {
        max-width: 1000px;
        margin: 0 auto;
        padding: 2rem;
      }

      h1 {
        color: var(--text-main);
        margin-bottom: 2rem;
      }

      h2 {
        color: var(--text-main);
        margin-bottom: 1rem;
        font-size: 1.1rem;
      }

      h3 {
        color: var(--text-main);
      }

      .section {
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--secondary-bg);
        border-radius: 8px;
      }

      .request-list,
      .friends-list {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      .request-item,
      .friend-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 6px;
        border: 1px solid var(--muted-border);
      }

      .friend-item {
        gap: 1rem;
      }

      .request-info {
        flex: 1;
      }

      .request-actions {
        display: flex;
        gap: 0.5rem;
      }

      .friend-item mat-icon {
        color: var(--primary-color);
        font-size: 24px;
        width: 24px;
        height: 24px;
      }

      .no-data {
        color: var(--text-muted);
        font-style: italic;
        text-align: center;
        padding: 2rem;
      }

      mat-form-field {
        width: 100%;
      }

      .error-message {
        color: #ff4444;
        font-weight: 600;
        padding: 0.5rem;
        text-align: center;
      }

      .button-group {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
      }

      .success-message {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        padding: 2rem;
        text-align: center;
      }

      .success-message mat-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--primary-color);
      }

      .success-message span {
        font-weight: 700;
        color: var(--text-main);
      }

      .back-button {
        background: rgba(103, 58, 183, 0.2);
        color: var(--primary-color);
        border-radius: 8px;
        transition: all 0.3s ease;
      }

      .back-button:hover {
        background: rgba(103, 58, 183, 0.4);
      }

      .scroll-to-top-btn {
        position: fixed;
        top: 1rem;
        left: 1rem;
        z-index: 100;
        background: rgba(103, 58, 183, 0.9);
        color: white;
        width: 50px;
        height: 50px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transition: all 0.3s ease;
      }

      .scroll-to-top-btn:hover {
        background: var(--primary-color);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
      }
    `,
  ],
})
export class FriendsComponent implements OnInit {
  // Tabs
  currentTab: 'requests' | 'friends' | 'add' = 'requests';

  // Scroll to top
  showScrollButton = false;

  // Friends & Requests
  amigos: any[] = [];
  peticiones: any[] = [];
  friends: any[] = [];
  loadingRequests = false;

  // Search & Add Friend
  searchQuery = '';
  searchResults: any[] = [];
  selectedUser: any = null;
  loadingSearch = false;
  sending = false;
  errorAdd: string | null = null;
  isFriend = false;
  hasPendingRequest = false;
  currentUser: any = null;

  // Old properties (keep for compatibility)
  addFriendUsername = '';
  addFriendLoading = false;
  addFriendError = '';
  addFriendSuccess = false;

  constructor(
    public lang: LanguageService,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getUser();
    this.loadAll();
    this.setupScrollListener();
  }

  setupScrollListener() {
    window.addEventListener('scroll', () => {
      this.showScrollButton = window.scrollY > 0;
    });
  }

  scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  loadAll() {
    this.loadFriends();
    this.loadRequests();
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  // ===== FRIENDS TAB =====
  loadFriends() {
    if (!this.currentUser) return;

    this.authService.getAmigos(this.currentUser._id).subscribe({
      next: (res: any) => {
        this.amigos = res.amigos || [];
        this.friends = this.amigos; // Para compatibilidad
      },
    });
  }

  eliminarAmigo(friend: any) {
    if (!confirm(`${this.lang.t('removeFriendConfirm')} ${friend.nombre}?`))
      return;

    const friendId = friend._id || friend.id;
    if (!friendId) return;

    this.authService
      .removeAmigo(this.currentUser._id, String(friendId))
      .subscribe({
        next: () => {
          alert(this.lang.t('friendDeletedMsg'));
          this.loadFriends();
        },
        error: (err: any) => {
          alert(
            this.lang.t('errorDelete') +
              (err.error?.message || this.lang.t('errorSendRequest')),
          );
        },
      });
  }

  // ===== REQUESTS TAB =====
  loadRequests() {
    if (!this.currentUser) return;

    this.loadingRequests = true;
    this.authService.getPeticiones(this.currentUser._id).subscribe({
      next: (res: any) => {
        const peticionesIds = res.peticiones_amistad || [];

        // Obtener detalles de cada usuario que envió la solicitud
        Promise.all(
          peticionesIds.map((userId: any) => {
            const id =
              typeof userId === 'object'
                ? userId._id || userId.id || userId
                : userId;
            return this.authService
              .getUsuarioBasico(String(id))
              .toPromise()
              .catch(() => null);
          }),
        ).then((users) => {
          this.peticiones = users
            .filter((u: any) => u !== null)
            .map((u: any) => ({
              ...u,
              loading: false,
            }));
          this.loadingRequests = false;
        });
      },
      error: () => {
        this.peticiones = [];
        this.loadingRequests = false;
      },
    });
  }

  aceptar(request: any) {
    const userId = request._id || request.id;
    if (!userId || !this.currentUser) return;

    request.loading = true;
    this.authService
      .acceptAmigo(this.currentUser._id, String(userId))
      .subscribe({
        next: () => {
          request.loading = false;
          alert(`${this.lang.t('friendRequestSuccess')} ${request.nombre}!`);
          this.peticiones = this.peticiones.filter(
            (r) => (r._id || r.id) !== userId,
          );
          this.loadFriends();
        },
        error: (err: any) => {
          request.loading = false;
          alert(
            this.lang.t('errorDelete') +
              (err.error?.message || this.lang.t('errorAccept')),
          );
        },
      });
  }

  rechazar(request: any) {
    const userId = request._id || request.id;
    if (!userId || !this.currentUser) return;

    if (!confirm(`${this.lang.t('rejectConfirm')} ${request.nombre}?`)) return;

    request.loading = true;
    this.authService
      .rejectAmigo(this.currentUser._id, String(userId))
      .subscribe({
        next: () => {
          request.loading = false;
          this.peticiones = this.peticiones.filter(
            (r) => (r._id || r.id) !== userId,
          );
        },
        error: (err: any) => {
          request.loading = false;
          alert(
            this.lang.t('errorDelete') +
              (err.error?.message || this.lang.t('errorReject')),
          );
        },
      });
  }

  // ===== ADD FRIENDS TAB =====
  buscar() {
    if (this.searchQuery.length < 2) {
      console.log(
        '[Search] Query too short:',
        this.searchQuery.length,
        'chars',
      );
      this.searchResults = [];
      return;
    }

    console.log('[Search] Buscando:', this.searchQuery);
    this.loadingSearch = true;
    this.errorAdd = null;
    this.authService.searchUsers(this.searchQuery).subscribe({
      next: (results) => {
        console.log('[Search] Resultados recibidos:', results.length);
        results.forEach((u: any) => {
          console.log('[Search] - ' + u.nombre + ' (' + u.email + ')');
        });
        // Filtrar al usuario actual de los resultados
        this.searchResults = results.filter(
          (u: any) => String(u._id) !== String(this.currentUser?._id),
        );
        console.log('[Search] Después de filtrar:', this.searchResults.length);
        this.loadingSearch = false;
      },
      error: (err: any) => {
        console.error('[Search] Error:', err);
        this.searchResults = [];
        this.errorAdd = this.lang.t('errorSearch');
        this.loadingSearch = false;
      },
    });
  }

  seleccionar(user: any) {
    this.selectedUser = user;
    this.errorAdd = null;
    this.actualizarEstadoAmistad();
  }

  actualizarEstadoAmistad() {
    if (!this.selectedUser) return;

    const userId = String(this.selectedUser._id);
    this.isFriend = this.amigos.some((a: any) => String(a._id || a) === userId);
    this.hasPendingRequest = this.peticiones.some(
      (p: any) => String(p._id || p) === userId,
    );
  }

  enviarSolicitud() {
    if (!this.selectedUser || !this.currentUser) {
      this.errorAdd = this.lang.t('errorInvalidUser');
      return;
    }

    const userId = this.selectedUser._id || this.selectedUser.id;
    if (!userId) {
      this.errorAdd = this.lang.t('errorInvalidId');
      return;
    }

    // Validar que el usuario exista antes de enviar
    this.sending = true;
    this.errorAdd = null;

    console.log('[Friend Request] Verificando usuario:', userId);

    // Primero verificar que el usuario existe en el sistema
    this.authService.getUsuarioBasico(userId).subscribe({
      next: (user: any) => {
        console.log('[Friend Request] Usuario verificado:', user);
        if (!user || !user._id) {
          this.sending = false;
          this.errorAdd = this.lang.t('errorUserNotExists');
          return;
        }

        // Usuario existe, enviar solicitud
        console.log(
          '[Friend Request] Enviando solicitud de',
          this.currentUser._id,
          'a',
          userId,
        );
        this.authService.addAmigo(userId, this.currentUser._id).subscribe({
          next: (response: any) => {
            console.log(
              '[Friend Request] Solicitud enviada exitosamente:',
              response,
            );
            this.sending = false;
            this.hasPendingRequest = true;
            alert(
              this.lang.t('friendRequestSentTo') +
                ' ' +
                this.selectedUser.nombre,
            );
          },
          error: (err: any) => {
            console.error('[Friend Request] Error al enviar solicitud:', err);
            this.sending = false;
            this.errorAdd =
              err.error?.message || this.lang.t('errorSendRequest');
          },
        });
      },
      error: (err: any) => {
        console.error('[Friend Request] Error verificando usuario:', err);
        this.sending = false;
        this.errorAdd = this.lang.t('errorUserNotFound');
      },
    });
  }

  clearSelection() {
    this.selectedUser = null;
    this.errorAdd = null;
  }

  // ===== Old methods (keep for compatibility) =====
  acceptRequest(request: any) {
    this.aceptar(request);
  }

  rejectRequest(request: any) {
    this.rechazar(request);
  }

  onAddFriend() {
    if (!this.addFriendUsername || !this.addFriendUsername.trim()) {
      return;
    }

    this.addFriendLoading = true;
    this.addFriendError = '';

    // TODO: Implement API call to add friend
    setTimeout(() => {
      this.addFriendLoading = false;
      this.addFriendSuccess = true;
    }, 500);
  }

  resetAddFriend() {
    this.addFriendUsername = '';
    this.addFriendError = '';
    this.addFriendSuccess = false;
  }
}
