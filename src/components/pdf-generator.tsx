'use client';

import { useRef, forwardRef, useImperativeHandle, useContext } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { format } from 'date-fns';
import { TimeEntry, OvertimeOption, Job } from '@/types';
import { LanguageContext } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

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
  job?: Job;
}

const jobColors: Record<Job, string> = {
    job1: '#e0f2fe', // blue-100
    job2: '#dcfce7', // green-100
};

export const PdfGenerator = forwardRef(({
  userName,
  monthName,
  monthlyEntries = [],
  monthlySummary = { totalWorkHours: 0, totalOvertime: 0, totalPause: 0, vacationDays: 0, holidayDays: 0 },
  overtimeOption,
  job,
}: PdfGeneratorProps, ref) => {
  const pdfRef = useRef<HTMLDivElement>(null);
  const { language } = useContext(LanguageContext);
  const t = translations[language];

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
        pdf.save(`stundenzettel_${userName.replace(' ','_')}_${monthName.replace(' ','_')}${job ? `_${t[job].replace(' ', '_')}` : ''}.pdf`);
      }
    },
    handleShare: async () => {
      if (!navigator.share) {
        alert(t.sharingNotSupported);
        return;
      }
      
      const pdf = await generatePdfInstance();
      if (!pdf) return;

      const pdfFileName = `stundenzettel_${userName.replace(' ','_')}_${monthName.replace(' ','_')}${job ? `_${t[job].replace(' ', '_')}` : ''}.pdf`;

      try {
          const pdfBlob = pdf.output('blob');
          const pdfFile = new File(
              [pdfBlob], 
              pdfFileName,
              { type: 'application/pdf' }
          );

          if (navigator.canShare && navigator.canShare({ files: [pdfFile] })) {
              await navigator.share({
                  title: `${t.timeSheetFor} ${monthName}`,
                  text: `${t.monthlyTimeSheetFor} ${userName} ${t.for} ${monthName}.`,
                  files: [pdfFile],
              });
          } else {
             alert(t.sharingPdfNotSupported);
          }
      } catch (error) {
          console.error('Sharing error:', error);
          alert(t.sharingError);
      }
    }
  }));

  const jobTitle = job ? t[job] : '';
  const title = `${t.timeSheetFor} ${monthName} ${jobTitle ? `- ${jobTitle}` : ''}`

  return (
    <div ref={pdfRef} style={{ display: 'none', width: '210mm', minHeight: '297mm', padding: '10mm' }} className="bg-white text-black text-xs">
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-gray-800">
        <h1 className="text-sm font-bold">{userName}</h1>
        <h2 className="text-sm text-gray-700">{title}</h2>
      </div>
      <table className="w-full text-xs border-collapse border border-gray-400">
        <thead>
          <tr className="bg-gray-200">
            <th className="border border-gray-300 p-1 align-middle">{t.date}</th>
            <th className="border border-gray-300 p-1 align-middle">{t.job}</th>
            <th className="border border-gray-300 p-1 align-middle">{t.startTime}</th>
            <th className="border border-gray-300 p-1 align-middle">{t.endTime}</th>
            <th className="border border-gray-300 p-1 align-middle">{t.pausePdf}</th>
            <th className="border border-gray-300 p-1 align-middle">{t.workHours}</th>
            <th className="border border-gray-300 p-1 align-middle">{t.overtime}</th>
          </tr>
        </thead>
        <tbody>
          {monthlyEntries.map(entry => {
            if (entry.isVacation) {
                return (
                    <tr key={entry.id} className="text-center" style={{ backgroundColor: '#e0f2fe' }}>
                        <td className="border border-gray-300 p-1 align-middle">{format(new Date(entry.date), 'dd.MM.yyyy')}</td>
                        <td colSpan={6} className="border border-gray-300 p-1 font-semibold align-middle">{t.vacation}</td>
                    </tr>
                )
            }
            if (entry.isHoliday) {
                return (
                    <tr key={entry.id} className="text-center" style={{ backgroundColor: '#dcfce7' }}>
                        <td className="border border-gray-300 p-1 align-middle">{format(new Date(entry.date), 'dd.MM.yyyy')}</td>
                        <td colSpan={6} className="border border-gray-300 p-1 font-semibold align-middle">{t.holiday}</td>
                    </tr>
                )
            }
            const overtimeHours = typeof entry.overtimeHours === 'number' ? entry.overtimeHours : 0;
            const totalHours = typeof entry.totalHours === 'number' ? entry.totalHours : 0;
            const rowStyle = { backgroundColor: jobColors[entry.job] || 'transparent' };
            return (
              <tr key={entry.id} className="text-center" style={rowStyle}>
                <td className="border border-gray-300 p-1 align-middle">{format(new Date(entry.date), 'dd.MM.yyyy')}</td>
                <td className="border border-gray-300 p-1 align-middle">{t[entry.job]}</td>
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
          <div className="flex justify-between"><p>{t.totalWorkHours}:</p> <p className="font-bold">{monthlySummary.totalWorkHours.toFixed(2)}h</p></div>
          <div className="flex justify-between"><p>{t.totalOvertime}:</p> <p className="font-bold">{monthlySummary.totalOvertime.toFixed(2)}h</p></div>
          <div className="flex justify-between"><p>{t.totalPause}:</p> <p className="font-bold">{monthlySummary.totalPause} min</p></div>
          <div className="flex justify-between"><p>{t.vacationDays}:</p> <p className="font-bold">{monthlySummary.vacationDays}</p></div>
          <div className="flex justify-between"><p>{t.holidays}:</p> <p className="font-bold">{monthlySummary.holidayDays}</p></div>
        </div>
      </div>
       <div className="mt-2 pt-1 border-t">
         <p><strong>{t.overtime}:</strong> {overtimeOption === 'payout' ? t.payout : t.keep}</p>
       </div>
    </div>
  );
});

PdfGenerator.displayName = 'PdfGenerator';
