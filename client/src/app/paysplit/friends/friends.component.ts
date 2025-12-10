import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
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
  ],
  template: `
    <div class="friends-container">
      <h1>{{ lang.t('friends') }}</h1>
      
      <!-- Friend Requests Section -->
      <div class="section" *ngIf="peticiones && peticiones.length > 0">
        <h2>{{ lang.t('requests') }} ({{ peticiones.length }})</h2>
        <div class="request-list">
          <div *ngFor="let request of peticiones" class="request-item">
            <div class="request-info">
              <span>{{ request?.nombre || request?.username || request?.email }}</span>
            </div>
            <div class="request-actions">
              <button mat-icon-button color="primary" (click)="acceptRequest(request)" [disabled]="request.processing" title="Accept">
                <mat-icon>check</mat-icon>
              </button>
              <button mat-icon-button (click)="rejectRequest(request)" [disabled]="request.processing" title="Reject">
                <mat-icon>close</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Friends List Section -->
      <div class="section">
        <h2>{{ lang.t('friends') }}</h2>
        <div *ngIf="friends && friends.length > 0; else noFriends" class="friends-list">
          <div *ngFor="let friend of friends" class="friend-item">
            <mat-icon>account_circle</mat-icon>
            <span>{{ friend?.nombre || friend?.name || friend?.username || friend?.email }}</span>
          </div>
        </div>
        <ng-template #noFriends>
          <p class="no-data">{{ lang.t('noMembers') }}</p>
        </ng-template>
      </div>

      <!-- Add Friend Section -->
      <div class="section add-friend-section">
        <h2>{{ lang.t('addFriend') }}</h2>
        <div *ngIf="!addFriendSuccess; else addSuccess" class="add-friend-form">
          <mat-form-field appearance="fill">
            <mat-label>{{ lang.t('name') }}</mat-label>
            <input matInput placeholder="username" [(ngModel)]="addFriendUsername" />
          </mat-form-field>
          <div *ngIf="addFriendError" class="error-message">{{ addFriendError }}</div>
          <div class="button-group">
            <button mat-stroked-button (click)="resetAddFriend()" [disabled]="addFriendLoading">
              {{ lang.t('cancel') }}
            </button>
            <button mat-flat-button color="primary" (click)="onAddFriend()" [disabled]="addFriendLoading || !addFriendUsername || !addFriendUsername.trim()">
              {{ addFriendLoading ? lang.t('loading') : lang.t('add') }}
            </button>
          </div>
        </div>
        <ng-template #addSuccess>
          <div class="success-message">
            <mat-icon>check_circle</mat-icon>
            <span>{{ lang.t('friendRequestSent') }}</span>
            <button mat-button (click)="resetAddFriend()">{{ lang.t('addAnother') || 'Add Another' }}</button>
          </div>
        </ng-template>
      </div>
    </div>
  `,
  styles: [`
    .friends-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    h1 {
      color: var(--text-main);
      margin-bottom: 2rem;
    }

    .section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: var(--secondary-bg);
      border-radius: 8px;
    }

    h2 {
      color: var(--text-main);
      margin-bottom: 1rem;
      font-size: 1.1rem;
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

    .add-friend-section {
      background: linear-gradient(180deg, rgba(122, 229, 130, 0.08) 0%, transparent 100%);
    }

    .add-friend-form {
      display: flex;
      flex-direction: column;
      gap: 1rem;
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
  `],
})
export class FriendsComponent implements OnInit {
  friends: any[] = [];
  peticiones: any[] = [];
  addFriendUsername = '';
  addFriendLoading = false;
  addFriendError = '';
  addFriendSuccess = false;

  constructor(
    public lang: LanguageService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadFriends();
    this.loadRequests();
  }

  loadFriends() {
    const user = this.authService.getUser();
    if (user?.friends) {
      this.friends = Array.isArray(user.friends) ? user.friends : [];
    }
  }

  loadRequests() {
    const user = this.authService.getUser();
    if (user?.peticiones) {
      this.peticiones = Array.isArray(user.peticiones) ? user.peticiones : [];
    }
  }

  acceptRequest(request: any) {
    request.processing = true;
    // TODO: Implement API call to accept request
    setTimeout(() => {
      request.processing = false;
      this.peticiones = this.peticiones.filter(p => p !== request);
      this.friends.push(request);
    }, 500);
  }

  rejectRequest(request: any) {
    request.processing = true;
    // TODO: Implement API call to reject request
    setTimeout(() => {
      request.processing = false;
      this.peticiones = this.peticiones.filter(p => p !== request);
    }, 500);
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
