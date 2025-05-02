import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';


@Injectable({ providedIn: 'root' })
@Component({
  selector: 'app-schedules',
  imports: [
    NzModalModule,
    NzEmptyModule,
    CommonModule

  ],
  templateUrl: './schedules.component.html',
  styleUrl: './schedules.component.css'
})
export class SchedulesComponent {

  private baseUrl = 'http://localhost:5228/api'; // Define base URL directly

  constructor(private http: HttpClient) {this.fetchSchedules();} 

    listOfData: Schedule[] = [];
    fetchSchedules() {
      this.http.get<Schedule[]>(`${this.baseUrl}/schedule/current`).subscribe((schedules) => {
        this.schedules = this.schedules;
        this.listOfData = schedules; // Assign API response to table data
        console.log(this.schedules); // Debugging output
      });
    }
    
  schedules: Schedule[] = []; 

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

}

export interface Schedule {
  id: number;
  startDate: Date;
  endDate: Date;
  shifts: Shift;
}

export enum ShiftType
{
    Day,
    Night
}

export interface Shift{
  id: number;
  date: Date;
  type: ShiftType;
  officer: Officer;
}

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


