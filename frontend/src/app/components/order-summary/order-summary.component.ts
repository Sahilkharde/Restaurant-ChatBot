import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-order-summary',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="summary-wrap" [style.--brand]="data?.restaurantColor || '#e65c00'">
      <div class="summary-banner">
        <span class="summary-tick">✓</span>
        <div class="summary-title">{{ data?.type === 'booking' ? 'Table Booked!' : 'Order Confirmed!' }}</div>
        <div class="summary-id">ID: {{ data?.id }}</div>
      </div>

      <div class="summary-body">
        <div class="summary-rest">🍽️ {{ data?.restaurantName }}</div>

        <!-- Order details -->
        <ng-container *ngIf="data?.type === 'order'">
          <div *ngFor="let item of data.items" class="summary-item">
            <span>{{ item.emoji }} {{ item.name }} × {{ item.qty }}</span>
            <span>\${{ (item.price * item.qty).toFixed(2) }}</span>
          </div>
          <div class="summary-total">
            <span>Total</span>
            <span>\${{ data.total }}</span>
          </div>
        </ng-container>

        <!-- Booking details -->
        <ng-container *ngIf="data?.type === 'booking'">
          <div class="booking-detail">📅 {{ formatDate(data.date) }}</div>
          <div class="booking-detail">🕐 {{ data.time }}</div>
          <div class="booking-detail">👥 Party of {{ data.partySize }}</div>
        </ng-container>

        <div class="customer-detail" *ngIf="data?.customer?.name">
          👤 {{ data.customer.name }}
          <span *ngIf="data.customer.email"> · {{ data.customer.email }}</span>
        </div>
      </div>

      <button class="back-btn" (click)="backToMenu()">← Back to Menu</button>
    </div>
  `,
  styles: [`
    .summary-wrap {
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      margin-top: 10px;
    }
    .summary-banner {
      background: var(--brand);
      color: #fff;
      padding: 18px 16px;
      text-align: center;
    }
    .summary-tick { font-size: 2rem; display: block; }
    .summary-title { font-size: 1.15rem; font-weight: 700; margin: 4px 0 2px; }
    .summary-id { font-size: 0.8rem; opacity: 0.85; font-family: monospace; }
    .summary-body {
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .summary-rest { font-weight: 600; font-size: 0.95rem; color: #2d3748; }
    .summary-item {
      display: flex;
      justify-content: space-between;
      font-size: 0.88rem;
      color: #4a5568;
    }
    .summary-total {
      display: flex;
      justify-content: space-between;
      font-weight: 700;
      font-size: 1rem;
      color: #1a202c;
      border-top: 1px solid #e2e8f0;
      padding-top: 8px;
      margin-top: 4px;
    }
    .booking-detail { font-size: 0.92rem; color: #4a5568; }
    .customer-detail { font-size: 0.82rem; color: #718096; margin-top: 6px; }
    .back-btn {
      width: 100%;
      padding: 14px;
      background: var(--brand);
      color: #fff;
      border: none;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.95rem;
      transition: opacity 0.2s;
    }
    .back-btn:hover { opacity: 0.9; }
  `]
})
export class OrderSummaryComponent {
  @Input() data: any = {};
  @Output() backToMenuClicked = new EventEmitter<void>();
  backToMenu() { this.backToMenuClicked.emit(); }
  formatDate(d: string) {
    if (!d) return '';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}
