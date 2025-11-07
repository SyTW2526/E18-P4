import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

// Importaciones de Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

// Definimos interfaces rápidas (idealmente irían en sus propios archivos)
export interface Participant {
  id: number;
  name: string;
}
export interface BillItem {
  id: number;
  name: string;
  price: number;
  participants: number[]; // IDs de participantes
}

@Component({
  selector: 'app-main',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatListModule,
    MatTableModule,
    MatChipsModule,
    MatIconModule,
    MatSlideToggleModule
  ],
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  participants: Participant[] = [];
  items: BillItem[] = [];
  
  participantForm = this.fb.group({ name: [''] });
  itemForm = this.fb.group({ name: [''], price: [0] });

  // Columnas para la tabla de ítems
  displayedColumns: string[] = ['name', 'price', 'participants', 'actions'];

  constructor(private fb: FormBuilder) {}

  addParticipant() {
    const name = this.participantForm.value.name;
    if (name) {
      this.participants.push({ id: Date.now(), name: name });
      this.participantForm.reset();
    }
  }

  addItem() {
    const { name, price } = this.itemForm.value;
    if (name && price && price > 0) {
      this.items.push({ 
        id: Date.now(), 
        name: name, 
        price: price, 
        participants: [] 
      });
      this.itemForm.reset();
    }
  }

  toggleParticipantForItem(item: BillItem, participantId: number) {
    const index = item.participants.indexOf(participantId);
    if (index > -1) {
      item.participants.splice(index, 1);
    } else {
      item.participants.push(participantId);
    }
  }

  isParticipantOnItem(item: BillItem, participantId: number): boolean {
    return item.participants.includes(participantId);
  }

 
  calculateTotals() {
    
    console.log("Calculando totales...");
  }
}