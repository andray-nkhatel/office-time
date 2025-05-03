
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
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';

@Component({
  selector: 'app-officers',
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
    ReactiveFormsModule
  ],
  templateUrl: './officers.component.html',
  styleUrls: ['./officers.component.css']
})
export class OfficersComponent {
  private baseUrl = 'http://localhost:5228/api';

  officers: Officer[] = []; 
  selectedOfficer: Officer | null = null; 
  isConfirmLoading = false;
  officerForm: FormGroup;
  isOfficerDetailsVisible = false;
  isOfficerModalVisible = false;
  isEditMode = false;
  showDeleteAlert = false;
  deleteAlertMessage = '';
  showSuccessAlert = false;
  successAlertMessage = '';
  listOfData: Officer[] = [];

  constructor(
    private http: HttpClient,
    private modalService: NzModalService,
    private fb: FormBuilder
  ) {
    this.fetchOfficers(); 
    this.officerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      gender: [null, [Validators.required]],
      shiftPreference: [null, [Validators.required]],
      dayOff: [null, [Validators.required]]
    });
  } 

  fetchOfficers() {
    this.http.get<OfficerApiResponse>(`${this.baseUrl}/officers`).subscribe((response) => {
      // Defensive: check for $values
      this.officers = response?.$values ?? [];
      this.listOfData = this.officers;
    });
  }

  openEditOfficerModal() {
    this.isEditMode = true;
    this.isOfficerModalVisible = true;
    this.isOfficerDetailsVisible = false;
    if (this.selectedOfficer) {
      this.officerForm.patchValue({
        firstName: this.selectedOfficer.firstName,
        lastName: this.selectedOfficer.lastName,
        gender: this.selectedOfficer.gender,
        shiftPreference: this.selectedOfficer.shiftPreference,
        dayOff: this.selectedOfficer.dayOff
      });
    }
  }

  closeOfficerModal() {
    this.isOfficerModalVisible = false;
    this.isEditMode = false;
    this.officerForm.reset();
  }

  showAddOfficerModal(): void {
    this.isEditMode = false;
    this.selectedOfficer = null;
    this.officerForm.reset();
    this.isOfficerModalVisible = true;
  }

  deleteOfficer() {
    if (!this.selectedOfficer) return;
    this.modalService.confirm({
      nzTitle: 'Are you sure you want to delete this officer?',
      nzContent: `<b style="color: red;">This action cannot be undone.</b>`,
      nzOkText: 'Yes',
      nzOkDanger:true,
      nzOkType: 'primary',
      nzOnOk: () => {
        this.isConfirmLoading = true;
        return new Promise<void>((resolve) => {
          this.http.delete(`${this.baseUrl}/officers/${this.selectedOfficer!.id}`).subscribe({
            next: () => {
              this.isConfirmLoading = false;
              this.fetchOfficers();
              this.closeOfficerDetails();
              this.isOfficerModalVisible = false;
              this.deleteAlertMessage = 'Officer deleted successfully!';
              this.showDeleteAlert = true;
              setTimeout(() => {
                this.showDeleteAlert = false;
              }, 3000);
              resolve();
            },
            error: () => {
              this.isConfirmLoading = false;
              this.deleteAlertMessage = 'Failed to delete officer.';
              this.showDeleteAlert = true;
              setTimeout(() => {
                this.showDeleteAlert = false;
              }, 3000);
              resolve();
            }
          });
        });
      },
      nzCancelText: 'No',
      nzOnCancel: () => {}
    });
  }

  submitOfficerForm() {
    if (this.officerForm.invalid) {
      this.officerForm.markAllAsTouched();
      return;
    }
    this.isConfirmLoading = true;
    if (this.isEditMode && this.selectedOfficer) {
      // Edit (update) officer
      const payload = { ...this.officerForm.value, id: this.selectedOfficer.id };
      this.http.put(`${this.baseUrl}/officers/${this.selectedOfficer.id}`, payload).subscribe({
        next: () => {
          this.isConfirmLoading = false;
          this.fetchOfficers();
          this.closeOfficerModal();
          this.closeOfficerDetails();
        },
        error: () => {
          this.isConfirmLoading = false;
        }
      });
    } else {
      // Add (create) officer
      this.http.post(`${this.baseUrl}/officers`, this.officerForm.value).subscribe({
        next: () => {
          this.isConfirmLoading = false;
          this.fetchOfficers();
          this.closeOfficerModal();
        },
        error: () => {
          this.isConfirmLoading = false;
        }
      });
    }
  }

  openOfficerDetails(officer: Officer) {
    this.selectedOfficer = officer;
    this.isOfficerDetailsVisible = true;
  }

  closeOfficerDetails() {
    this.isOfficerDetailsVisible = false;
    this.selectedOfficer = null;
  }

  listOfColumn = [
    {
      title: 'Name',
      compare: (a: Officer, b: Officer) => a.firstName.localeCompare(b.firstName),
      priority: false
    },
    {
      title: 'Gender',
      compare: (a: Officer, b: Officer) => a.gender - b.gender,
      priority: 2
    },
    {
      title: 'Shift Preference',
      compare: (a: Officer, b: Officer) => a.shiftPreference - b.shiftPreference,
      priority: 1
    },
    {
      title: 'Day Off',
      compare: (a: Officer, b: Officer) => a.dayOff - b.dayOff,
      priority: 3
    }
  ];

  getDayOff(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Unknown';
  }
}

// API response interface for officers
export interface OfficerApiResponse {
  $id: string;
  $values: Officer[];
}

// Officer interface
export interface Officer {
  id: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  shiftPreference: ShiftPreference;
  dayOff: number;
}

export enum Gender {
  Male = 0,
  Female = 1
}

export enum ShiftPreference {
  Day = 0,
  Night = 1,
  Both = 3
}
