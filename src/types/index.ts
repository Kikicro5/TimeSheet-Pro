export interface TimeEntry {
  id: string;
  date: Date;
  startTime: string;
  endTime: string;
  pause: number; // in minutes
  location: string;
  totalHours: number;
  overtimeHours: number;
  isVacation?: boolean;
  isHoliday?: boolean;
}

export type OvertimeOption = 'payout' | 'keep';
