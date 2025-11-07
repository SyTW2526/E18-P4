import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { ParticipacionService } from '../participacion.service';

@Component({
  selector: 'app-participacion-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="submit()" style="display:flex;gap:0.5rem;align-items:end">
      <mat-form-field><input matInput placeholder="Usuario id" formControlName="id_usuario" /></mat-form-field>
      <mat-form-field><input matInput placeholder="Gasto id" formControlName="id_gasto" /></mat-form-field>
      <mat-form-field><input matInput placeholder="Monto asignado" type="number" formControlName="monto_asignado" /></mat-form-field>
      <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Crear</button>
    </form>
  `,
})
export class ParticipacionFormComponent {
  @Input() groupId = '';
  @Output() created = new EventEmitter<void>();

  form = this.fb.group({
    id_usuario: ['', [Validators.required]],
    id_gasto: ['', [Validators.required]],
    monto_asignado: [0, [Validators.required]],
  });

  constructor(private fb: FormBuilder, private svc: ParticipacionService) {}

  submit() {
  const payload = { ...this.form.value };
  this.svc.create(payload as any).subscribe({ next: () => this.created.emit(), error: (e) => console.error(e) });
  }
}
