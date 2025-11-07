import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GastosService } from '../gastos.service';
import { GastoFormComponent } from '../gasto-form/gasto-form.component';

@Component({
  selector: 'app-gastos-list',
  standalone: true,
  imports: [CommonModule, RouterLink, GastoFormComponent],
  template: `
    <section style="max-width:900px; width:100%">
      <h2>Gastos del grupo</h2>
      <app-gasto-form [groupId]="groupId" (created)="load()"></app-gasto-form>
      <ul>
        <li *ngFor="let g of gastos">
          <strong>{{ g.descripcion }}</strong> — {{ g.monto }} {{ g.categoria }} — {{ g.id_pagador }}
        </li>
      </ul>
    </section>
  `,
})
export class GastosListComponent implements OnInit {
  groupId = '';
  gastos: any[] = [];
  constructor(private route: ActivatedRoute, private svc: GastosService) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    this.load();
  }

  load() {
    if (!this.groupId) return;
    this.svc.getByGroup(this.groupId).subscribe((arr) => (this.gastos = arr || []));
  }
}
