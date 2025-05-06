
import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTableModule } from 'ng-zorro-antd/table';
import { CommonModule } from '@angular/common';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
  selector: 'app-schedules',
  standalone: true,
  host: { ngSkipHydration: 'true' },
  imports: [
    NzAlertModule,
    NzGridModule,
    NzSelectModule,
    NzRadioModule,
    FormsModule,
    NzButtonModule,
    NzEmptyModule,
    CommonModule,
    NzTableModule,
    NzModalModule,
    NzTypographyModule,
    NzFormModule,
    NzInputModule,
    NzSpaceModule,
    ReactiveFormsModule,
    NzIconModule,
  ],
  templateUrl: './schedules.component.html',
  styleUrls: ['./schedules.component.css']
})
export class SchedulesComponent {
  private baseUrl = 'http://localhost:5228/api';
  filteredOfficers: OfficerWithShifts[] = [];
  searchText: string = '';
  officers: OfficerWithShifts[] = [];
  alertType: 'success' | 'error' | null = null;
  alertMessage: string = '';
  private alertTimeout: any = null;
  // 'current' or 'next-week'
  scheduleView: 'current' | 'next-week' = 'current';

  constructor(private http: HttpClient, private modalService: NzModalService) {
    this.fetchSchedule();
  }

  /**
   * Fetches the schedule data.
   * @param which - 'current' or 'next-week'
   */
  fetchSchedule(which: 'current' | 'next-week' = 'current') {
    const endpoint = which === 'current'
      ? `${this.baseUrl}/schedule/current`
      : `${this.baseUrl}/schedule/next-week`;

    this.http.get<ScheduleApiResponse>(endpoint).subscribe((schedule) => {
      const shifts: ShiftAssignment[] = schedule?.shifts?.$values ?? [];
      const officerMap = new Map<number, OfficerWithShifts>();

      for (const shift of shifts) {
        if (!officerMap.has(shift.officerId)) {
          officerMap.set(shift.officerId, {
            officerId: shift.officerId,
            firstName: shift.officerFirstName,
            lastName: shift.officerLastName,
            fullName: shift.officerFullName,
            shifts: []
          });
        }
        officerMap.get(shift.officerId)!.shifts.push({
          date: shift.date,
          type: shift.type
        });
      }

      this.officers = Array.from(officerMap.values());
      this.officers.sort((a, b) => a.fullName.localeCompare(b.fullName));
      this.filteredOfficers = [...this.officers];

      if (this.searchText.trim()) {
        this.onSearch();
      }
    });
  }

  onSearch(): void {
    if (!this.searchText.trim()) {
      this.filteredOfficers = [...this.officers];
    } else {
      const searchTerm = this.searchText.toLowerCase().trim();
      this.filteredOfficers = this.officers.filter(officer =>
        officer.fullName.toLowerCase().includes(searchTerm)
      );
    }
  }

  private showAlert(type: 'success' | 'error', message: string) {
    this.alertType = type;
    this.alertMessage = message;
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
    this.alertTimeout = setTimeout(() => {
      this.alertType = null;
      this.alertMessage = '';
      this.alertTimeout = null;
    }, 3000);
  }

  /**
   * Generates the next week's schedule (POST) and fetches it.
   */
  generateNextWeekSchedule() {
    this.http.post(`${this.baseUrl}/schedule/generate-next-week`, {}).subscribe({
      next: () => {
        this.showAlert('success', 'Generated Next Week\'s Schedule');
        this.scheduleView = 'next-week';
        this.fetchSchedule('next-week'); // Fetch next week's schedule after generation
      },
      error: (err) => {
        this.showAlert('error', 'Failed to generate next week\'s schedule');
        console.error('Failed to generate next week\'s schedule:', err);
      }
    });
  }

  /**
   * Handler for UI button to generate and view next week's schedule.
   */
  onGenerateNextWeek() {
    this.generateNextWeekSchedule();
  }

  /**
   * Handler for UI button to view current week's schedule.
   */
  onViewCurrent() {
    this.scheduleView = 'current';
    this.fetchSchedule('current');
  }

  /**
   * Handler for UI button to view next week's schedule (if already generated).
   */
  onViewNextWeek() {
    this.scheduleView = 'next-week';
    this.fetchSchedule('next-week');
  }

  onPrint() {
    // You may want to print current or next week's schedule based on scheduleView
    const which = this.scheduleView;
    const endpoint = which === 'current'
      ? `${this.baseUrl}/pdf/schedule/current`
      : `${this.baseUrl}/pdf/schedule/next-week`;

    this.http.get(endpoint, { responseType: 'blob' }).subscribe((pdfBlob) => {
      const blob = new Blob([pdfBlob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      const fileName = `Schedule-${which}-${hours}${minutes}.pdf`;
      window.open(url);
    });
  }
}

// API response interfaces
export interface ScheduleApiResponse {
  $id: string;
  id: number;
  startDate: string;
  endDate: string;
  shifts: {
    $id: string;
    $values: ShiftAssignment[];
  };
}

export interface ShiftAssignment {
  $id: string;
  id: number;
  date: string;
  type: string;
  officerId: number;
  officerFirstName: string;
  officerLastName: string;
  officerFullName: string;
  scheduleId: number;
}

// For table display
export interface OfficerWithShifts {
  officerId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  shifts: { date: string; type: string }[];
}
