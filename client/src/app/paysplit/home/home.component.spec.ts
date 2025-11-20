import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HomeComponent } from './home.component';
import { AuthService } from '../../auth/auth.service';
import { of } from 'rxjs';

class MockAuthService {
  isLoggedIn() { return true; }
  getUser() { return { _id: 'u1', nombre: 'Test' }; }
  getGroupsForUser(userId: string) { return of([{ _id: 'g1', nombre: 'G1' }]); }
}

describe('HomeComponent', () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [HomeComponent],
      providers: [ { provide: AuthService, useClass: MockAuthService } ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
  }));

  it('should create and load groups on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.sharedAccounts.length).toBeGreaterThan(0);
    expect(component.sharedAccounts[0].nombre).toBe('G1');
  });
});
