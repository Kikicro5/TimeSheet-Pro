'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DownloadHistoryEntry } from '@/types';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DownloadCloud, Trash2 } from 'lucide-react';
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

export default function HistoryPage() {
  const [history, setHistory] = useState<DownloadHistoryEntry[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const savedHistory = localStorage.getItem('download-history');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory).map((h: any) => ({
        ...h,
        downloadDate: new Date(h.downloadDate),
      }));
      setHistory(parsedHistory.sort((a: any, b: any) => b.downloadDate.getTime() - a.downloadDate.getTime()));
    }
  }, []);
  
  const deleteHistoryEntry = (id: string) => {
    const updatedHistory = history.filter(entry => entry.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem('download-history', JSON.stringify(updatedHistory));
  };
  
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('download-history');
  }

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
       <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Button asChild variant="ghost" className="hover:bg-primary/90">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Natrag na početnu
                </Link>
            </Button>
            <h1 className="text-2xl font-bold font-headline">Povijest preuzimanja</h1>
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>Evidencija preuzimanja</CardTitle>
            <CardDescription>Ovdje se nalazi popis svih preuzetih i podijeljenih mjesečnih lista.</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mjesec</TableHead>
                    <TableHead>Ime i prezime</TableHead>
                    <TableHead>Datum preuzimanja</TableHead>
                    <TableHead className="text-right">Akcije</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{entry.monthName}</TableCell>
                      <TableCell>{entry.userName}</TableCell>
                      <TableCell>{format(entry.downloadDate, "dd.MM.yyyy 'u' HH:mm", { locale: hr })}</TableCell>
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
                                  Ova akcija će trajno izbrisati ovaj zapis iz povijesti.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Odustani</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteHistoryEntry(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Izbriši
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                       </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
                <div className="mt-4 flex justify-end">
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Očisti povijest
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Očistiti cijelu povijest?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Ova akcija se ne može poništiti. Trajno će izbrisati sve zapise o preuzimanju.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                             <AlertDialogFooter>
                                <AlertDialogCancel>Odustani</AlertDialogCancel>
                                <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  Očisti
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                 <div className="mx-auto bg-secondary rounded-full p-4 w-fit">
                    <DownloadCloud className="h-12 w-12 text-muted-foreground" />
                </div>
                <h3 className="mt-4 text-xl font-semibold">Nema zapisa</h3>
                <p className="text-muted-foreground">Još niste preuzeli nijednu listu.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
