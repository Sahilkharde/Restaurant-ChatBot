import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartItem } from '../../services/chat.service';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="cart-wrap">
      <div class="cart-header">🛒 Your Cart — {{ data.restaurantName }}</div>
      <div class="cart-items">
        <div *ngFor="let item of data.cart" class="cart-item">
          <span class="ci-emoji">{{ item.emoji }}</span>
          <span class="ci-name">{{ item.name }}</span>
          <div class="ci-qty">
            <button (click)="adjustQty(item, -1)">−</button>
            <span>{{ item.qty }}</span>
            <button (click)="adjustQty(item, 1)">+</button>
          </div>
          <span class="ci-price">\${{ (item.price * item.qty).toFixed(2) }}</span>
        </div>
      </div>
      <div class="cart-total">
        <span>Total</span>
        <span class="total-amount">\${{ data.total }}</span>
      </div>
      <div class="cart-actions">
        <button class="confirm-btn" (click)="confirm()">Place Order →</button>
        <button class="back-btn" (click)="back()">← Keep Shopping</button>
      </div>
    </div>
  `,
  styles: [`
    .cart-wrap {
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      overflow: hidden;
      margin-top: 10px;
    }
    .cart-header {
      background: #1a202c;
      color: #fff;
      padding: 12px 16px;
      font-weight: 700;
      font-size: 0.95rem;
    }
    .cart-items {
      max-height: 240px;
      overflow-y: auto;
    }
    .cart-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-bottom: 1px solid #f7fafc;
    }
    .ci-emoji { font-size: 1.3rem; }
    .ci-name { flex: 1; font-size: 0.88rem; color: #2d3748; font-weight: 500; }
    .ci-qty {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ci-qty button {
      width: 26px; height: 26px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #f7fafc;
      cursor: pointer;
      font-size: 1rem;
      font-weight: 700;
      line-height: 1;
      transition: background 0.15s;
    }
    .ci-qty button:hover { background: #e2e8f0; }
    .ci-qty span { font-weight: 700; min-width: 18px; text-align: center; }
    .ci-price { font-weight: 700; color: #e65c00; font-size: 0.9rem; min-width: 55px; text-align: right; }
    .cart-total {
      display: flex;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 2px solid #edf2f7;
      font-weight: 600;
      font-size: 1rem;
    }
    .total-amount { color: #e65c00; font-size: 1.1rem; font-weight: 700; }
    .cart-actions {
      display: flex;
      gap: 8px;
      padding: 12px 16px;
      background: #f7fafc;
    }
    .confirm-btn {
      flex: 1;
      padding: 12px;
      background: #e65c00;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.95rem;
      transition: background 0.2s;
    }
    .confirm-btn:hover { background: #cf4f00; }
    .back-btn {
      padding: 12px 16px;
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-weight: 600;
      color: #4a5568;
      cursor: pointer;
      font-family: inherit;
      transition: all 0.2s;
    }
    .back-btn:hover { border-color: #718096; }
  `]
})
export class CartDrawerComponent {
  @Input() data: { cart: CartItem[]; total: string; restaurantName: string } = { cart: [], total: '0.00', restaurantName: '' };
  @Output() qtyChanged = new EventEmitter<{ item: CartItem; delta: number }>();
  @Output() confirmed = new EventEmitter<void>();
  @Output() backClicked = new EventEmitter<void>();

  adjustQty(item: CartItem, delta: number) { this.qtyChanged.emit({ item, delta }); }
  confirm() { this.confirmed.emit(); }
  back() { this.backClicked.emit(); }
}
