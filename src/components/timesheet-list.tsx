'use client';

import { useMemo } from 'react';
import { format } from 'date-fns';
import { TimeEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from '@/components/ui/table';
import { FileDown, Trash2, CalendarDays } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

interface TimesheetListProps {
  entries: TimeEntry[];
  deleteEntry: (id: string) => void;
}

export function TimesheetList({ entries, deleteEntry }: TimesheetListProps) {
  const handleExport = () => {
    const headers = ['Date', 'Start Time', 'End Time', 'Pause (min)', 'Total Hours', 'Location'];
    const csvContent = [
      headers.join(','),
      ...entries.map(e =>
        [
          format(e.date, 'yyyy-MM-dd'),
          e.startTime,
          e.endTime,
          e.pause,
          e.totalHours.toFixed(2),
          `"${e.location.replace(/"/g, '""')}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `timesheet_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };
  
  const dailyTotals = useMemo(() => {
    const totals = new Map<string, number>();
    entries.forEach(entry => {
      const dateKey = format(entry.date, 'yyyy-MM-dd');
      const currentTotal = totals.get(dateKey) || 0;
      totals.set(dateKey, currentTotal + entry.totalHours);
    });
    return totals;
  }, [entries]);

  if (entries.length === 0) {
    return (
      <Card className="w-full text-center py-16 shadow-lg animate-in fade-in-50">
        <CardHeader>
           <div className="mx-auto bg-secondary rounded-full p-4 w-fit">
            <CalendarDays className="h-12 w-12 text-muted-foreground" />
           </div>
          <CardTitle className="mt-4 text-2xl font-headline">No Entries Yet</CardTitle>
          <CardDescription>Add your first time entry using the form above.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  
  return (
    <Card className="w-full shadow-lg animate-in fade-in-50">
      <CardHeader className="flex-row items-center justify-between">
        <div>
          <CardTitle className="text-2xl font-headline">Logged Entries</CardTitle>
          <CardDescription>A list of your recent work hours.</CardDescription>
        </div>
        <Button onClick={handleExport} variant="outline" disabled={entries.length === 0}>
          <FileDown className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Start</TableHead>
              <TableHead>End</TableHead>
              <TableHead>Pause</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Total Hours</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map(entry => (
              <TableRow key={entry.id} className="animate-in fade-in-25">
                <TableCell className="font-medium">{format(entry.date, 'MMM d, yyyy')}</TableCell>
                <TableCell>{entry.startTime}</TableCell>
                <TableCell>{entry.endTime}</TableCell>
                <TableCell>{entry.pause} min</TableCell>
                <TableCell><div className="max-w-[200px] truncate">{entry.location}</div></TableCell>
                <TableCell className="text-right font-mono">{entry.totalHours.toFixed(2)}h</TableCell>
                <TableCell className="text-right">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete entry</span>
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete this time entry.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteEntry(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
           {entries.length > 0 && (
             <TableCaption>
                Total hours per day: {Array.from(dailyTotals.entries()).map(([date, total]) => `${format(new Date(date), 'MMM d')}: ${total.toFixed(2)}h`).join(', ')}
             </TableCaption>
           )}
        </Table>
      </CardContent>
    </Card>
  );
}
