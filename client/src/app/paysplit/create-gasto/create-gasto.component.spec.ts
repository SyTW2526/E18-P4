import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { CreateGastoComponent } from './create-gasto.component';
import { AuthService } from '../../auth/auth.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

class MockAuthService {
  getUser() { return { _id: 'u1', nombre: 'Me' }; }
  getMembersForGroup(id: string) { return of([{ _id: 'u1', nombre: 'Me' }, { _id: 'u2', nombre: 'Other' }]); }
  getUserById(id: string) { return of({ _id: id, nombre: `User ${id}` }); }
  createGasto(payload: any) { return of({ id: 'g1' }); }
  createParticipacion(body: any) { return of({}); }
  updateGasto(id: string, payload: any) { return of({}); }
}

describe('CreateGastoComponent', () => {
  let component: CreateGastoComponent;
  let fixture: ComponentFixture<CreateGastoComponent>;

  beforeEach(waitForAsync(() => {
    @Component({
      selector: 'test-dummy',
      standalone: true,
      template: ''
    })
    class DummyComponent {}

    TestBed.configureTestingModule({
      imports: [CreateGastoComponent, NoopAnimationsModule, RouterTestingModule.withRoutes([{ path: 'group/:id', component: DummyComponent }]), DummyComponent],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (k: string) => (k === 'id' ? 'g1' : null) } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateGastoComponent);
    component = fixture.componentInstance;
  }));

  it('should create and recalc split correctly', () => {
    fixture.detectChanges();
    component.monto = 100;
    component.participaciones = [{ user: { _id: 'u1' }, selected: true, monto_asignado: 0 }, { user: { _id: 'u2' }, selected: true, monto_asignado: 0 } as any];
    component.recalcSplit();
    expect(component.participaciones[0].monto_asignado).toBeCloseTo(50);
  });

  it('createGasto requires fields and calls auth', () => {
    fixture.detectChanges();
    component.descripcion = 'Test';
    component.monto = 20;
    component.pagador = 'u1';
    component.participaciones = [{ user: { _id: 'u1' }, selected: true, monto_asignado: 20 } as any];
    component.createGasto();
    expect(component.creating).toBeFalsy();
  });
});
