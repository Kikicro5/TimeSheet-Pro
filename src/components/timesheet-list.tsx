
'use client';

import { useMemo, useRef, useContext } from 'react';
import { format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';
import { TimeEntry, OvertimeOption, DownloadHistoryEntry, Job } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Trash2, CalendarDays, Share2, FileType2 } from 'lucide-react';
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
import { PdfGenerator, PdfGeneratorHandles } from './pdf-generator';
import { LanguageContext } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { cn } from '@/lib/utils';

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

const locales: { [key: string]: Locale } = { de, en: enUS };

const jobRowColors: Record<Job, string> = {
    job1: 'bg-blue-50 hover:bg-blue-100',
};

export function TimesheetList({ entries, deleteEntry, userName, overtimeOption, setOvertimeOption, monthlySummary }: TimesheetListProps) {
  const pdfGeneratorRef = useRef<PdfGeneratorHandles | null>(null);
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  const locale = locales[language] || enUS;

  const now = new Date();
  const monthName = format(now, 'LLLL yyyy', { locale });

  const monthlyEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    });
  }, [entries, now]);
  
  const addDownloadToHistory = () => {
    const newHistoryEntry: DownloadHistoryEntry = {
        id: new Date().toISOString(),
        userName: userName,
        monthName: monthName,
        downloadDate: new Date(),
        entries: monthlyEntries,
        monthlySummary: monthlySummary,
        overtimeOption: overtimeOption,
        job: 'job1',
    };
    const history = JSON.parse(localStorage.getItem('download-history') || '[]');
    history.push(newHistoryEntry);
    localStorage.setItem('download-history', JSON.stringify(history));
  }

  const handleAction = (action: 'export' | 'share') => {
    addDownloadToHistory();
    const generator = pdfGeneratorRef.current;
    if (generator) {
      if (action === 'export') {
        generator.handleExportPDF();
      } else if (action === 'share') {
        generator.handleShare();
      }
    }
  };


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
  
  const hasEntries = monthlyEntries.length > 0;

  return (
    <>
    <Card className="w-full shadow-lg animate-in fade-in-50">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-headline">{t.loggedEntries}</CardTitle>
          <CardDescription>{t.recentWorkHours}</CardDescription>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" disabled={!hasEntries} onClick={() => handleAction('export')}>
              <FileType2 className="mr-2 h-4 w-4" />
              {t.exportPdf}
            </Button>
            {navigator.share && (
               <Button variant="outline" disabled={!hasEntries} onClick={() => handleAction('share')}>
                  <Share2 className="mr-2 h-4 w-4" />
                  {t.share}
              </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t.day}</TableHead>
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
          <div className="flex flex-col items-center mt-4 w-full">
            <Label className="font-bold mb-2">{t.overtimeOption}:</Label>
             <div className="flex items-center gap-4">
                <Button
                    variant={overtimeOption === 'payout' ? 'default' : 'outline'}
                    onClick={() => setOvertimeOption('payout')}
                    className={cn("w-32", overtimeOption === 'payout' && 'bg-green-600 hover:bg-green-700 text-white')}
                >
                    {t.payout}
                </Button>
                <Button
                    variant={overtimeOption === 'keep' ? 'default' : 'outline'}
                    onClick={() => setOvertimeOption('keep')}
                    className={cn("w-32", overtimeOption === 'keep' && 'bg-green-600 hover:bg-green-700 text-white')}
                >
                    {t.keep}
                </Button>
            </div>
          </div>
      </CardFooter>
    </Card>

    <PdfGenerator
        ref={pdfGeneratorRef}
        userName={userName}
        monthName={monthName}
        monthlyEntries={monthlyEntries}
        monthlySummary={monthlySummary}
        overtimeOption={overtimeOption}
        job='job1'
        tProp={t}
    />
    </>
  );
}
