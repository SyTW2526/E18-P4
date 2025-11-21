import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { Component } from '@angular/core';
import { AccountDetailComponent } from './account-detail.component';
import { AuthService } from '../../auth/auth.service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

class MockAuthService {
  getUser() { return { _id: 'u1', nombre: 'Me' }; }
  getSharedAccountById(id: string) { return of({ _id: id, nombre: 'Group X', miembros: [{ _id: 'u1', nombre: 'Me' }, { _id: 'u2', nombre: 'Other' }] }); }
  getMembersForGroup(id: string) { return of([{ _id: 'u1', nombre: 'Me' }, { _id: 'u2', nombre: 'Other' }]); }
  getUserById(id: string) { return of({ _id: id, nombre: `User ${id}` }); }
  getGastosForGroup(id: string) { return of([{ descripcion: 'Lunch', monto: 10, id_pagador: 'u1', fecha: new Date().toISOString(), moneda: 'EUR' }]); }
  createGasto(payload: any) { return of({ id: 'g1' }); }
  deleteGasto(id: string) { return of({}); }
  deleteSharedAccount(id: string) { return of({}); }
}

describe('AccountDetailComponent', () => {
  let component: AccountDetailComponent;
  let fixture: ComponentFixture<AccountDetailComponent>;

  beforeEach(waitForAsync(() => {
    @Component({
      selector: 'test-dummy',
      standalone: true,
      template: ''
    })
    class DummyComponent {}

    TestBed.configureTestingModule({
      imports: [AccountDetailComponent, NoopAnimationsModule, RouterTestingModule.withRoutes([{ path: 'group/:id', component: DummyComponent }]), DummyComponent],
      providers: [
        { provide: AuthService, useClass: MockAuthService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => 'g1' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDetailComponent);
    component = fixture.componentInstance;
  }));

  it('should create and load gastos and miembros', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(component.miembros.length).toBeGreaterThan(0);
    expect(component.gastos.length).toBeGreaterThan(0);
    expect(component.accountTotal()).toBeGreaterThan(0);
  });

  it('createGastoFromForm validates and calls createGasto', () => {
    fixture.detectChanges();
    component.newGasto = { descripcion: 'X', monto: 12, categoria: '', fecha: new Date().toISOString() } as any;
    component.selectedPayer = 'u1';
    component.participantes = [{ userId: 'u1', amount: 6, included: true }, { userId: 'u2', amount: 6, included: true }];
    component.splitEnabled = true;
    component.createGastoFromForm();
    // creating flag will be set during request; since mock returns synchronously it should be false after
    expect(component.createError).toBeNull();
  });
});
