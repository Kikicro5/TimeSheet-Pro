'use client';

import { useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { TimeEntry, OvertimeOption, DownloadHistoryEntry } from '@/types';
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

export function TimesheetList({ entries, deleteEntry, userName, overtimeOption, setOvertimeOption, monthlySummary }: TimesheetListProps) {
  const pdfGeneratorRef = useRef<{ handleExportPDF: () => void; handleShare: () => void }>(null);

  const now = new Date();
  const monthName = format(now, 'LLLL yyyy', { locale: hr });

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
    };
    const history = JSON.parse(localStorage.getItem('download-history') || '[]');
    history.push(newHistoryEntry);
    localStorage.setItem('download-history', JSON.stringify(history));
  }

  const handleExportPDF = () => {
    if (pdfGeneratorRef.current) {
      pdfGeneratorRef.current.handleExportPDF();
      addDownloadToHistory();
    }
  };

  const handleShare = () => {
    if (pdfGeneratorRef.current) {
      pdfGeneratorRef.current.handleShare();
      addDownloadToHistory();
    }
  };


  if (entries.length === 0) {
    return (
      <Card className="w-full text-center py-16 shadow-lg animate-in fade-in-50">
        <CardHeader>
           <div className="mx-auto bg-secondary rounded-full p-4 w-fit">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
           </div>
          <CardTitle className="mt-4 text-2xl font-headline">Nema unosa</CardTitle>
          <CardDescription>Dodajte svoj prvi unos koristeći obrazac iznad.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <>
    <Card className="w-full shadow-lg animate-in fade-in-50">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-headline">Zabilježeni unosi</CardTitle>
          <CardDescription>Popis vaših nedavnih radnih sati.</CardDescription>
        </div>
        <div className="flex gap-2">
            <Button onClick={handleExportPDF} variant="outline" disabled={monthlyEntries.length === 0}>
                <FileType2 className="mr-2 h-4 w-4" />
                Izvezi PDF
            </Button>
            {navigator.share && (
                <Button onClick={handleShare} variant="outline" disabled={monthlyEntries.length === 0}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Podijeli
                </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Datum</TableHead>
              <TableHead>Početak</TableHead>
              <TableHead>Kraj</TableHead>
              <TableHead>Pauza</TableHead>
              <TableHead>Lokacija</TableHead>
              <TableHead className="text-right">Prekovremeni</TableHead>
              <TableHead className="text-right w-[100px]">Akcije</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(entry => {
              const overtimeHours = typeof entry.overtimeHours === 'number' ? entry.overtimeHours : 0;
              const rowClass = entry.isVacation ? 'bg-blue-50 hover:bg-blue-100' : entry.isHoliday ? 'bg-green-50 hover:bg-green-100' : '';
              return (
              <TableRow key={entry.id} className={`animate-in fade-in-25 ${rowClass}`}>
                <TableCell className="font-medium">{format(new Date(entry.date), 'dd.MM.yyyy')}</TableCell>
                <TableCell>{entry.isVacation || entry.isHoliday ? '-' : entry.startTime}</TableCell>
                <TableCell>{entry.isVacation || entry.isHoliday ? '-' : entry.endTime}</TableCell>
                <TableCell>{entry.isVacation || entry.isHoliday ? '-' : `${entry.pause} min`}</TableCell>
                <TableCell><div className="max-w-[200px] truncate">{entry.location}</div></TableCell>
                <TableCell className={`text-right font-mono ${overtimeHours >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.isVacation || entry.isHoliday ? '-' : overtimeHours.toFixed(2) + 'h'}
                </TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Izbriši unos</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Jeste li sigurni?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ova akcija se ne može poništiti. Trajno će izbrisati ovaj unos.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Odustani</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteEntry(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Izbriši
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
            <h3 className="font-bold text-lg mb-2 text-center">Mjesečni sažetak ({monthName})</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-sm">
                <div className="bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground">Ukupno radnih sati</p>
                    <p className="font-bold text-base">{monthlySummary.totalWorkHours.toFixed(2)}h</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground">Ukupno prekovremenih</p>
                    <p className={`font-bold text-base ${monthlySummary.totalOvertime >= 0 ? 'text-green-600' : 'text-red-600'}`}>{monthlySummary.totalOvertime.toFixed(2)}h</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground">Ukupno pauze</p>
                    <p className="font-bold text-base">{monthlySummary.totalPause} min</p>
                </div>
                 <div className="bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground">Dani godišnjeg</p>
                    <p className="font-bold text-base">{monthlySummary.vacationDays}</p>
                </div>
                <div className="bg-muted p-2 rounded-md">
                    <p className="text-muted-foreground">Praznici</p>
                    <p className="font-bold text-base">{monthlySummary.holidayDays}</p>
                </div>
            </div>
          </div>
          <div className="flex flex-col items-center mt-4">
            <Label className="font-bold">Opcija za prekovremene:</Label>
             <RadioGroup
                value={overtimeOption}
                onValueChange={(value: OvertimeOption) => setOvertimeOption(value)}
                className="flex items-center gap-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="payout" id="payout" />
                <Label htmlFor="payout">Isplata</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="keep" id="keep" />
                <Label htmlFor="keep">Ostaje</Label>
              </div>
            </RadioGroup>
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
    />
    </>
  );
}