import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../config/api.config';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private apiUrl = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) { }

  getAnalyticsDashboard(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/chat/admin/getAnalyticsDashboard');
  }

  getKbSuggestions(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/chat/admin/getKbSuggestions');
  }
}
