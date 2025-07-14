
'use client';

import { useState, useMemo, useEffect, useContext } from 'react';
import type { TimeEntry, OvertimeOption } from '@/types';
import { TimesheetForm } from '@/components/timesheet-form';
import { TimesheetList } from '@/components/timesheet-list';
import { PiggyBank } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { LanguageContext } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/language-switcher';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AdBanner } from '@/components/ad-banner';
import Image from 'next/image';

export default function Home() {
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [userName, setUserName] = useState(''); // Example user name
  const [overtimeOption, setOvertimeOption] = useState<OvertimeOption>('keep');
  const [carryOverVacationDays, setCarryOverVacationDays] = useState(0);
  const [carryOverOvertimeHours, setCarryOverOvertimeHours] = useState(0);

  const { toast } = useToast();
  const { language } = useContext(LanguageContext);
  const t = translations[language];

  useEffect(() => {
    setIsClient(true);
    try {
      const savedEntries = localStorage.getItem('timesheet-entries');
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries).map((e: any) => ({...e, date: new Date(e.date)}));
        setEntries(parsedEntries);
      }
      const savedOvertimeOption = localStorage.getItem('overtime-option') as OvertimeOption;
      if (savedOvertimeOption) {
        setOvertimeOption(savedOvertimeOption);
      }
      const savedUserName = localStorage.getItem('user-name');
      if (savedUserName && savedUserName !== 'John Doe') {
        setUserName(savedUserName);
      }
      const savedCarryOverVacation = localStorage.getItem('carry-over-vacation');
      if (savedCarryOverVacation) {
          setCarryOverVacationDays(parseFloat(savedCarryOverVacation) || 0);
      }
      const savedCarryOverOvertime = localStorage.getItem('carry-over-overtime');
      if (savedCarryOverOvertime) {
          setCarryOverOvertimeHours(parseFloat(savedCarryOverOvertime) || 0);
      }
    } catch (error) {
      console.error("Failed to load data from localStorage", error);
      toast({
        variant: 'destructive',
        title: t.error,
        description: 'Could not load saved data.',
      })
    }
  }, []);

  useEffect(() => {
    if(isClient) {
      try {
        localStorage.setItem('timesheet-entries', JSON.stringify(entries));
        localStorage.setItem('overtime-option', overtimeOption);
        localStorage.setItem('user-name', userName);
        localStorage.setItem('carry-over-vacation', String(carryOverVacationDays));
        localStorage.setItem('carry-over-overtime', String(carryOverOvertimeHours));
      } catch (error) {
        console.error("Failed to save data to localStorage", error);
         toast({
          variant: 'destructive',
          title: t.error,
          description: 'Could not save data.',
        })
      }
    }
  }, [entries, overtimeOption, userName, carryOverVacationDays, carryOverOvertimeHours, isClient]);
  
  const addEntry = (entry: Omit<TimeEntry, 'id' | 'totalHours' | 'overtimeHours'>) => {
    if (!userName) {
        toast({
            variant: 'destructive',
            title: t.error,
            description: t.nameRequired,
        });
        return;
    }
    const dateExists = entries.some(e => new Date(e.date).toDateString() === new Date(entry.date).toDateString());
    if (dateExists) {
        toast({
            variant: 'destructive',
            title: t.error,
            description: `${t.entryExistsError} ${format(entry.date, 'dd.MM.yyyy')}.`,
        });
        return;
    }

    if (entry.isVacation || entry.isHoliday) {
        const newEntry: TimeEntry = {
            ...entry,
            id: new Date().toISOString() + Math.random(),
            startTime: '',
            endTime: '',
            pause: 0,
            location: entry.isVacation ? t.vacation : t.holiday,
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

  const yearlySummary = useMemo(() => {
    if (!isClient) return { totalOvertime: 0, vacationDays: 0 };
    const now = new Date();
    const currentYear = now.getFullYear();

    const yearlyEntries = entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getFullYear() === currentYear;
    });

    const summary = yearlyEntries.reduce(
      (acc, entry) => {
        if (entry.isVacation) {
          acc.vacationDays += 1;
        } else if (!entry.isHoliday) {
          acc.totalOvertime += (entry.overtimeHours || 0);
        }
        return acc;
      },
      { totalOvertime: 0, vacationDays: 0 }
    );
    
    return {
        totalOvertime: summary.totalOvertime + carryOverOvertimeHours,
        vacationDays: summary.vacationDays + carryOverVacationDays,
    }
  }, [entries, isClient, carryOverOvertimeHours, carryOverVacationDays]);


  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="bg-primary text-primary-foreground shadow-md">
        <div className="w-full px-4 sm:container sm:mx-auto sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <Image src="/icon.png" alt="TimeSheet Pro icon" width={24} height={24} />
            <h1 className="text-xl sm:text-2xl font-bold font-headline whitespace-nowrap">TimeSheet Pro</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
             <Dialog>
               <DialogTrigger asChild>
                  <Button variant="outline" className="h-9 px-3 bg-primary-foreground text-primary hover:bg-primary-foreground/90">
                    <PiggyBank className="h-4 w-4" />
                    <span className="ml-2 hidden sm:inline">{t.yearlySummary}</span>
                  </Button>
               </DialogTrigger>
               <DialogContent>
                 <DialogHeader>
                   <DialogTitle>{t.yearlySummary} {new Date().getFullYear()}</DialogTitle>
                   <DialogDescription>
                    {t.yearlySummaryDesc}
                   </DialogDescription>
                 </DialogHeader>
                 <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="carryOverVacation">{t.vacationFromPreviousYear}</Label>
                      <Input 
                        id="carryOverVacation"
                        type="number" 
                        value={carryOverVacationDays} 
                        onChange={(e) => setCarryOverVacationDays(parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="carryOverOvertime">{t.overtimeFromPreviousYear}</Label>
                      <Input
                        id="carryOverOvertime"
                        type="number"
                        value={carryOverOvertimeHours}
                        onChange={(e) => setCarryOverOvertimeHours(parseFloat(e.target.value) || 0)}
                        className="text-right"
                      />
                    </div>
                    <div className="flex items-center justify-between pt-4 border-t mt-2">
                        <span className="text-muted-foreground">{t.vacationDays} ({t.total})</span>
                        <span className="font-bold text-lg">{yearlySummary.vacationDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">{t.totalOvertime} ({t.total})</span>
                        <span className={`font-bold text-lg ${yearlySummary.totalOvertime >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {yearlySummary.totalOvertime.toFixed(2)}h
                        </span>
                    </div>
                 </div>
               </DialogContent>
             </Dialog>
             <LanguageSwitcher />
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8 grid gap-8 flex-grow">
        <TimesheetForm 
          addEntry={addEntry} 
          userName={userName}
          setUserName={setUserName}
        />
        <TimesheetList 
          entries={entries} 
          deleteEntry={deleteEntry}
          userName={userName}
          overtimeOption={overtimeOption}
          setOvertimeOption={setOvertimeOption}
          monthlySummary={monthlySummary}
        />
      </main>
      <AdBanner />
    </div>
  );
}
