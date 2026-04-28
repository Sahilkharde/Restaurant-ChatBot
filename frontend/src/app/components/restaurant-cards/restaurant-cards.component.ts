import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restaurant-cards',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rest-grid">
      <button
        *ngFor="let r of restaurants"
        class="rest-card"
        (click)="select(r.id)"
        [style.--brand]="r.color"
      >
        <div class="rest-banner" [style.background]="r.color">
          <span class="rest-emoji">{{ r.emoji }}</span>
        </div>
        <div class="rest-body">
          <div class="rest-name">{{ r.name }}</div>
          <div class="rest-cuisine">{{ r.cuisine }}</div>
          <div class="rest-footer">
            <span class="rest-city">📍 {{ r.city }}</span>
            <span class="rest-rating">⭐ {{ r.rating }}</span>
          </div>
        </div>
      </button>
    </div>
  `,
  styles: [`
    .rest-grid {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-top: 10px;
      width: 100%;
    }
    .rest-card {
      display: flex;
      align-items: center;
      gap: 0;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      background: #fff;
      cursor: pointer;
      text-align: left;
      font-family: inherit;
      transition: all 0.2s;
      padding: 0;
    }
    .rest-card:hover {
      border-color: var(--brand);
      box-shadow: 0 4px 16px rgba(0,0,0,0.12);
      transform: translateY(-1px);
    }
    .rest-banner {
      width: 60px;
      min-height: 80px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .rest-emoji { font-size: 1.8rem; }
    .rest-body {
      padding: 10px 14px;
      flex: 1;
    }
    .rest-name { font-weight: 700; font-size: 0.95rem; color: #1a202c; }
    .rest-cuisine { font-size: 0.8rem; color: #718096; margin: 2px 0 6px; }
    .rest-footer { display: flex; justify-content: space-between; }
    .rest-city, .rest-rating { font-size: 0.75rem; color: #4a5568; }
  `]
})
export class RestaurantCardsComponent {
  @Input() restaurants: any[] = [];
  @Output() selected = new EventEmitter<string>();
  select(id: string) { this.selected.emit(id); }
}
