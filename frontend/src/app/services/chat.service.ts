import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { environment } from '../config/api.config';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  emoji: string;
  qty: number;
}

export interface ChatSession {
  name?: string;
  phone?: string;
  email?: string;
  restaurantName?: string;
  bookingDate?: string;
  bookingTime?: string;
  partySize?: number;
  [key: string]: any;
}

export interface UiBlock {
  type:
    | 'business_cards'
    | 'restaurant_cards'
    | 'form_step'
    | 'main_menu'
    | 'menu_grid'
    | 'cart_review'
    | 'date_picker'
    | 'time_slots'
    | 'party_size'
    | 'booking_confirm'
    | 'order_summary';
  data: any;
}

export interface ChatResponse {
  reply: string;
  nextState: string;
  ui: UiBlock | null;
  session: ChatSession;
  cart: CartItem[];
  conversationUniqueId: string;
}

const CHAT_TIMEOUT_MS = 15000;

@Injectable({ providedIn: 'root' })
export class ChatService {
  private apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  sendMessage(payload: {
    message: string;
    state: string;
    restaurantId: string | null;
    session: ChatSession;
    cart: CartItem[];
    conversationUniqueId?: string;
  }): Observable<ChatResponse> {
    return this.http
      .post<ChatResponse>(this.apiUrl + '/chat', payload)
      .pipe(timeout(CHAT_TIMEOUT_MS));
  }
}
