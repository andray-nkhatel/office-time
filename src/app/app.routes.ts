import { Routes } from '@angular/router';
import { OfficersComponent } from './pages/officers/officers.component';
import { SchedulesComponent } from './pages/schedules/schedules.component';


export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'officer' },
 
  {path:'officer', component: OfficersComponent},
  {path: 'schedule', component: SchedulesComponent},
  
];



