import { Component } from '@angular/core';
import { Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzTableModule } from 'ng-zorro-antd/table';
import { CommonModule } from '@angular/common';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzSpaceModule, NzSpaceSize} from 'ng-zorro-antd/space';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzOptionComponent, NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';




@Injectable({ providedIn: 'root' })
@Component({
  selector: 'app-officers',
  // imports: [NzButtonModule, NzEmptyModule, CommonModule, NzTableModule, NzModalModule],
  standalone: true, // Explicitly declare as standalone
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
    FormsModule,
    ReactiveFormsModule],
  templateUrl: './officers.component.html',
  styleUrls: ['./officers.component.css'] // Corrected 'styleUrl' to 'styleUrls' (array)
})
export class OfficersComponent {
  private baseUrl = 'http://localhost:5228/api'; // Define base URL directly
  
  officers: Officer[] = []; 
  selectedOfficer: Officer | null = null; 
  
  // isVisible = false;
  isConfirmLoading = false;
  officerForm: FormGroup;
  isOfficerDetailsVisible = false;
  isOfficerModalVisible = false;
  isEditMode = false;
  showDeleteAlert = false;
  deleteAlertMessage = '';

  showSuccessAlert = false;
  successAlertMessage = '';
  

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
          this.fetchOfficers(); // Refresh officers list
          this.closeOfficerModal(); // Close the modal
          this.closeOfficerDetails(); // Reset officer details
        },
        error: () => {
          this.isConfirmLoading = false;
          // Optionally show error message
        }
      });
    } else {
      // Add (create) officer
      this.http.post(`${this.baseUrl}/officers`, this.officerForm.value).subscribe({
        next: () => {
          this.isConfirmLoading = false;
          this.fetchOfficers(); // Refresh officers list
          this.closeOfficerModal(); // Close the modal
        },
        error: () => {
          this.isConfirmLoading = false;
          // Optionally show error message
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
  
  

  constructor(private http: HttpClient, private modalService: NzModalService, private fb: FormBuilder) {
    this.fetchOfficers(); 
    this.officerForm = this.fb.group({
      firstName: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      gender: [null, [Validators.required]],
      shiftPreference: [null, [Validators.required]],
      dayOff: [null, [Validators.required]]
    });
  } 

  // submitForm(): void {
  //   if (this.officerForm.valid) {
  //     this.isConfirmLoading = true;
  //     this.http.post(`${this.baseUrl}/officers`, this.officerForm.value).subscribe(() => {
  //       this.isVisible = false;
  //       this.isConfirmLoading = false;
  //       this.fetchOfficers(); // Refresh list after adding
  //     });
  //   }
  // }

  

  // showAddOfficerModal(): void {
  //   console.log('Modal should open now');
  //   this.isVisible = true;
  // }

  handleOk(): void {
    this.isConfirmLoading = true;
    setTimeout(() => {
      this.isOfficerModalVisible = false;
      this.isConfirmLoading = false;
    }, 3000);
  }

  handleCancel(): void {
    this.isOfficerModalVisible = false;
  }

  
  fetchOfficers() {
    this.http.get<Officer[]>(`${this.baseUrl}/officers`).subscribe((officers) => {
      this.officers = officers;
      this.listOfData = officers; // Assign API response to table data
      // console.log(this.officers); // Debugging output
    });
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
  

  listOfData: Officer[] = [];

  getDayOff(day: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[day] || 'Unknown'; // Prevents errors if day is out of range
  }
  
}



// Defined the Officer interface correctly
export interface Officer {
  id: number;
  firstName: string;
  lastName: string;
  gender: Gender;
  shiftPreference: ShiftPreference;
  dayOff: number; // Day of week for day off (0 = Sunday, 1 = Monday, etc.)
}

export enum Gender{
  Male = 0,
  Female = 1
}

export enum ShiftPreference {
  Day = 0,
  Night = 1,
  Both= 3
}

