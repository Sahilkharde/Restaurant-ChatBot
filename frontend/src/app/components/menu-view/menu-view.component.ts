import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-view',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="menu-wrap">
      <!-- Category tabs -->
      <div class="cat-tabs">
        <button
          *ngFor="let cat of categories"
          class="cat-tab"
          [class.active]="cat === activeCategory"
          (click)="activeCategory = cat"
        >{{ cat }}</button>
      </div>

      <!-- Items grid -->
      <div class="items-grid">
        <div *ngFor="let item of currentItems" class="item-card">
          <div class="item-emoji">{{ item.emoji }}</div>
          <div class="item-info">
            <div class="item-name">{{ item.name }}</div>
            <div class="item-desc">{{ item.description }}</div>
            <div class="item-price">\${{ item.price.toFixed(2) }}</div>
          </div>
          <button *ngIf="ordering" class="add-btn" (click)="addToCart(item)">+ Add</button>
        </div>
      </div>

      <div class="menu-footer">
        <button *ngIf="ordering && cartCount > 0" class="view-cart-btn" (click)="viewCart()">
          🛒 View Cart ({{ cartCount }} items)
        </button>
        <button class="back-btn" (click)="back()">← Back to Menu</button>
      </div>
    </div>
  `,
  styles: [`
    .menu-wrap { margin-top: 10px; }
    .cat-tabs {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 12px;
    }
    .cat-tab {
      padding: 6px 16px;
      border: 2px solid #e2e8f0;
      border-radius: 20px;
      background: #fff;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      color: #4a5568;
      transition: all 0.2s;
    }
    .cat-tab.active, .cat-tab:hover {
      border-color: #e65c00;
      color: #e65c00;
      background: #fff5ee;
    }
    .items-grid {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 300px;
      overflow-y: auto;
    }
    .item-card {
      display: flex;
      align-items: center;
      gap: 10px;
      background: #fff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 12px;
    }
    .item-emoji { font-size: 1.6rem; flex-shrink: 0; }
    .item-info { flex: 1; }
    .item-name { font-weight: 600; font-size: 0.9rem; color: #1a202c; }
    .item-desc { font-size: 0.75rem; color: #718096; margin: 2px 0 4px; }
    .item-price { font-weight: 700; color: #e65c00; font-size: 0.9rem; }
    .add-btn {
      padding: 6px 14px;
      background: #e65c00;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.85rem;
      cursor: pointer;
      font-family: inherit;
      white-space: nowrap;
      transition: background 0.2s;
    }
    .add-btn:hover { background: #cf4f00; }
    .menu-footer {
      display: flex;
      gap: 8px;
      margin-top: 12px;
      flex-wrap: wrap;
    }
    .view-cart-btn {
      flex: 1;
      padding: 10px;
      background: #1a202c;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s;
    }
    .view-cart-btn:hover { background: #2d3748; }
    .back-btn {
      padding: 10px 16px;
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
export class MenuViewComponent implements OnChanges {
  @Input() data: any = {};
  @Input() ordering = false;
  @Input() cartCount = 0;
  @Output() itemAdded = new EventEmitter<any>();
  @Output() viewCartClicked = new EventEmitter<void>();
  @Output() backClicked = new EventEmitter<void>();

  categories: string[] = [];
  activeCategory = '';

  get currentItems(): any[] {
    if (!this.data?.items || !this.activeCategory) return [];
    return this.data.items[this.activeCategory] || [];
  }

  ngOnChanges() {
    if (this.data?.categories?.length) {
      this.categories = this.data.categories;
      if (!this.categories.includes(this.activeCategory)) {
        this.activeCategory = this.categories[0];
      }
    }
    this.ordering = this.data?.ordering ?? false;
  }

  addToCart(item: any) { this.itemAdded.emit(item); }
  viewCart() { this.viewCartClicked.emit(); }
  back() { this.backClicked.emit(); }
}
