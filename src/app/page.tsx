'use client';

import { useState, useMemo, useEffect } from 'react';
import type { TimeEntry } from '@/types';
import { TimesheetForm } from '@/components/timesheet-form';
import { TimesheetList } from '@/components/timesheet-list';
import { PiggyBank } from 'lucide-react';

export default function Home() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Load entries from localStorage
    const savedEntries = localStorage.getItem('timesheet-entries');
    if (savedEntries) {
      // Parsing dates from string
      const parsedEntries = JSON.parse(savedEntries).map((e: any) => ({...e, date: new Date(e.date)}));
      setEntries(parsedEntries);
    }
  }, []);

  useEffect(() => {
    if(isClient) {
      // Save entries to localStorage
      localStorage.setItem('timesheet-entries', JSON.stringify(entries));
    }
  }, [entries, isClient]);

  const addEntry = (entry: Omit<TimeEntry, 'id' | 'totalHours'>) => {
    const start = new Date(`1970-01-01T${entry.startTime}:00`);
    const end = new Date(`1970-01-01T${entry.endTime}:00`);
    let diffMs = end.getTime() - start.getTime();
    if (diffMs < 0) { // Handles overnight work
      diffMs += 24 * 60 * 60 * 1000;
    }
    const diffHours = diffMs / (1000 * 60 * 60);
    const totalHours = Math.max(0, diffHours - entry.pause / 60);

    const newEntry: TimeEntry = {
      ...entry,
      id: new Date().toISOString() + Math.random(),
      totalHours,
    };
    setEntries(prev => [...prev, newEntry].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || b.startTime.localeCompare(a.startTime)));
  };

  const deleteEntry = (id: string) => {
    setEntries(prev => prev.filter(entry => entry.id !== id));
  };
  
  const totalHoursThisMonth = useMemo(() => {
    if (!isClient) return 0;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return entries
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
      })
      .reduce((acc, entry) => acc + entry.totalHours, 0);
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
                {totalHoursThisMonth.toFixed(2)}h this month
              </span>
            </div>
          )}
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid gap-8">
        <TimesheetForm addEntry={addEntry} />
        <TimesheetList entries={entries} deleteEntry={deleteEntry} />
      </main>
    </div>
  );
}
