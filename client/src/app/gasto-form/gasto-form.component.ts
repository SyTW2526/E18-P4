import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { GastosService } from '../gastos.service';

@Component({
  selector: 'app-gasto-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" style="display:flex;gap:0.5rem;align-items:end">
      <mat-form-field><input matInput placeholder="Descripción" formControlName="descripcion" /></mat-form-field>
      <mat-form-field><input matInput placeholder="Monto" type="number" formControlName="monto" /></mat-form-field>
      <mat-form-field><input matInput placeholder="Categoría" formControlName="categoria" /></mat-form-field>
      <mat-form-field><input matInput placeholder="Pagador (id)" formControlName="id_pagador" /></mat-form-field>
      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Crear</button>
    </form>
  `,
})
export class GastoFormComponent {
  @Input() groupId = '';
  @Output() created = new EventEmitter<void>();

  form = this.fb.group({
    descripcion: ['', [Validators.required]],
    monto: [0, [Validators.required]],
    categoria: ['varios'],
    id_pagador: [''],
    fecha: [new Date().toISOString()],
  });

  constructor(private fb: FormBuilder, private svc: GastosService) {}

  submit() {
    if (!this.groupId) return;
    const payload: any = { ...this.form.value, id_grupo: this.groupId };
    this.svc.create(payload).subscribe({ next: () => this.created.emit(), error: (e) => console.error(e) });
  }
}
