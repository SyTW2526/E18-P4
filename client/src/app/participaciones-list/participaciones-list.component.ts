import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ParticipacionService } from '../participacion.service';
import { ParticipacionFormComponent } from '../participacion-form/participacion-form.component';

@Component({
  selector: 'app-participaciones-list',
  standalone: true,
  imports: [CommonModule, ParticipacionFormComponent],
  template: `
    <section style="max-width:900px; width:100%">
      <h2>Participaciones</h2>
      <app-participacion-form [groupId]="groupId" (created)="load()"></app-participacion-form>
      <ul>
        <li *ngFor="let p of parts">Usuario: {{ p.id_usuario }} — {{ p.monto_asignado }}</li>
      </ul>
    </section>
  `,
})
export class ParticipacionesListComponent implements OnInit {
  groupId = '';
  parts: any[] = [];
  constructor(private route: ActivatedRoute, private svc: ParticipacionService) {}

  ngOnInit(): void {
    this.groupId = this.route.snapshot.paramMap.get('id') || '';
    this.load();
  }

  load() {
    if (!this.groupId) return;
    // participaciones are fetched by gasto; here we just list all participaciones and filter by group via gasto ids is more complex.
    // For now call list() and display all — future: improve to fetch by gastos of group.
    this.svc.list().subscribe((arr) => (this.parts = arr || []));
  }
}
