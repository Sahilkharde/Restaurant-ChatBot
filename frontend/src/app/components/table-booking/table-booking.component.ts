import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-table-booking',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Date picker -->
    <div *ngIf="data?.type === 'date_picker'" class="booking-wrap">
      <div class="book-title">📅 Select a Date</div>
      <div class="date-grid">
        <button *ngFor="let d of data.availableDates" class="date-btn" (click)="pickDate(d)">
          <span class="date-day">{{ dayName(d) }}</span>
          <span class="date-num">{{ dateNum(d) }}</span>
          <span class="date-mon">{{ monthName(d) }}</span>
        </button>
      </div>
    </div>

    <!-- Time slots -->
    <div *ngIf="data?.type === 'time_slots'" class="booking-wrap">
      <div class="book-title">🕐 Select a Time</div>
      <div class="slots-grid">
        <button
          *ngFor="let s of data.slots"
          class="slot-btn"
          [class.unavailable]="s.available === 0"
          [disabled]="s.available === 0"
          (click)="pickTime(s.time)"
        >
          {{ s.time }}
          <span class="slot-avail" *ngIf="s.available > 0">{{ s.available }} left</span>
          <span class="slot-avail sold" *ngIf="s.available === 0">Full</span>
        </button>
      </div>
    </div>

    <!-- Party size -->
    <div *ngIf="data?.type === 'party_size'" class="booking-wrap">
      <div class="book-title">👥 Party Size</div>
      <div class="party-grid">
        <button *ngFor="let n of partyOptions" class="party-btn" (click)="pickParty(n)">
          {{ n }} {{ n === 1 ? 'Guest' : 'Guests' }}
        </button>
      </div>
    </div>

    <!-- Booking confirm -->
    <div *ngIf="data?.type === 'booking_confirm'" class="booking-wrap">
      <div class="book-title">Confirm Your Reservation</div>
      <div class="confirm-details">
        <div>🍽️ <strong>{{ data.restaurantName }}</strong></div>
        <div>📅 {{ formatDate(data.date) }}</div>
        <div>🕐 {{ data.time }}</div>
        <div>👥 Party of {{ data.partySize }}</div>
      </div>
      <div class="confirm-actions">
        <button class="confirm-btn" (click)="confirmBooking()">Confirm Booking ✓</button>
        <button class="cancel-btn" (click)="cancelBooking()">Change Details</button>
      </div>
    </div>
  `,
  styles: [`
    .booking-wrap {
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
      margin-top: 10px;
    }
    .book-title { font-weight: 700; font-size: 0.95rem; color: #2d3748; margin-bottom: 12px; }
    .date-grid {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .date-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 10px 14px;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      background: #fff;
      cursor: pointer;
      font-family: inherit;
      min-width: 68px;
      transition: all 0.2s;
    }
    .date-btn:hover { border-color: #e65c00; background: #fff5ee; }
    .date-day { font-size: 0.7rem; color: #718096; font-weight: 600; text-transform: uppercase; }
    .date-num { font-size: 1.5rem; font-weight: 700; color: #1a202c; line-height: 1.1; }
    .date-mon { font-size: 0.72rem; color: #718096; }
    .slots-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .slot-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 10px 6px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 600;
      font-family: inherit;
      color: #2d3748;
      transition: all 0.2s;
    }
    .slot-btn:hover:not(:disabled) { border-color: #e65c00; background: #fff5ee; }
    .slot-btn.unavailable { opacity: 0.4; cursor: not-allowed; }
    .slot-avail { font-size: 0.68rem; color: #48bb78; font-weight: 400; }
    .slot-avail.sold { color: #fc8181; }
    .party-grid {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .party-btn {
      padding: 10px 18px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      background: #fff;
      cursor: pointer;
      font-family: inherit;
      font-weight: 600;
      font-size: 0.9rem;
      transition: all 0.2s;
    }
    .party-btn:hover { border-color: #e65c00; background: #fff5ee; }
    .confirm-details {
      display: flex;
      flex-direction: column;
      gap: 8px;
      background: #f7fafc;
      border-radius: 10px;
      padding: 14px;
      margin-bottom: 14px;
      font-size: 0.92rem;
      color: #2d3748;
      line-height: 1.6;
    }
    .confirm-actions { display: flex; gap: 8px; }
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
      transition: background 0.2s;
    }
    .confirm-btn:hover { background: #cf4f00; }
    .cancel-btn {
      padding: 12px 16px;
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-weight: 600;
      color: #4a5568;
      cursor: pointer;
      font-family: inherit;
    }
  `]
})
export class TableBookingComponent implements OnChanges {
  @Input() data: any = {};
  @Output() datePicked = new EventEmitter<string>();
  @Output() timePicked = new EventEmitter<string>();
  @Output() partySizePicked = new EventEmitter<number>();
  @Output() bookingConfirmed = new EventEmitter<void>();
  @Output() bookingCancelled = new EventEmitter<void>();

  partyOptions: number[] = [];

  ngOnChanges() {
    if (this.data?.type === 'party_size') {
      const max = this.data.max || 6;
      this.partyOptions = Array.from({ length: max }, (_, i) => i + 1);
    }
  }

  pickDate(d: string) { this.datePicked.emit(d); }
  pickTime(t: string) { this.timePicked.emit(t); }
  pickParty(n: number) { this.partySizePicked.emit(n); }
  confirmBooking() { this.bookingConfirmed.emit(); }
  cancelBooking() { this.bookingCancelled.emit(); }

  dayName(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'short' }); }
  dateNum(d: string) { return new Date(d + 'T12:00:00').getDate(); }
  monthName(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('en-CA', { month: 'short' }); }
  formatDate(d: string) {
    if (!d) return '';
    return new Date(d + 'T12:00:00').toLocaleDateString('en-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }
}
