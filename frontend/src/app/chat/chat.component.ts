import {
  Component,
  ViewChild,
  ElementRef,
  AfterViewInit,
  ChangeDetectorRef,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TimeoutError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';

import { ChatService, CartItem, ChatSession, UiBlock } from '../services/chat.service';
import { BusinessSelectorComponent } from '../components/business-selector/business-selector.component';
import { RestaurantCardsComponent } from '../components/restaurant-cards/restaurant-cards.component';
import { CustomerFormComponent } from '../components/customer-form/customer-form.component';
import { MainMenuComponent } from '../components/main-menu/main-menu.component';
import { MenuViewComponent } from '../components/menu-view/menu-view.component';
import { CartDrawerComponent } from '../components/cart-drawer/cart-drawer.component';
import { TableBookingComponent } from '../components/table-booking/table-booking.component';
import { OrderSummaryComponent } from '../components/order-summary/order-summary.component';

interface Message {
  sender: 'Bot' | 'You';
  text: string;
  timestamp: Date;
  uiBlock?: UiBlock | null;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BusinessSelectorComponent,
    RestaurantCardsComponent,
    CustomerFormComponent,
    MainMenuComponent,
    MenuViewComponent,
    CartDrawerComponent,
    TableBookingComponent,
    OrderSummaryComponent,
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
})
export class ChatComponent implements AfterViewInit, OnInit {
  messages: Message[] = [];
  userInput = '';
  isTyping = false;

  currentState = 'INIT';
  restaurantId: string | null = null;
  session: ChatSession = {};
  cart: CartItem[] = [];
  conversationUniqueId: string | undefined = undefined;

  @ViewChild('messageContainer') messageContainer!: ElementRef<HTMLDivElement>;

  constructor(private chatService: ChatService, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const saved = localStorage.getItem('dinebot_session');
    if (saved) {
      try {
        const s = JSON.parse(saved);
        this.messages = (s.messages || []).map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        this.currentState = s.currentState || 'INIT';
        this.restaurantId = s.restaurantId || null;
        this.session = s.session || {};
        this.cart = s.cart || [];
        this.conversationUniqueId = s.conversationUniqueId;
      } catch { /* ignore corrupt cache */ }
    }
  }

  ngAfterViewInit() {
    if (this.messages.length === 0) {
      this._sendToBackend('__reset__');
    }
    this.scrollToBottom();
  }

  // ── Public helpers ──────────────────────────────────────────────────────

  get brandColor(): string {
    return (this.session as any)['brandColor'] || '#e65c00';
  }

  get cartCount(): number {
    return this.cart.reduce((s, i) => s + i.qty, 0);
  }

  sendMessage() {
    if (this.userInput.trim()) {
      const text = this.userInput.trim();
      this.userInput = '';
      this._addUserMessage(text);
      this._sendToBackend(text);
    }
  }

  resetChat() {
    this.messages = [];
    this.currentState = 'INIT';
    this.restaurantId = null;
    this.session = {};
    this.cart = [];
    this.conversationUniqueId = undefined;
    localStorage.removeItem('dinebot_session');
    this._sendToBackend('__reset__');
  }

  // ── UI component event handlers ────────────────────────────────────────

  onBusinessSelected(type: string) { this._sendToBackend(type); }

  onRestaurantSelected(id: string) {
    this.restaurantId = id;
    this._sendToBackend(id);
  }

  onFormSubmitted(value: string) { this._sendToBackend(value); }

  onMainMenuSelected(action: string) { this._sendToBackend(action); }

  onItemAdded(item: any) {
    const existing = this.cart.find(c => c.id === item.id);
    if (existing) {
      existing.qty++;
    } else {
      this.cart = [...this.cart, { id: item.id, name: item.name, price: item.price, emoji: item.emoji, qty: 1 }];
    }
    this._sendToBackend('item_added');
  }

  onViewCart() { this._sendToBackend('view_cart'); }

  onMenuBack() { this._sendToBackend('back'); }

  onQtyChanged(event: { item: CartItem; delta: number }) {
    const item = this.cart.find(c => c.id === event.item.id);
    if (item) {
      item.qty = Math.max(0, item.qty + event.delta);
      this.cart = this.cart.filter(c => c.qty > 0);
    }
    const total = this.cart.reduce((s, i) => s + i.price * i.qty, 0);
    const lastMsg = this.messages[this.messages.length - 1];
    if (lastMsg?.uiBlock?.type === 'cart_review') {
      lastMsg.uiBlock.data = { ...lastMsg.uiBlock.data, cart: [...this.cart], total: total.toFixed(2) };
    }
    this._save();
    this.cdr.detectChanges();
  }

  onOrderConfirmed() { this._sendToBackend('confirm_order'); }

  onCartBack() { this._sendToBackend('order_food'); }

  onDatePicked(d: string) { this._sendToBackend(d); }
  onTimePicked(t: string) { this._sendToBackend(t); }
  onPartySizePicked(n: number) { this._sendToBackend(String(n)); }
  onBookingConfirmed() { this._sendToBackend('confirm_booking'); }
  onBookingCancelled() { this._sendToBackend('cancel'); }

  onBackToMenu() { this._sendToBackend('back_to_menu'); }

  // ── Core send/receive ───────────────────────────────────────────────────

  private _addUserMessage(text: string) {
    this.messages.push({ sender: 'You', text, timestamp: new Date() });
    this.scrollToBottom();
    this._save();
  }

  private _sendToBackend(message: string) {
    this.isTyping = true;
    this.scrollToBottom();

    this.chatService.sendMessage({
      message,
      state: this.currentState,
      restaurantId: this.restaurantId,
      session: this.session,
      cart: this.cart,
      conversationUniqueId: this.conversationUniqueId,
    }).subscribe({
      next: (res) => {
        this.isTyping = false;
        this.currentState = res.nextState;
        this.session = res.session;
        this.cart = res.cart;
        this.conversationUniqueId = res.conversationUniqueId;

        // Store brand color from restaurant
        if (res.ui?.type === 'restaurant_cards' || res.ui?.type === 'form_step') {
          // will be set after restaurant pick
        }

        this.messages.push({
          sender: 'Bot',
          text: res.reply,
          timestamp: new Date(),
          uiBlock: res.ui,
        });

        this._save();
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 0);
      },
      error: (err: unknown) => {
        this.isTyping = false;
        let text = 'Something went wrong. Please try again.';
        if (err instanceof TimeoutError) {
          text = 'Request timed out. Make sure the backend is running on port 3000.';
        } else {
          const e = err as HttpErrorResponse;
          if (e.status === 0) text = 'Cannot reach the API. Start the backend with `node server.js`.';
        }
        this.messages.push({ sender: 'Bot', text, timestamp: new Date() });
        this.cdr.detectChanges();
        setTimeout(() => this.scrollToBottom(), 0);
      },
    });
  }

  private _save() {
    try {
      localStorage.setItem('dinebot_session', JSON.stringify({
        messages: this.messages,
        currentState: this.currentState,
        restaurantId: this.restaurantId,
        session: this.session,
        cart: this.cart,
        conversationUniqueId: this.conversationUniqueId,
      }));
    } catch { /* quota */ }
  }

  scrollToBottom() {
    setTimeout(() => {
      if (this.messageContainer?.nativeElement) {
        this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
      }
    }, 0);
  }
}
