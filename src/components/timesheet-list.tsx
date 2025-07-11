'use client';

import { useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { TimeEntry, OvertimeOption } from '@/types';
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
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

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
  const pdfRef = useRef<HTMLDivElement>(null);

  const now = new Date();
  const monthName = format(now, 'LLLL yyyy', { locale: hr });

  const monthlyEntries = useMemo(() => {
    return entries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate.getMonth() === now.getMonth() && entryDate.getFullYear() === now.getFullYear();
    });
  }, [entries, now]);

  const handleExportPDF = async () => {
    const input = pdfRef.current;
    if (!input) return;

    // Temporarily make the hidden div visible for capturing
    input.style.display = 'block';
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    
    const canvas = await html2canvas(input, { scale: 2 });
    
    // Hide it back
    input.style.display = 'none';
    input.style.position = 'static';
    input.style.left = '0';

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    const imgX = (pdfWidth - imgWidth * ratio) / 2;
    const imgY = 15;

    pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);
    pdf.save(`lista_sati_${userName.replace(' ','_')}_${monthName}.pdf`);
  };

  const handleShare = async () => {
    const input = pdfRef.current;
    if (!input || !navigator.share) {
      alert('Dijeljenje nije podržano na ovom pregledniku.');
      return;
    }

    input.style.display = 'block';
    input.style.position = 'absolute';
    input.style.left = '-9999px';

    try {
        const canvas = await html2canvas(input, { scale: 2 });
        input.style.display = 'none';
        input.style.position = 'static';
        input.style.left = '0';

        canvas.toBlob(async (blob) => {
            if (!blob) return;
            const file = new File([blob], `lista_sati_${userName.replace(' ','_')}_${monthName}.png`, { type: 'image/png' });
            await navigator.share({
                title: `Lista sati za ${monthName}`,
                text: `Mjesečna lista sati za ${userName} za ${monthName}.`,
                files: [file],
            });
        }, 'image/png');
    } catch (error) {
        console.error('Greška pri dijeljenju:', error);
        input.style.display = 'none';
        input.style.position = 'static';
        input.style.left = '0';
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
                <TableCell className="font-medium">{format(entry.date, 'dd.MM.yyyy')}</TableCell>
                <TableCell>{entry.isVacation || entry.isHoliday ? '-' : entry.startTime}</TableCell>
                <TableCell>{entry.isVacation || entry.isHoliday ? '-' : entry.endTime}</TableCell>
                <TableCell>{entry.isVacation || entry.isHoliday ? '-' : `${entry.pause} min`}</TableCell>
                <TableCell><div className="max-w-[200px] truncate">{entry.location}</div></TableCell>
                <TableCell className={`text-right font-mono ${overtimeHours >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {entry.isVacation || entry.isHoliday ? '-' : `${overtimeHours.toFixed(2)}h`}
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
      <CardFooter className="flex-col items-start gap-4">
          <div className="w-full">
            <h3 className="font-bold text-lg mb-2">Mjesečni sažetak ({monthName})</h3>
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
          <div>
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

    {/* Hidden div for PDF export */}
    <div ref={pdfRef} style={{ display: 'none' }} className="p-8 bg-white text-black">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold">Mjesečna lista sati</h1>
        <h2 className="text-xl mt-2">{userName}</h2>
        <h3 className="text-lg text-gray-600">{monthName}</h3>
      </div>
      <table className="w-full text-sm border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-2">Datum</th>
            <th className="border border-gray-300 p-2">Početak</th>
            <th className="border border-gray-300 p-2">Kraj</th>
            <th className="border border-gray-300 p-2">Pauza (min)</th>
            <th className="border border-gray-300 p-2">Radni sati</th>
            <th className="border border-gray-300 p-2">Prekovremeni</th>
          </tr>
        </thead>
        <tbody>
          {monthlyEntries.map(entry => {
            if (entry.isVacation) {
                return (
                    <tr key={entry.id} className="text-center bg-blue-100">
                        <td className="border border-gray-300 p-2">{format(entry.date, 'dd.MM.yyyy')}</td>
                        <td colSpan={5} className="border border-gray-300 p-2 font-semibold">Godišnji odmor</td>
                    </tr>
                )
            }
            if (entry.isHoliday) {
                return (
                    <tr key={entry.id} className="text-center bg-green-100">
                        <td className="border border-gray-300 p-2">{format(entry.date, 'dd.MM.yyyy')}</td>
                        <td colSpan={5} className="border border-gray-300 p-2 font-semibold">Praznik</td>
                    </tr>
                )
            }
            const overtimeHours = typeof entry.overtimeHours === 'number' ? entry.overtimeHours : 0;
            const totalHours = typeof entry.totalHours === 'number' ? entry.totalHours : 0;
            return (
              <tr key={entry.id} className="text-center">
                <td className="border border-gray-300 p-2">{format(entry.date, 'dd.MM.yyyy')}</td>
                <td className="border border-gray-300 p-2">{entry.startTime}</td>
                <td className="border border-gray-300 p-2">{entry.endTime}</td>
                <td className="border border-gray-300 p-2">{entry.pause}</td>
                <td className="border border-gray-300 p-2">{totalHours.toFixed(2)}h</td>
                <td className="border border-gray-300 p-2">{overtimeHours.toFixed(2)}h</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="mt-6 border-t pt-4">
        <h3 className="text-xl font-bold mb-2">Sažetak</h3>
        <div className="grid grid-cols-2 gap-4">
          <p><strong>Ukupno radnih sati:</strong> {monthlySummary.totalWorkHours.toFixed(2)}h</p>
          <p><strong>Ukupno prekovremenih:</strong> {monthlySummary.totalOvertime.toFixed(2)}h</p>
          <p><strong>Ukupno pauze:</strong> {monthlySummary.totalPause} min</p>
          <p><strong>Dani godišnjeg:</strong> {monthlySummary.vacationDays}</p>
          <p><strong>Praznici:</strong> {monthlySummary.holidayDays}</p>
        </div>
      </div>
       <div className="mt-4">
         <p><strong>Opcija za prekovremene:</strong> {overtimeOption === 'payout' ? 'Isplata' : 'Ostaje'}</p>
       </div>
    </div>
    </>
  );
}
