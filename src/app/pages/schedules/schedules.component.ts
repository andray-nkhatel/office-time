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
  filteredOfficers: OfficerWithShifts[] = []; // Array to hold filtered officers
  searchText: string = ''; // Property to store search query

  officers: OfficerWithShifts[] = [];

  alertType: 'success' | 'error' | null = null;
  alertMessage: string = '';
  private alertTimeout: any = null;

  constructor(private http: HttpClient, private modalService: NzModalService) {
    this.fetchSchedule();
  }

  fetchSchedule() {
    this.http.get<ScheduleApiResponse>(`${this.baseUrl}/schedule/current`).subscribe((schedule) => {
      // Defensive: check for shifts and $values
      const shifts: ShiftAssignment[] = schedule?.shifts?.$values ?? [];
      // Group shifts by officerId
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
      // Optional: sort by officer name
      this.officers.sort((a, b) => a.fullName.localeCompare(b.fullName));
      
      // Initialize filtered officers with all officers
      this.filteredOfficers = [...this.officers];
      
      // Apply search if there's any existing search text
      if (this.searchText.trim()) {
        this.onSearch();
      }
    });
  }

  // Method to handle search functionality
  onSearch(): void {
    if (!this.searchText.trim()) {
      // If search text is empty, show all officers
      this.filteredOfficers = [...this.officers];
    } else {
      // Filter officers based on search text
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

  onGenerate() {
    this.http.get(`${this.baseUrl}/schedule/generate`).subscribe({
      next: () => {
        this.showAlert('success', 'Generated New Schedule');
        this.fetchSchedule(); // Refresh the schedule after generation
      },
      error: (err) => {
        this.showAlert('error', 'Failed to generate schedule');
        console.error('Failed to generate schedule:', err);
      }
    });
  }

  onPrint() {
    this.http.get(`${this.baseUrl}/pdf/schedule/current`, { responseType: 'blob' }).subscribe((pdfBlob) => {
      const blob = new Blob([pdfBlob], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');

      const fileName = `Schedule-${hours}${minutes}.pdf`;
      
      // Option 1: Open in new tab
      window.open(url);
  
      // Option 2: Trigger download (uncomment if you want download instead of open)
      //const a = document.createElement('a');
      //a.href = url;
      //a.download = fileName;
      //a.click();
      //window.URL.revokeObjectURL(url);
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