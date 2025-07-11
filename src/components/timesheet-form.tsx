'use client';

import { useState } from 'react';
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
import { Calendar as CalendarIcon, Clock, Coffee, MapPin, Sparkles, Loader2 } from 'lucide-react';
import { getAISuggestion } from '@/app/actions';

const formSchema = z.object({
  date: z.date({ required_error: 'A date is required.' }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  pause: z.coerce.number().min(0, 'Pause cannot be negative.'),
  location: z.string().min(1, 'Location is required.'),
}).refine(data => {
    const start = new Date(`1970-01-01T${data.startTime}:00`);
    const end = new Date(`1970-01-01T${data.endTime}:00`);
    return end.getTime() > start.getTime();
}, {
  message: "End time must be after start time for same-day entries.",
  path: ["endTime"],
});

type TimesheetFormValues = z.infer<typeof formSchema>;

interface TimesheetFormProps {
  addEntry: (data: TimesheetFormValues) => void;
}

export function TimesheetForm({ addEntry }: TimesheetFormProps) {
  const { toast } = useToast();
  const [isSuggesting, setIsSuggesting] = useState(false);

  const form = useForm<TimesheetFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: new Date(),
      startTime: '09:00',
      endTime: '17:00',
      pause: 30,
      location: '',
    },
  });

  const handleSuggestLocation = async () => {
    setIsSuggesting(true);
    const time = form.getValues('startTime');
    const result = await getAISuggestion(time);
    setIsSuggesting(false);

    if (result.success && result.location) {
      form.setValue('location', result.location, { shouldValidate: true });
      toast({
        title: "AI Suggestion ✨",
        description: result.reason,
      });
    } else {
      toast({
        variant: 'destructive',
        title: 'Suggestion Failed',
        description: result.error || 'Could not fetch a location suggestion.',
      });
    }
  };

  function onSubmit(data: TimesheetFormValues) {
    addEntry(data);
    toast({
        title: "Entry Added",
        description: `Your work on ${format(data.date, 'PPP')} has been logged.`,
    })
    form.reset({
        ...data,
        location: '', // reset location for next entry
        startTime: data.endTime, // set next start time to previous end time
    });
  }

  return (
    <Card className="w-full shadow-lg animate-in fade-in-50">
      <CardHeader>
        <CardTitle className="text-2xl font-headline">New Time Entry</CardTitle>
        <CardDescription>Fill in your work details for the day.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Date</FormLabel>
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
                          {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
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
                  <FormLabel>Start Time</FormLabel>
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
                  <FormLabel>End Time</FormLabel>
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
                  <FormLabel>Pause (minutes)</FormLabel>
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
                  <FormLabel>Location</FormLabel>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <FormControl>
                        <Input placeholder="e.g., Main Office" className="pl-10" {...field} />
                      </FormControl>
                    </div>
                    <Button type="button" variant="outline" size="icon" onClick={handleSuggestLocation} disabled={isSuggesting} aria-label="Suggest Location">
                      {isSuggesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="flex justify-end">
             <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Save Entry</Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
