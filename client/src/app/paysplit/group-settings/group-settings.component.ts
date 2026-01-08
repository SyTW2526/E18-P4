import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { LanguageService } from '../../core/language.service';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-group-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './group-settings.component.html',
  styleUrls: ['./group-settings.component.css'],
})
export class GroupSettingsComponent implements OnInit {
  accountId = '';
  account: any = null;
  originalAccount: any = null;
  miembros: any[] = [];
  myRole: 'owner' | 'admin' | 'miembro' = 'miembro';
  loading = false;
  saving = false;
  error: string | null = null;
  saveMessage: string | null = null;

  // Group avatar state
  groupImageSrc: string | null = null;

  currencyOptions = [
    { code: 'EUR', label: 'Euro', symbol: '€' },
    { code: 'USD', label: 'US Dollar', symbol: '$' },
    { code: 'GBP', label: 'British Pound', symbol: '£' },
  ];

  // Add friend modal state
  showAddFriendModal = false;
  availableFriends: any[] = [];
  selectedFriendToAdd: string | null = null;
  loadingFriends = false;
  addingFriend = false;
  addFriendError: string | null = null;
  addFriendSuccess = false;

  actionLoading: string | null = null;
  actionError: string | null = null;

  // Invitation links state
  invitationLinks: any[] = [];
  loadingLinks = false;
  showCreateLinkForm = false;
  newLinkMaxUses: number | null = null;
  newLinkExpirationDays: number | null = null;
  creatingLink = false;
  linkError: string | null = null;
  revokingLink: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private auth: AuthService,
    private router: Router,
    public lang: LanguageService,
  ) {}

  ngOnInit(): void {
    this.accountId = this.route.snapshot.paramMap.get('id') || '';
    this.loadAccountDetails();
  }

  deleteGroup() {
    if (
      !confirm(
        '¿Eliminar esta cuenta/grupo compartido? Esta acción no se puede deshacer.',
      )
    )
      return;
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) {
      alert('No autenticado');
      return;
    }
    this.auth.deleteSharedAccount(this.accountId, String(myId)).subscribe({
      next: () => {
        this.router.navigate(['/home']);
      },
      error: (err: any) => {
        alert(
          'No se pudo eliminar el grupo: ' +
            (err?.error?.message || err?.message || 'Error'),
        );
        console.error('deleteGroup error', err);
      },
    });
  }

  loadAccountDetails() {
    this.loading = true;
    this.error = null;

    this.auth.getSharedAccountById(this.accountId).subscribe({
      next: (acc: any) => {
        this.account = { ...acc };
        this.originalAccount = { ...acc };
        this.groupImageSrc = acc.foto_grupo || null;
        if (!this.account.moneda) this.account.moneda = 'EUR';
        this.loadMembers();
      },
      error: (err: any) => {
        this.error = 'No se pudo cargar la información del grupo';
        this.loading = false;
      },
    });
  }

  loadMembers() {
    this.auth.getMembersForGroup(this.accountId).subscribe({
      next: (members: any[]) => {
        this.miembros = (members || []).map((m: any) => ({
          ...m,
          _id: m._id || m.id,
        }));
        const me = this.auth.getUser();
        const myId = me?._id || me?.id;
        const mine = this.miembros.find((m) => String(m._id) === String(myId));
        this.myRole = (mine?.rol as any) || 'miembro';
        this.loading = false;

        // Cargar enlaces de invitación si es admin u owner
        if (this.myRole === 'owner' || this.myRole === 'admin') {
          this.loadInvitationLinks();
        }
      },
      error: () => {
        this.miembros = [];
        this.loading = false;
      },
    });
  }

  saveChanges() {
    this.saving = true;
    this.saveMessage = null;
    this.error = null;

    const payload: any = {
      nombre: this.account.nombre,
      descripcion: this.account.descripcion,
      moneda: this.account.moneda || 'EUR',
    };

    if (this.account.foto_grupo) {
      payload.foto_grupo = this.account.foto_grupo;
    }

    this.auth.updateSharedAccount(this.accountId, payload).subscribe({
      next: (res: any) => {
        console.log('Save success, response:', res);
        this.saving = false;
        this.saveMessage = this.lang.t('changesSaved');
        this.originalAccount = { ...this.account };
        this.groupImageSrc = this.account.foto_grupo || null;
        setTimeout(() => {
          this.saveMessage = null;
        }, 3000);
      },
      error: (err: any) => {
        this.saving = false;
        console.error('Full error object:', err);
        console.error('Error status:', err.status);
        console.error('Error statusText:', err.statusText);
        console.error('Error error:', err.error);
        console.error('Error message:', err.message);
        const msg = err.error?.message || err.message || err.statusText;
        this.error = `${this.lang.t('errorSaving')}: ${msg}`;
      },
    });
  }

  cancelChanges() {
    this.account = { ...this.originalAccount };
    if (!this.account.moneda) this.account.moneda = 'EUR';
    this.saveMessage = null;
    this.error = null;
    this.groupImageSrc = this.account.foto_grupo || null;
  }

  goBack() {
    this.router.navigate(['/group', this.accountId]);
  }

  openAddFriendModal() {
    this.showAddFriendModal = true;
    this.loadAvailableFriends();
  }

  closeAddFriendModal() {
    this.showAddFriendModal = false;
    this.selectedFriendToAdd = null;
    this.addFriendError = null;
    this.addFriendSuccess = false;
    this.availableFriends = [];
  }

  loadAvailableFriends() {
    this.loadingFriends = true;
    this.addFriendError = null;
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;

    if (!myId) {
      this.addFriendError = 'No autenticado';
      this.loadingFriends = false;
      return;
    }

    this.auth.getAmigos(String(myId)).subscribe({
      next: (res: any) => {
        const friends = res?.amigos || [];
        const memberIds = this.miembros.map((m: any) => String(m._id || m.id));
        this.availableFriends = friends.filter((f: any) => {
          const fid = String(f._id || f.id);
          return !memberIds.includes(fid);
        });
        this.loadingFriends = false;
      },
      error: (err: any) => {
        this.addFriendError = 'No se pudieron cargar los amigos';
        this.loadingFriends = false;
      },
    });
  }

  selectFriendToAdd(friend: any) {
    this.selectedFriendToAdd = friend._id || friend.id;
  }

  addFriendToGroup() {
    if (!this.selectedFriendToAdd) return;

    this.addingFriend = true;
    this.addFriendError = null;

    const myId = this.myId();
    if (!myId) {
      this.addingFriend = false;
      this.addFriendError = 'No autenticado';
      return;
    }

    this.auth
      .sendGroupInvitation(this.accountId, this.selectedFriendToAdd, myId)
      .subscribe({
        next: () => {
          this.addingFriend = false;
          this.closeAddFriendModal();
          this.addFriendSuccess = true;
          setTimeout(() => {
            this.addFriendSuccess = false;
          }, 2000);
        },
        error: (err: any) => {
          this.addingFriend = false;
          this.addFriendError =
            err?.error?.message || 'No se pudo enviar la invitación';
        },
      });
  }

  private myId(): string | null {
    const me = this.auth.getUser();
    return me?._id || me?.id || null;
  }

  isOwner() {
    return this.myRole === 'owner';
  }
  isAdmin() {
    return this.myRole === 'owner' || this.myRole === 'admin';
  }

  canPromote(member: any) {
    if (!member) return false;
    return this.isOwner() && member.rol !== 'owner' && member.rol !== 'admin';
  }

  canDemote(member: any) {
    if (!member) return false;
    return this.isOwner() && member.rol === 'admin';
  }

  canRemove(member: any) {
    if (!member) return false;
    const myId = this.myId();
    const targetId = member._id || member.id;
    if (myId && String(myId) === String(targetId)) return false;
    if (member.rol === 'owner') return false;
    if (this.isOwner()) return true;
    if (this.myRole === 'admin') {
      return member.rol === 'miembro';
    }
    return false;
  }

  promoteToAdmin(member: any) {
    if (!this.canPromote(member)) return;
    const myId = this.myId();
    const targetId = member._id || member.id;
    if (!myId || !targetId) return;
    this.actionError = null;
    this.actionLoading = String(targetId) + ':promote';
    this.auth
      .updateUserGroupRole(
        this.accountId,
        String(myId),
        String(targetId),
        'admin',
      )
      .subscribe({
        next: () => {
          this.actionLoading = null;
          this.loadMembers();
        },
        error: (err) => {
          this.actionLoading = null;
          this.actionError =
            err?.error?.message || 'No se pudo actualizar el rol';
        },
      });
  }

  demoteToMember(member: any) {
    if (!this.canDemote(member)) return;
    const myId = this.myId();
    const targetId = member._id || member.id;
    if (!myId || !targetId) return;
    this.actionError = null;
    this.actionLoading = String(targetId) + ':demote';
    this.auth
      .updateUserGroupRole(
        this.accountId,
        String(myId),
        String(targetId),
        'miembro',
      )
      .subscribe({
        next: () => {
          this.actionLoading = null;
          this.loadMembers();
        },
        error: (err) => {
          this.actionLoading = null;
          this.actionError =
            err?.error?.message || 'No se pudo actualizar el rol';
        },
      });
  }

  removeMember(member: any) {
    if (!this.canRemove(member)) return;
    const myId = this.myId();
    const targetId = member._id || member.id;
    if (!myId || !targetId) return;
    this.actionError = null;
    this.actionLoading = String(targetId) + ':remove';
    this.auth
      .removeUserFromGroup(this.accountId, String(myId), String(targetId))
      .subscribe({
        next: () => {
          this.actionLoading = null;
          this.loadMembers();
        },
        error: (err) => {
          this.actionLoading = null;
          this.actionError =
            err?.error?.message || 'No se pudo eliminar el miembro';
        },
      });
  }

  copyGroupId() {
    const groupId = this.account?._id || this.account?.id;
    if (!groupId) return;

    navigator.clipboard
      .writeText(groupId)
      .then(() => {
        this.saveMessage = this.lang.t('copied') || 'ID copiado';
        setTimeout(() => {
          this.saveMessage = null;
        }, 2000);
      })
      .catch(() => {
        this.error = 'No se pudo copiar el ID';
        setTimeout(() => {
          this.error = null;
        }, 2000);
      });
  }

  onGroupImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const img = new Image();
      img.onload = () => {
        const resized = this.downscaleImage(img, 256);
        this.groupImageSrc = resized;
        this.account.foto_grupo = resized;
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  private downscaleImage(img: HTMLImageElement, maxSize: number): string {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxSize) {
        height = (height * maxSize) / width;
        width = maxSize;
      }
    } else {
      if (height > maxSize) {
        width = (width * maxSize) / height;
        height = maxSize;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  // Invitation Links Methods
  loadInvitationLinks() {
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) return;

    this.loadingLinks = true;
    this.auth.getGroupInvitationLinks(this.accountId, String(myId)).subscribe({
      next: (links: any[]) => {
        this.invitationLinks = links || [];
        this.loadingLinks = false;
      },
      error: (err: any) => {
        console.error('Error loading invitation links:', err);
        this.invitationLinks = [];
        this.loadingLinks = false;
      },
    });
  }

  toggleCreateLinkForm() {
    this.showCreateLinkForm = !this.showCreateLinkForm;
    if (!this.showCreateLinkForm) {
      this.newLinkMaxUses = null;
      this.newLinkExpirationDays = null;
      this.linkError = null;
    }
  }

  createInvitationLink() {
    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) {
      this.linkError = 'No autenticado';
      return;
    }

    this.creatingLink = true;
    this.linkError = null;

    // Convertir valores vacíos a null/undefined correctamente
    const maxUses =
      this.newLinkMaxUses && Number(this.newLinkMaxUses) > 0
        ? Number(this.newLinkMaxUses)
        : undefined;
    const expirationDays =
      this.newLinkExpirationDays && Number(this.newLinkExpirationDays) > 0
        ? Number(this.newLinkExpirationDays)
        : undefined;

    this.auth
      .createInvitationLink(
        this.accountId,
        String(myId),
        maxUses,
        expirationDays,
      )
      .subscribe({
        next: (response: any) => {
          this.creatingLink = false;
          this.showCreateLinkForm = false;
          this.newLinkMaxUses = null;
          this.newLinkExpirationDays = null;
          this.loadInvitationLinks();

          // Copiar enlace automáticamente
          if (response.enlace) {
            navigator.clipboard.writeText(response.enlace);
            alert(
              'Enlace creado y copiado al portapapeles: ' + response.enlace,
            );
          }
        },
        error: (err: any) => {
          console.error('Error creating invitation link:', err);
          this.linkError =
            err?.error?.message ||
            err?.error?.details ||
            'Error al crear el enlace';
          this.creatingLink = false;
        },
      });
  }

  getLinkUrl(token: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/join-group/${token}`;
  }

  copyLink(token: string) {
    const url = this.getLinkUrl(token);
    navigator.clipboard
      .writeText(url)
      .then(() => {
        alert('Enlace copiado al portapapeles');
      })
      .catch((err) => {
        console.error('Error copying link:', err);
      });
  }

  revokeLink(link: any) {
    if (
      !confirm(
        '¿Revocar este enlace de invitación? Los usuarios ya no podrán unirse con este enlace.',
      )
    ) {
      return;
    }

    const me = this.auth.getUser();
    const myId = me?._id || me?.id;
    if (!myId) return;

    this.revokingLink = link._id;
    this.auth.revokeInvitationLink(link._id, String(myId)).subscribe({
      next: () => {
        this.revokingLink = null;
        this.loadInvitationLinks();
      },
      error: (err: any) => {
        console.error('Error revoking link:', err);
        alert(
          'Error al revocar el enlace: ' +
            (err?.error?.message || 'Error desconocido'),
        );
        this.revokingLink = null;
      },
    });
  }
}
