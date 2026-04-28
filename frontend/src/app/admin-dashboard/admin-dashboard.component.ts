import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalyticsService } from '../services/analytics.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  analyticsData: any = null;
  kbSuggestions: any[] = [];
  isLoading: boolean = true;
  errorStr: string = '';

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    // Fetch Analytics
    this.analyticsService.getAnalyticsDashboard().subscribe({
      next: (res) => {
        if (res.success) {
          this.analyticsData = res.data;
        } else {
          this.errorStr = 'Failed to load analytics.';
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.errorStr = 'Error connecting to analytics server.';
        this.isLoading = false;
      }
    });

    // Fetch KB Suggestions
    this.analyticsService.getKbSuggestions().subscribe({
      next: (res) => {
        this.kbSuggestions = res;
      },
      error: (err) => {
        console.error('KB Suggestions Error:', err);
      }
    });
  }
}
