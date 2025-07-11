'use client';

import { useState, useMemo, useEffect } from 'react';
import type { TimeEntry, OvertimeOption } from '@/types';
import { TimesheetForm } from '@/components/timesheet-form';
import { TimesheetList } from '@/components/timesheet-list';
import { PiggyBank } from 'lucide-react';

export default function Home() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userName, setUserName] = useState('John Doe'); // Example user name
  const [overtimeOption, setOvertimeOption] = useState<OvertimeOption>('keep');

  useEffect(() => {
    setIsClient(true);
    const savedEntries = localStorage.getItem('timesheet-entries');
    if (savedEntries) {
      const parsedEntries = JSON.parse(savedEntries).map((e: any) => ({...e, date: new Date(e.date)}));
      setEntries(parsedEntries);
    }
    const savedOvertimeOption = localStorage.getItem('overtime-option') as OvertimeOption;
    if (savedOvertimeOption) {
      setOvertimeOption(savedOvertimeOption);
    }
  }, []);

  useEffect(() => {
    if(isClient) {
      localStorage.setItem('timesheet-entries', JSON.stringify(entries));
      localStorage.setItem('overtime-option', overtimeOption);
    }
  }, [entries, overtimeOption, isClient]);

  const addEntry = (entry: Omit<TimeEntry, 'id' | 'totalHours' | 'overtimeHours'>) => {
    if (entry.isVacation || entry.isHoliday) {
        const newEntry: TimeEntry = {
            ...entry,
            id: new Date().toISOString() + Math.random(),
            startTime: '',
            endTime: '',
            pause: 0,
            location: entry.isVacation ? 'Godišnji odmor' : 'Praznik',
            totalHours: 0,
            overtimeHours: 0,
        };
        setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        return;
    }

    const start = new Date(`1970-01-01T${entry.startTime}:00`);
    const end = new Date(`1970-01-01T${entry.endTime}:00`);
    let diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) { // Handles overnight work
      diffMs += 24 * 60 * 60 * 1000;
    }
    const diffHours = diffMs / (1000 * 60 * 60);
    const totalHours = Math.max(0, diffHours - entry.pause / 60);
    const overtimeHours = totalHours - 8;

    const newEntry: TimeEntry = {
      ...entry,
      id: new Date().toISOString() + Math.random(),
      totalHours,
      overtimeHours,
    };
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.startTime.localeCompare(a.startTime)));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };
  
  const monthlySummary = useMemo(() => {
    if (!isClient) return { totalWorkHours: 0, totalOvertime: 0, totalPause: 0, vacationDays: 0, holidayDays: 0 };
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthlyEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });

    return monthlyEntries.reduce(
      (acc, entry) => {
        if (entry.isVacation) {
            acc.vacationDays += 1;
        } else if (entry.isHoliday) {
            acc.holidayDays += 1;
        } else {
            acc.totalWorkHours += (entry.totalHours || 0);
            acc.totalOvertime += (entry.overtimeHours || 0);
            acc.totalPause += (entry.pause || 0);
        }
        return acc;
      },
      { totalWorkHours: 0, totalOvertime: 0, totalPause: 0, vacationDays: 0, holidayDays: 0 }
    );
  }, [entries, isClient]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold font-headline">TimeSheet Pro</h1>
          {isClient && (
            <div className="flex items-center gap-2 text-lg">
              <PiggyBank className="h-6 w-6" />
              <span>
                Prekovremeni: {monthlySummary.totalOvertime.toFixed(2)}h
              </span>
            </div>
          )}
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid gap-8">
        <TimesheetForm addEntry={addEntry} />
        <TimesheetList 
          entries={entries} 
          deleteEntry={deleteEntry}
          userName={userName}
          overtimeOption={overtimeOption}
          setOvertimeOption={setOvertimeOption}
          monthlySummary={monthlySummary}
        />
      </main>
    </div>
  );
}
