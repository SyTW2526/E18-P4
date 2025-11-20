import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { BalanceComponent } from './balance.component';
import { AuthService } from '../../auth/auth.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

class MockAuthService {
  getUser() { return { _id: 'u1', nombre: 'Me' }; }
  getMembersForGroup(id: string) { return of([{ _id: 'u1', nombre: 'Me' }, { _id: 'u2', nombre: 'Other' }]); }
  getBalancesForGroup(id: string) { return of([{ userId: 'u1', paid: 10, share: 5, balance: 5 }]); }
}

describe('BalanceComponent', () => {
  let component: BalanceComponent;
  let fixture: ComponentFixture<BalanceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [BalanceComponent, NoopAnimationsModule, RouterTestingModule],
      providers: [ { provide: AuthService, useClass: MockAuthService }, { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'g1' } } } } ]
    }).compileComponents();

    fixture = TestBed.createComponent(BalanceComponent);
    component = fixture.componentInstance;
  }));

  it('should create and load balances', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.balances.length).toBeGreaterThan(0);
    expect(component.abs(-5)).toBe(5);
  });
});
