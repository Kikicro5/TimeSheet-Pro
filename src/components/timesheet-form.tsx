'use client';

import { useState, useEffect, useContext } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon, Clock, Coffee, MapPin, Plane, PartyPopper, User } from 'lucide-react';
import { LanguageContext } from '@/contexts/LanguageContext';
import { translations } from '@/lib/translations';

const formSchema = z.object({
  userName: z.string().min(1, 'Ime i prezime je obavezno.'),
  date: z.date({ required_error: 'A date is required.' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  pause: z.coerce.number().min(0, 'Pause cannot be negative.'),
  location: z.string().min(1, 'Location is required.'),
});

type TimesheetFormValues = z.infer<typeof formSchema>;

interface TimesheetFormProps {
  addEntry: (data: Omit<TimesheetFormValues, 'userName'> & { isVacation?: boolean; isHoliday?: boolean }) => void;
  userName: string;
  setUserName: (name: string) => void;
}

export function TimesheetForm({ addEntry, userName, setUserName }: TimesheetFormProps) {
  const { toast } = useToast();
  const { language } = useContext(LanguageContext);
  const t = translations[language];

  const form = useForm<TimesheetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userName: userName,
      date: new Date(),
      startTime: '07:00',
      endTime: '16:00',
      pause: 60,
      location: '',
    },
  });

  useEffect(() => {
    form.setValue('userName', userName);
  }, [userName, form]);

  function onSubmit(data: TimesheetFormValues) {
    const { userName, ...entryData } = data;
    setUserName(userName);
    addEntry(entryData);
    toast({
        title: t.entryAdded,
        description: `${t.workOn} ${format(data.date, 'PPP')} ${t.hasBeenLogged}.`,
    })
    form.reset({
        ...data,
        date: new Date(),
        startTime: '07:00',
        endTime: '16:00',
        pause: 60,
        location: '', 
    });
  }

  const handleAddSpecialDay = (isVacation: boolean) => {
    const { date, userName } = form.getValues();
    if (!date) {
        toast({ variant: 'destructive', title: t.error, description: t.pleaseSelectDate });
        return;
    }
     setUserName(userName);
    addEntry({
        date: date,
        startTime: '',
        endTime: '',
        pause: 0,
        location: '',
        isVacation: isVacation,
        isHoliday: !isVacation
    });
    toast({
        title: isVacation ? t.vacationAdded : t.holidayAdded,
        description: `${t.day} ${format(date, 'PPP')} ${t.hasBeenLoggedAs} ${isVacation ? t.vacation.toLowerCase() : t.holiday.toLowerCase()}.`,
    });
  }

  return (
    <Card className="w-full shadow-lg animate-in fade-in-50">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">{t.newTimeEntry}</CardTitle>
        <CardDescription>{t.fillInWorkDetails}</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="userName"
              render={({ field }) => (
                <FormItem className="sm:col-span-2 lg:col-span-3">
                  <FormLabel>{t.nameAndSurname}</FormLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder={t.namePlaceholder} className="pl-10" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>{t.date}</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {field.value ? format(field.value, 'PPP') : <span>{t.pickADate}</span>}
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.startTime}</FormLabel>
                   <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="time" className="pl-10" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="endTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.endTime}</FormLabel>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="time" className="pl-10" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="pause"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t.pause}</FormLabel>
                  <div className="relative">
                    <Coffee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input type="number" className="pl-10" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="location"
              render={({ field }) => (
                <FormItem className="lg:col-span-2">
                  <FormLabel>{t.location}</FormLabel>
                  <div className="relative flex-grow">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder={t.locationPlaceholder} className="pl-10" {...field} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end gap-2 flex-wrap">
             <Button type="button" variant="outline" onClick={() => handleAddSpecialDay(true)}>
                <Plane className="mr-2 h-4 w-4"/>
                {t.addVacation}
             </Button>
             <Button type="button" variant="outline" onClick={() => handleAddSpecialDay(false)}>
                <PartyPopper className="mr-2 h-4 w-4"/>
                {t.addHoliday}
             </Button>
             <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">{t.saveEntry}</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
