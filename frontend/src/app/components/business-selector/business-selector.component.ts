import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

const BUSINESSES = [
  { id: 'restaurant', label: 'Restaurant', emoji: '🍽️', description: 'Dine in or order food', available: true },
  { id: 'salon', label: 'Salon', emoji: '💈', description: 'Book beauty services', available: false },
  { id: 'grocery', label: 'Grocery', emoji: '🛒', description: 'Order groceries online', available: false },
];

@Component({
  selector: 'app-business-selector',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="biz-grid">
      <button
        *ngFor="let b of businesses"
        class="biz-card"
        [class.available]="b.available"
        [class.coming-soon]="!b.available"
        (click)="b.available && select(b.id)"
        [attr.disabled]="b.available ? null : true"
      >
        <span class="biz-emoji">{{ b.emoji }}</span>
        <span class="biz-label">{{ b.label }}</span>
        <span class="biz-desc">{{ b.description }}</span>
        <span *ngIf="!b.available" class="biz-soon">Coming Soon</span>
      </button>
    </div>
  `,
  styles: [`
    .biz-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 10px;
    }
    .biz-card {
      flex: 1;
      min-width: 90px;
      max-width: 130px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 14px 10px;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      background: #fff;
      cursor: pointer;
      transition: all 0.2s;
      font-family: inherit;
    }
    .biz-card.available:hover {
      border-color: #e65c00;
      box-shadow: 0 4px 16px rgba(230,92,0,0.15);
      transform: translateY(-2px);
    }
    .biz-card.coming-soon {
      opacity: 0.5;
      cursor: not-allowed;
    }
    .biz-emoji { font-size: 2rem; }
    .biz-label { font-weight: 700; font-size: 0.95rem; color: #1a202c; }
    .biz-desc { font-size: 0.75rem; color: #718096; text-align: center; }
    .biz-soon { font-size: 0.7rem; color: #a0aec0; background: #edf2f7; padding: 2px 8px; border-radius: 20px; }
  `]
})
export class BusinessSelectorComponent {
  @Output() selected = new EventEmitter<string>();
  businesses = BUSINESSES;
  select(id: string) { this.selected.emit(id); }
}
