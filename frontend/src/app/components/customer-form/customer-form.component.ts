import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="form-step">
      <div class="step-dots">
        <span *ngFor="let i of steps" class="dot" [class.active]="i === data.step" [class.done]="i < data.step">
          {{ i < data.step ? '✓' : i }}
        </span>
      </div>
      <label class="step-label">{{ data.label }}</label>
      <div class="step-input-row">
        <input
          class="step-input"
          [(ngModel)]="inputValue"
          [placeholder]="data.placeholder"
          (keyup.enter)="submit()"
          autofocus
        />
        <button class="step-btn" (click)="submit()" [disabled]="!inputValue.trim()">Next →</button>
      </div>
    </div>
  `,
  styles: [`
    .form-step {
      background: #fff;
      border: 2px solid #e2e8f0;
      border-radius: 14px;
      padding: 16px;
      margin-top: 10px;
    }
    .step-dots {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }
    .dot {
      width: 28px; height: 28px;
      border-radius: 50%;
      background: #e2e8f0;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.8rem;
      font-weight: 600;
      color: #a0aec0;
      transition: all 0.2s;
    }
    .dot.active {
      background: #e65c00;
      color: #fff;
    }
    .dot.done {
      background: #48bb78;
      color: #fff;
    }
    .step-label {
      display: block;
      font-weight: 600;
      color: #2d3748;
      margin-bottom: 10px;
      font-size: 0.95rem;
    }
    .step-input-row {
      display: flex;
      gap: 8px;
    }
    .step-input {
      flex: 1;
      padding: 10px 14px;
      border: 2px solid #e2e8f0;
      border-radius: 10px;
      font-size: 0.95rem;
      font-family: inherit;
      outline: none;
      transition: border 0.2s;
    }
    .step-input:focus { border-color: #e65c00; }
    .step-btn {
      padding: 10px 18px;
      background: #e65c00;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      transition: background 0.2s;
    }
    .step-btn:hover:not(:disabled) { background: #cf4f00; }
    .step-btn:disabled { opacity: 0.5; cursor: not-allowed; }
  `]
})
export class CustomerFormComponent implements OnChanges {
  @Input() data: { step: number; label: string; placeholder: string; total: number } = { step: 1, label: '', placeholder: '', total: 3 };
  @Output() submitted = new EventEmitter<string>();

  inputValue = '';
  steps: number[] = [];

  ngOnChanges() {
    this.steps = Array.from({ length: this.data.total }, (_, i) => i + 1);
    this.inputValue = '';
  }

  submit() {
    if (this.inputValue.trim()) {
      this.submitted.emit(this.inputValue.trim());
      this.inputValue = '';
    }
  }
}
