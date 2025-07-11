'use client';

import { useRef, forwardRef, useImperativeHandle } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { TimeEntry, OvertimeOption } from '@/types';

interface PdfGeneratorProps {
  userName: string;
  monthName: string;
  monthlyEntries: TimeEntry[];
  monthlySummary: {
    totalWorkHours: number;
    totalOvertime: number;
    totalPause: number;
    vacationDays: number;
    holidayDays: number;
  };
  overtimeOption: OvertimeOption;
}

export const PdfGenerator = forwardRef(({
  userName,
  monthName,
  monthlyEntries = [],
  monthlySummary = { totalWorkHours: 0, totalOvertime: 0, totalPause: 0, vacationDays: 0, holidayDays: 0 },
  overtimeOption,
}: PdfGeneratorProps, ref) => {
  const pdfRef = useRef<HTMLDivElement>(null);

  const generatePdfInstance = async () => {
      const input = pdfRef.current;
      if (!input) return null;

      input.style.display = 'block';
      input.style.position = 'absolute';
      input.style.left = '-9999px';
      
      const canvas = await html2canvas(input, { scale: 2 });
      
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
      return pdf;
  }

  useImperativeHandle(ref, () => ({
    handleExportPDF: async () => {
      const pdf = await generatePdfInstance();
      if (pdf) {
        pdf.save(`lista_sati_${userName.replace(' ','_')}_${monthName.replace(' ','_')}.pdf`);
      }
    },
    handleShare: async () => {
      if (!navigator.share) {
        alert('Dijeljenje nije podržano na ovom pregledniku.');
        return;
      }
      
      const pdf = await generatePdfInstance();
      if (!pdf) return;

      try {
          const pdfBlob = pdf.output('blob');
          const pdfFile = new File(
              [pdfBlob], 
              `lista_sati_${userName.replace(' ','_')}_${monthName.replace(' ','_')}.pdf`, 
              { type: 'application/pdf' }
          );

          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
              await navigator.share({
                  title: `Lista sati za ${monthName}`,
                  text: `Mjesečna lista sati za ${userName} za ${monthName}.`,
                  files: [pdfFile],
              });
          } else {
             alert('Dijeljenje PDF datoteka nije podržano na ovom uređaju.');
          }
      } catch (error) {
          console.error('Greška pri dijeljenju:', error);
          alert('Došlo je do greške prilikom pokušaja dijeljenja.');
      }
    }
  }));

  return (
    <div ref={pdfRef} style={{ display: 'none', width: '210mm', minHeight: '297mm', padding: '10mm' }} className="bg-white text-black text-xs">
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-800">
        <h1 className="text-sm font-bold">{userName}</h1>
        <h2 className="text-sm text-gray-700">{monthName}</h2>
      </div>
      <table className="w-full text-xs border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-1 align-middle">Datum</th>
            <th className="border border-gray-300 p-1 align-middle">Početak</th>
            <th className="border border-gray-300 p-1 align-middle">Kraj</th>
            <th className="border border-gray-300 p-1 align-middle">Pauza (min)</th>
            <th className="border border-gray-300 p-1 align-middle">Radni sati</th>
            <th className="border border-gray-300 p-1 align-middle">Prekovremeni</th>
          </tr>
        </thead>
        <tbody>
          {monthlyEntries.map(entry => {
            if (entry.isVacation) {
                return (
                    <tr key={entry.id} className="text-center bg-blue-100">
                        <td className="border border-gray-300 p-1 align-middle">{format(new Date(entry.date), 'dd.MM.yyyy')}</td>
                        <td colSpan={5} className="border border-gray-300 p-1 font-semibold align-middle">Godišnji odmor</td>
                    </tr>
                )
            }
            if (entry.isHoliday) {
                return (
                    <tr key={entry.id} className="text-center bg-green-100">
                        <td className="border border-gray-300 p-1 align-middle">{format(new Date(entry.date), 'dd.MM.yyyy')}</td>
                        <td colSpan={5} className="border border-gray-300 p-1 font-semibold align-middle">Praznik</td>
                    </tr>
                )
            }
            const overtimeHours = typeof entry.overtimeHours === 'number' ? entry.overtimeHours : 0;
            const totalHours = typeof entry.totalHours === 'number' ? entry.totalHours : 0;
            return (
              <tr key={entry.id} className="text-center">
                <td className="border border-gray-300 p-1 align-middle">{format(new Date(entry.date), 'dd.MM.yyyy')}</td>
                <td className="border border-gray-300 p-1 align-middle">{entry.startTime}</td>
                <td className="border border-gray-300 p-1 align-middle">{entry.endTime}</td>
                <td className="border border-gray-300 p-1 align-middle">{entry.pause}</td>
                <td className="border border-gray-300 p-1 align-middle">{totalHours.toFixed(2)}h</td>
                <td className="border border-gray-300 p-1 align-middle">{overtimeHours.toFixed(2)}h</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="mt-4 pt-2 border-t">
        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
          <div className="flex justify-between"><p>Ukupno radnih sati:</p> <p className="font-bold">{monthlySummary.totalWorkHours.toFixed(2)}h</p></div>
          <div className="flex justify-between"><p>Ukupno prekovremenih:</p> <p className="font-bold">{monthlySummary.totalOvertime.toFixed(2)}h</p></div>
          <div className="flex justify-between"><p>Ukupno pauze:</p> <p className="font-bold">{monthlySummary.totalPause} min</p></div>
          <div className="flex justify-between"><p>Dani godišnjeg:</p> <p className="font-bold">{monthlySummary.vacationDays}</p></div>
          <div className="flex justify-between"><p>Praznici:</p> <p className="font-bold">{monthlySummary.holidayDays}</p></div>
        </div>
      </div>
       <div className="mt-2 pt-1 border-t">
         <p><strong>Prekovremeni:</strong> {overtimeOption === 'payout' ? 'Isplata' : 'Ostaje'}</p>
       </div>
    </div>
  );
});

PdfGenerator.displayName = 'PdfGenerator';
