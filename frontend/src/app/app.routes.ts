import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat.component';
import { AdminDashboardComponent } from './admin-dashboard/admin-dashboard.component';

export const routes: Routes = [
  { path: '', component: ChatComponent },
  { path: 'admin', component: AdminDashboardComponent }
];
