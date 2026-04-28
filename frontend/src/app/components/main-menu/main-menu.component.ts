import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

const ACTIONS = [
  { id: 'view_menu', label: 'View Menu', emoji: '📋', description: 'Browse all dishes & drinks' },
  { id: 'order_food', label: 'Order Food', emoji: '🛒', description: 'Add items to cart & checkout' },
  { id: 'book_table', label: 'Book a Table', emoji: '🪑', description: 'Reserve your spot' },
];

@Component({
  selector: 'app-main-menu',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mm-grid">
      <button *ngFor="let a of actions" class="mm-card" (click)="select(a.id)">
        <span class="mm-emoji">{{ a.emoji }}</span>
        <span class="mm-label">{{ a.label }}</span>
        <span class="mm-desc">{{ a.description }}</span>
      </button>
    </div>
  `,
  styles: [`
    .mm-grid {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    .mm-card {
      flex: 1;
      min-width: 100px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 16px 10px;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      background: #fff;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .mm-card:hover {
      border-color: #e65c00;
      box-shadow: 0 4px 16px rgba(230,92,0,0.15);
      transform: translateY(-2px);
    }
    .mm-emoji { font-size: 1.8rem; }
    .mm-label { font-weight: 700; font-size: 0.9rem; color: #1a202c; }
    .mm-desc { font-size: 0.73rem; color: #718096; text-align: center; }
  `]
})
export class MainMenuComponent {
  @Output() selected = new EventEmitter<string>();
  actions = ACTIONS;
  select(id: string) { this.selected.emit(id); }
}
