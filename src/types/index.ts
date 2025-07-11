export type Job = 'job1' | 'job2';

export interface TimeEntry {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  pause: number; // in minutes
  location: string;
  job: Job;
  totalHours: number;
  overtimeHours: number;
  isVacation?: boolean;
  isHoliday?: boolean;
}

export type OvertimeOption = 'payout' | 'keep';

// This will now store all necessary data to regenerate the PDF.
export interface DownloadHistoryEntry {
  id: string;
  userName: string;
  monthName: string;
  downloadDate: Date;
  // Added fields to store the state at the time of download
  entries: TimeEntry[];
  monthlySummary: {
    totalWorkHours: number;
    totalOvertime: number;
    totalPause: number;
    vacationDays: number;
    holidayDays: number;
  };
  overtimeOption: OvertimeOption;
  job?: Job;
}
