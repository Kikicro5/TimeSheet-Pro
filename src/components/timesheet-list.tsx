'use client';

import { useMemo, useRef, useContext, useState } from 'react';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { TimeEntry, OvertimeOption, DownloadHistoryEntry, Job } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { FileDown, Trash2, CalendarDays, Share2, FileType2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { PdfGenerator } from './pdf-generator';
import { LanguageContext } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TimesheetListProps {
  entries: TimeEntry[];
  deleteEntry: (id: string) => void;
  userName: string;
  overtimeOption: OvertimeOption;
  setOvertimeOption: (option: OvertimeOption) => void;
  monthlySummary: {
    totalWorkHours: number;
    totalOvertime: number;
    totalPause: number;
    vacationDays: number;
    holidayDays: number;
  };
}

interface PdfGeneratorHandles {
  handleExportPDF: () => void;
  handleShare: () => void;
}

const locales: { [key: string]: Locale } = { de, en: enUS };

const jobRowColors: Record<Job, string> = {
    job1: 'bg-blue-50 hover:bg-blue-100',
    job2: 'bg-green-50 hover:bg-green-100',
};

export function TimesheetList({ entries, deleteEntry, userName, overtimeOption, setOvertimeOption, monthlySummary }: TimesheetListProps) {
  const pdfGeneratorRef = useRef<PdfGeneratorHandles>(null);
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  const locale = locales[language] || enUS;
  const [pdfData, setPdfData] = useState<{ entries: TimeEntry[], summary: any, job?: Job } | null>(null);

  const now = new Date();
  const monthName = format(now, 'LLLL yyyy', { locale });

  const monthlyEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    });
  }, [entries, now]);

  const calculateSummaryForJob = (job: Job | null) => {
    const targetEntries = job ? monthlyEntries.filter(e => e.job === job) : monthlyEntries;
    return targetEntries.reduce(
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
  }
  
  const addDownloadToHistory = (job?: Job) => {
    const entriesToSave = job ? monthlyEntries.filter(e => e.job === job) : monthlyEntries;
    const summaryToSave = job ? calculateSummaryForJob(job) : monthlySummary;

    const newHistoryEntry: DownloadHistoryEntry = {
        id: new Date().toISOString(),
        userName: userName,
        monthName: monthName,
        downloadDate: new Date(),
        entries: entriesToSave,
        monthlySummary: summaryToSave,
        overtimeOption: overtimeOption,
        job: job,
    };
    const history = JSON.parse(localStorage.getItem('download-history') || '[]');
    history.push(newHistoryEntry);
    localStorage.setItem('download-history', JSON.stringify(history));
  }

  const prepareAndExecute = (action: 'export' | 'share', job: Job) => {
    const jobEntries = monthlyEntries.filter(e => e.job === job);
    const jobSummary = calculateSummaryForJob(job);
    
    setPdfData({ entries: jobEntries, summary: jobSummary, job: job });
    
    setTimeout(() => {
        if (pdfGeneratorRef.current) {
            if (action === 'export') {
                pdfGeneratorRef.current.handleExportPDF();
            } else {
                pdfGeneratorRef.current.handleShare();
            }
            addDownloadToHistory(job);
        }
    }, 100); // Timeout to allow state to update and re-render PDF generator
  }


  if (entries.length === 0) {
    return (
      <Card className="w-full text-center py-16 shadow-lg animate-in fade-in-50">
        <CardHeader>
           <div className="mx-auto bg-secondary rounded-full p-4 w-fit">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
           </div>
          <CardTitle className="mt-4 text-2xl font-headline">{t.noEntries}</CardTitle>
          <CardDescription>{t.addFirstEntry}</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  const hasJob1Entries = monthlyEntries.some(e => e.job === 'job1');
  const hasJob2Entries = monthlyEntries.some(e => e.job === 'job2');

  return (
    <>
    <Card className="w-full shadow-lg animate-in fade-in-50">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-headline">{t.loggedEntries}</CardTitle>
          <CardDescription>{t.recentWorkHours}</CardDescription>
        </div>
        <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" disabled={!hasJob1Entries && !hasJob2Entries}>
                  <FileType2 className="mr-2 h-4 w-4" />
                  {t.exportPdf}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => prepareAndExecute('export', 'job1')} disabled={!hasJob1Entries}>
                  {t.exportFor} {t.job1}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => prepareAndExecute('export', 'job2')} disabled={!hasJob2Entries}>
                  {t.exportFor} {t.job2}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {navigator.share && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <Button variant="outline" disabled={!hasJob1Entries && !hasJob2Entries}>
                      <Share2 className="mr-2 h-4 w-4" />
                      {t.share}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => prepareAndExecute('share', 'job1')} disabled={!hasJob1Entries}>
                     {t.shareFor} {t.job1}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => prepareAndExecute('share', 'job2')} disabled={!hasJob2Entries}>
                     {t.shareFor} {t.job2}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.date}</TableHead>
              <TableHead>{t.job}</TableHead>
              <TableHead>{t.startTime}</TableHead>
              <TableHead>{t.endTime}</TableHead>
              <TableHead>{t.pause}</TableHead>
              <TableHead>{t.location}</TableHead>
              <TableHead className="text-right">{t.overtime}</TableHead>
              <TableHead className="text-right w-[100px]">{t.actions}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(entry => {
              const overtimeHours = typeof entry.overtimeHours === 'number' ? entry.overtimeHours : 0;
              let rowClass = '';
              if (entry.isVacation) {
                rowClass = 'bg-blue-50 hover:bg-blue-100';
              } else if (entry.isHoliday) {
                rowClass = 'bg-green-50 hover:bg-green-100';
              } else {
                rowClass = jobRowColors[entry.job];
              }
              
              const getLocationText = () => {
                if (entry.isVacation) return t.vacation;
                if (entry.isHoliday) return t.holiday;
                return entry.location;
              }

              return (
              <TableRow key={entry.id} className={cn('animate-in fade-in-25', rowClass)}>
                <TableCell className="font-medium">{format(new Date(entry.date), 'dd.MM.yyyy')}</TableCell>
                <TableCell className="font-semibold">{entry.isVacation || entry.isHoliday ? '-' : t[entry.job]}</TableCell>
                <TableCell>{entry.isVacation || entry.isHoliday ? '-' : entry.startTime}</TableCell>
                <TableCell>{entry.isVacation || entry.isHoliday ? '-' : entry.endTime}</TableCell>
                <TableCell>{entry.isVacation || entry.isHoliday ? '-' : `${entry.pause} min`}</TableCell>
                <TableCell><div className="max-w-[150px] truncate">{getLocationText()}</div></TableCell>
                <TableCell className={`text-right font-mono ${overtimeHours >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.isVacation || entry.isHoliday ? '-' : overtimeHours.toFixed(2) + 'h'}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">{t.deleteEntry}</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t.areYouSure}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {t.deleteEntryAction}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteEntry(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          {t.delete}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )})}
          </TableBody>
        </Table>
      </CardContent>
      <CardFooter className="flex-col items-center gap-4">
          <div className="w-full">
            <h3 className="font-bold text-lg mb-2 text-center">{t.monthlySummary} ({monthName})</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div className="bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground">{t.totalWorkHours}</p>
                    <p className="font-bold text-base">{monthlySummary.totalWorkHours.toFixed(2)}h</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground">{t.totalOvertime}</p>
                    <p className={`font-bold text-base ${monthlySummary.totalOvertime >= 0 ? 'text-green-600' : 'text-red-600'}`}>{monthlySummary.totalOvertime.toFixed(2)}h</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground">{t.totalPause}</p>
                    <p className="font-bold text-base">{monthlySummary.totalPause} min</p>
                </div>
                 <div className="bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground">{t.vacationDays}</p>
                    <p className="font-bold text-base">{monthlySummary.vacationDays}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground">{t.holidays}</p>
                    <p className="font-bold text-base">{monthlySummary.holidayDays}</p>
                </div>
            </div>
          </div>
          <div className="flex flex-col items-center mt-4">
            <Label className="font-bold">{t.overtimeOption}:</Label>
             <RadioGroup
                value={overtimeOption}
                onValueChange={(value: OvertimeOption) => setOvertimeOption(value)}
                className="flex items-center gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="payout" id="payout" />
                <Label htmlFor="payout">{t.payout}</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="keep" id="keep" />
                <Label htmlFor="keep">{t.keep}</Label>
              </div>
            </RadioGroup>
          </div>
      </CardFooter>
    </Card>

    <PdfGenerator
        ref={pdfGeneratorRef}
        userName={userName}
        monthName={monthName}
        monthlyEntries={pdfData?.entries || []}
        monthlySummary={pdfData?.summary || {}}
        overtimeOption={overtimeOption}
        job={pdfData?.job}
    />
    </>
  );
}
