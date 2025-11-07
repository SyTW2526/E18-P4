import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { UserGroupService } from '../user-group.service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-members-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <section style="max-width:900px; width:100%">
      <h2>Miembros del grupo</h2>
      <form [formGroup]="form" (ngSubmit)="add()" style="display:flex;gap:0.5rem;align-items:end">
        <mat-form-field><input matInput placeholder="Usuario id" formControlName="id_usuario" /></mat-form-field>
        <mat-form-field><input matInput placeholder="Rol (admin|miembro)" formControlName="rol" /></mat-form-field>
        <button mat-raised-button color="primary" type="submit" [disabled]="form.invalid">Agregar</button>
      </form>
      <ul>
        <li *ngFor="let m of members">{{ m.id_usuario }} — {{ m.rol }}</li>
      </ul>
    </section>
  `,
})
export class MembersListComponent implements OnInit {
  groupId = '';
  members: any[] = [];
  form = this.fb.group({ id_usuario: ['', Validators.required], rol: ['miembro', Validators.required] });

  constructor(private route: ActivatedRoute, private svc: UserGroupService, private fb: FormBuilder) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    this.load();
  }

  load() {
    if (!this.groupId) return;
    this.svc.listMembersByGroup(this.groupId).subscribe((arr) => (this.members = arr || []));
  }

  add() {
    if (!this.groupId) return;
    const payload = { id_usuario: this.form.value.id_usuario, id_grupo: this.groupId, rol: this.form.value.rol, fecha_union: new Date().toISOString() };
    this.svc.addMember(payload as any).subscribe({ next: () => { this.form.reset({rol:'miembro'}); this.load(); }, error: (e) => console.error(e) });
  }
}
