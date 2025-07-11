'use client';

import { useState, useEffect, useRef, useContext } from 'react';
import Link from 'next/link';
import { DownloadHistoryEntry } from '@/types';
import { format } from 'date-fns';
import { hr, de, enUS, pl } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowLeft, DownloadCloud, Trash2, FileType2, Share2 } from 'lucide-react';
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
import { PdfGenerator } from '@/components/pdf-generator';
import { LanguageContext } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';
import { LanguageSwitcher } from '@/components/language-switcher';

interface HistoryPdfGeneratorHandles {
    handleExportPDF: () => void;
    handleShare: () => void;
}

const locales: { [key: string]: Locale } = { hr, de, en: enUS, pl };

export default function HistoryPage() {
  const [history, setHistory] = useState<DownloadHistoryEntry[]>([]);
  const [isClient, setIsClient] = useState(false);
  const pdfGeneratorRef = useRef<Record<string, HistoryPdfGeneratorHandles>>({});
  const { language } = useContext(LanguageContext);
  const t = translations[language];
  const locale = locales[language] || hr;

  useEffect(() => {
    setIsClient(true);
    const savedHistory = localStorage.getItem('download-history');
    if (savedHistory) {
      const parsedHistory = JSON.parse(savedHistory).map((h: any) => ({
        ...h,
        downloadDate: new Date(h.downloadDate),
        entries: h.entries ? h.entries.map((e: any) => ({ ...e, date: new Date(e.date) })) : []
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

  const handleExport = (id: string) => {
    pdfGeneratorRef.current[id]?.handleExportPDF();
  };

  const handleShare = (id: string) => {
    pdfGeneratorRef.current[id]?.handleShare();
  };

  if (!isClient) {
    return null; // or a loading skeleton
  }

  return (
    <>
    <div className="min-h-screen bg-background text-foreground">
       <header className="bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <Button asChild variant="ghost" className="hover:bg-primary/90">
                <Link href="/">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {t.backToHome}
                </Link>
            </Button>
            <h1 className="text-2xl font-bold font-headline">{t.downloadHistory}</h1>
            <LanguageSwitcher />
        </div>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <Card className="w-full shadow-lg">
          <CardHeader>
            <CardTitle>{t.downloadRecords}</CardTitle>
            <CardDescription>{t.historyDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            {history.length > 0 ? (
              <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.month}</TableHead>
                    <TableHead>{t.downloadDate}</TableHead>
                    <TableHead className="text-right">{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell className="font-medium">{format(new Date(entry.downloadDate), 'LLLL yyyy', { locale })}</TableCell>
                      <TableCell>{format(entry.downloadDate, `dd.MM.yyyy '${language === 'hr' ? 'u' : language === 'de' ? 'um' : 'at'}' HH:mm`, { locale })}</TableCell>
                       <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleExport(entry.id)} className="text-muted-foreground hover:text-primary">
                              <FileType2 className="h-4 w-4" />
                              <span className="sr-only">{t.exportPdf}</span>
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleShare(entry.id)} className="text-muted-foreground hover:text-primary">
                              <Share2 className="h-4 w-4" />
                              <span className="sr-only">{t.share}</span>
                          </Button>
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
                                  {t.deleteEntryConfirm}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteHistoryEntry(entry.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  {t.delete}
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
                                {t.clearHistory}
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>{t.clearHistoryConfirmTitle}</AlertDialogTitle>
                                <AlertDialogDescription>
                                    {t.clearHistoryConfirm}
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                             <AlertDialogFooter>
                                <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
                                <AlertDialogAction onClick={clearHistory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                  {t.clear}
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
                <h3 className="mt-4 text-xl font-semibold">{t.noRecords}</h3>
                <p className="text-muted-foreground">{t.noDownloadsYet}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
    {/* Render a hidden PDF generator for each history entry */}
    {history.map(entry => (
        <PdfGenerator
          key={entry.id}
          ref={el => {
              if (el) {
                  pdfGeneratorRef.current[entry.id] = el;
              }
          }}
          userName={entry.userName}
          monthName={format(new Date(entry.downloadDate), 'LLLL yyyy', { locale })}
          monthlyEntries={entry.entries}
          monthlySummary={entry.monthlySummary}
          overtimeOption={entry.overtimeOption}
        />
    ))}
    </>
  );
}
