import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { LanguageService } from '../core/language.service';

@Component({
  standalone: true,
  selector: 'app-user-profile',
  imports: [CommonModule, RouterModule],
  template: `
    <div
      style="max-width:1000px; margin:88px auto 24px; padding:18px; background:var(--secondary-bg); border-radius:8px; color:var(--text-main);"
    >
      <button
        (click)="goBack()"
        style="margin-bottom:12px; background:transparent; border:none; color:var(--primary-color); cursor:pointer"
      >
        ← {{ lang.t('back') }}
      </button>

      <ng-container *ngIf="notAllowed">
        <div style="padding:24px; text-align:center;">
          <h2 style="margin:0 0 8px; color:var(--primary-color)">
            {{ targetDisplayName || 'Username' }}
          </h2>
          <p style="color:var(--text-muted); margin:0 0 12px">
            No puedes ver este perfil porque no sois amigos.
          </p>
          <div style="display:flex; justify-content:center; gap:8px">
            <button
              (click)="sendFriendRequest()"
              [disabled]="sendingRequest"
              style="background:var(--primary-color); border:none; padding:8px 12px; border-radius:6px; cursor:pointer"
            >
              {{ sendingRequest ? 'Enviando...' : 'Enviar solicitud' }}
            </button>
            <button
              (click)="goBack()"
              style="background:transparent; border:1px solid rgba(255,255,255,0.06); color:var(--text-main); padding:8px 12px; border-radius:6px; cursor:pointer"
            >
              {{ lang.t('back') }}
            </button>
          </div>
          <div
            *ngIf="requestMessage"
            style="margin-top:10px; color:var(--text-muted)"
          >
            {{ requestMessage }}
          </div>
        </div>
      </ng-container>

      <ng-container *ngIf="!notAllowed">
        <ng-container *ngIf="user; else loading">
          <!-- Two column layout -->
          <div style="display:flex; gap:24px; align-items:flex-start">
            <!-- Left column: Profile info -->
            <div style="flex:1">
              <div
                style="display:flex; align-items:center; gap:16px; margin-bottom:16px"
              >
                <div
                  style="width:80px; height:80px; border-radius:50%; background:linear-gradient(135deg, var(--primary-color) 0%, #667eea 100%); display:flex; align-items:center; justify-content:center; color:white; font-size:32px; font-weight:700; flex-shrink:0"
                >
                  {{
                    (user.nombre || user.username || 'U')
                      .charAt(0)
                      .toUpperCase()
                  }}
                </div>
                <div style="flex:1">
                  <h2 style="margin:0 0 8px">
                    {{ user.nombre || user.username || 'Usuario' }}
                  </h2>
                  <div style="color:var(--text-muted)">{{ user.email }}</div>
                </div>
              </div>
              <div
                style="display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px"
              >
                <div style="font-weight:600">{{ lang.t('registered') }}:</div>
                <div>
                  {{
                    user.fecha_registro
                      ? (user.fecha_registro | date: 'dd/MM/yyyy')
                      : 'N/A'
                  }}
                </div>
              </div>
              <div>
                <button
                  *ngIf="
                    isFriend && auth.getUser()?._id !== (user?._id || user?.id)
                  "
                  (click)="showConfirm = true"
                  style="background:#d9534f; border:none; color:white; padding:8px 12px; border-radius:6px; cursor:pointer"
                >
                  {{ lang.t('removeFriend') }}
                </button>
              </div>
            </div>

            <!-- Right column: Common groups -->
            <div style="width:320px; flex-shrink:0">
              <h3 style="margin:0 0 12px; font-size:1rem">
                {{ lang.t('commonGroups') }} ({{ commonGroups.length }})
              </h3>
              <div
                *ngIf="loadingGroups"
                style="color:var(--text-muted); font-size:0.9rem"
              >
                {{ lang.t('loading') }}...
              </div>
              <div
                *ngIf="!loadingGroups && commonGroups.length === 0"
                style="color:var(--text-muted); font-size:0.9rem"
              >
                {{ lang.t('noGroups') }}
              </div>
              <div
                *ngIf="!loadingGroups && commonGroups.length > 0"
                style="display:flex; flex-direction:column; gap:8px; max-height:400px; overflow-y:auto"
              >
                <div
                  *ngFor="let group of commonGroups"
                  (click)="openGroup(group)"
                  style="padding:12px; border-radius:6px; background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.06); cursor:pointer; transition:all 0.2s"
                  onmouseover="this.style.background='rgba(255,255,255,0.06)'"
                  onmouseout="this.style.background='rgba(255,255,255,0.03)'"
                >
                  <div style="font-weight:600; font-size:0.95rem">
                    {{ group.nombre || 'Grupo sin nombre' }}
                  </div>
                  <div
                    style="font-size:0.8rem; color:var(--text-muted); margin-top:4px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap"
                  >
                    {{ group.descripcion || 'Sin descripción' }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ng-container>
        <ng-template #loading>
          <div>{{ lang.t('loading') }}...</div>
        </ng-template>
      </ng-container>

      <!-- Confirmation overlay -->
      <div
        *ngIf="showConfirm"
        style="position:fixed; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(0,0,0,0.45); z-index:1000;"
      >
        <div
          style="background:var(--secondary-bg); padding:20px; border-radius:8px; width:320px; text-align:center; color:var(--text-main);"
        >
          <div style="font-weight:700; margin-bottom:8px">
            {{ lang.t('removeFriend') }}?
          </div>
          <div style="color:var(--text-muted); margin-bottom:16px">
            Esta acción eliminará la relación de amistad.
          </div>
          <div style="display:flex; gap:8px; justify-content:center;">
            <button
              (click)="unfriend()"
              style="background:var(--danger-color, #d9534f); border:none; color:white; padding:8px 12px; border-radius:6px; cursor:pointer"
            >
              {{ lang.t('delete') }}
            </button>
            <button
              (click)="showConfirm = false"
              style="background:transparent; border:1px solid rgba(255,255,255,0.06); color:var(--text-main); padding:8px 12px; border-radius:6px; cursor:pointer"
            >
              {{ lang.t('cancel') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class UserProfileComponent implements OnInit {
  user: any = null;
  notAllowed = false;
  sendingRequest = false;
  requestMessage = '';
  targetDisplayName = '';
  isFriend = false;
  showConfirm = false;
  commonGroups: any[] = [];
  loadingGroups = false;

  constructor(
    private route: ActivatedRoute,
    public auth: AuthService,
    private router: Router,
    public lang: LanguageService,
  ) {}

  ngOnInit(): void {
    const id = String(this.route.snapshot.paramMap.get('id') || '');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) {
      this.router.navigate(['/login']);
      return;
    }

    // allow viewing own profile
    if (String(myId) === String(id)) {
      this.loadProfile(id);
      return;
    }

    // fetch minimal public info (display name) so we can show who the request will go to
    // Note: this may fail with 403 if not friends yet, that's expected
    this.auth.getUserById(id).subscribe({
      next: (u) => {
        this.targetDisplayName = u?.nombre || u?.username || u?.email || '';
      },
      error: (err) => {
        // if 403, it's expected - we'll handle it after checking amigos
        // if other error, log it
        if (err?.status !== 403 && err?.status !== 401) {
          console.warn('Failed to fetch target user display name', err);
        }
      },
    });

    // check if target user is in current user's amigos
    this.auth.getAmigos(String(myId)).subscribe({
      next: (res: any) => {
        const friendsData: any[] =
          res && res.amigos ? res.amigos : Array.isArray(res) ? res : [];
        const found = (friendsData || []).some((v: any) => {
          try {
            // Handle both populated objects (with _id/id) and plain ID strings
            const friendId = String(v?._id || v?.id || v);
            return friendId === String(id);
          } catch {
            return false;
          }
        });
        this.isFriend = !!found;
        if (!found) {
          this.notAllowed = true;
          // If we have the user data already from the friend object, use it
          const friendObj = friendsData.find((v: any) => {
            try {
              const friendId = String(v?._id || v?.id || v);
              return friendId === String(id);
            } catch {
              return false;
            }
          });
          if (friendObj && (friendObj.nombre || friendObj.email)) {
            this.targetDisplayName =
              friendObj.nombre || friendObj.username || friendObj.email || '';
          }
          return;
        }
        // If friend, try to use the populated data first before fetching
        const friendObj = friendsData.find((v: any) => {
          try {
            const friendId = String(v?._id || v?.id || v);
            return friendId === String(id);
          } catch {
            return false;
          }
        });
        if (friendObj && (friendObj.nombre || friendObj.email)) {
          // Use the populated friend data directly
          this.user = friendObj;
          this.loadCommonGroups(String(myId), id);
        } else {
          // Fall back to fetching if not populated
          this.loadProfile(id);
          this.loadCommonGroups(String(myId), id);
        }
      },
      error: () => {
        this.router.navigate(['/']);
      },
    });
  }

  private loadProfile(id: string) {
    this.auth.getUserById(id).subscribe({
      next: (u) => {
        this.user = u;
        console.log('Loaded user profile:', u);
        const me = this.auth.getUser();
        const myId = me?._id || me?.id;
        if (myId) {
          this.loadCommonGroups(String(myId), id);
        }
      },
      error: (err) => {
        console.error('Failed to load profile:', err);
        this.user = null;
        // If we can't load the profile even though we thought we were friends,
        // show the not-allowed message
        this.notAllowed = true;
        this.requestMessage =
          err?.error?.message || 'No se pudo cargar el perfil';
      },
    });
  }

  goBack() {
    this.router.navigate(['/home']);
  }

  loadCommonGroups(myId: string, friendId: string) {
    this.loadingGroups = true;
    this.commonGroups = [];

    // Get my groups
    this.auth.getGroupsForUser(myId).subscribe({
      next: (myGroups: any[]) => {
        // Get friend's groups
        this.auth.getGroupsForUser(friendId).subscribe({
          next: (friendGroups: any[]) => {
            // Find common groups by comparing group IDs
            const myGroupIds = new Set(
              (myGroups || []).map((g: any) => String(g._id || g.id)),
            );
            this.commonGroups = (friendGroups || []).filter((g: any) => {
              const gid = String(g._id || g.id);
              return myGroupIds.has(gid);
            });
            this.loadingGroups = false;
          },
          error: () => {
            this.loadingGroups = false;
          },
        });
      },
      error: () => {
        this.loadingGroups = false;
      },
    });
  }

  openGroup(group: any) {
    const gid = group._id || group.id;
    if (gid) {
      this.router.navigate(['/group', gid]);
    }
  }

  sendFriendRequest() {
    if (this.sendingRequest) return;
    const id = String(this.route.snapshot.paramMap.get('id') || '');
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) {
      this.requestMessage = 'Debes iniciar sesión para enviar la solicitud.';
      return;
    }
    this.sendingRequest = true;
    this.requestMessage = '';
    this.auth.addAmigo(id, String(myId)).subscribe({
      next: () => {
        this.sendingRequest = false;
        this.requestMessage = 'Solicitud enviada.';
        // after sending, prevent resending
        this.notAllowed = false; // optionally allow viewing once request is accepted; keep hidden for now
      },
      error: (err) => {
        this.sendingRequest = false;
        this.requestMessage = err?.error?.message || 'Error enviando solicitud';
      },
    });
  }

  // Confirmation handled via in-app modal (showConfirm)

  unfriend() {
    const id = String(this.route.snapshot.paramMap.get('id') || '');
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) {
      this.requestMessage = 'Debes iniciar sesión.';
      return;
    }
    this.requestMessage = '';
    this.auth.removeAmigo(String(myId), id).subscribe({
      next: () => {
        this.requestMessage = 'Amigo eliminado.';
        this.isFriend = false;
        this.showConfirm = false;
        // once unfriended, hide profile
        this.notAllowed = true;
      },
      error: (err) => {
        this.requestMessage = err?.error?.message || 'Error eliminando amigo';
      },
    });
  }
}

/* Insert the confirmation overlay markup into the component template via a small appended template block.
   Since this file uses an inline template, we'll place the overlay markup by updating the template string above.
   To keep the patch simple and avoid large template rewrites, reopen the file and inject the overlay block after
   the main container using a second-level template string. */

/* Add a basic in-app confirmation overlay at the end of the template. */
