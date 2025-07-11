// src/ai/flows/suggest-work-location.ts
'use server';

/**
 * @fileOverview Provides work location suggestions based on calendar events and time of day.
 *
 * - suggestWorkLocation - A function that suggests work locations.
 * - SuggestWorkLocationInput - The input type for the suggestWorkLocation function.
 * - SuggestWorkLocationOutput - The return type for the suggestWorkLocation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestWorkLocationInputSchema = z.object({
  calendarEvents: z
    .string()
    .describe(
      'A list of calendar events for the day, including titles and times.'
    ),
  timeOfDay: z.string().describe('The current time of day (e.g., 9:00 AM).'),
});
export type SuggestWorkLocationInput = z.infer<typeof SuggestWorkLocationInputSchema>;

const SuggestWorkLocationOutputSchema = z.object({
  suggestedLocation: z
    .string()
    .describe('The suggested work location based on the calendar events and time of day.'),
  reason: z.string().describe('The reason for the suggested location.'),
});
export type SuggestWorkLocationOutput = z.infer<typeof SuggestWorkLocationOutputSchema>;

export async function suggestWorkLocation(input: SuggestWorkLocationInput): Promise<SuggestWorkLocationOutput> {
  return suggestWorkLocationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestWorkLocationPrompt',
  input: {schema: SuggestWorkLocationInputSchema},
  output: {schema: SuggestWorkLocationOutputSchema},
  prompt: `You are an AI assistant designed to suggest work locations for users filling out their timesheets.

  Based on the user's calendar events and the current time of day, suggest the most likely work location.

  Calendar Events: {{{calendarEvents}}}
  Time of Day: {{{timeOfDay}}}

  Suggest a work location and provide a brief reason for the suggestion.
  Follow the output schema strictly.
  `,
});

const suggestWorkLocationFlow = ai.defineFlow(
  {
    name: 'suggestWorkLocationFlow',
    inputSchema: SuggestWorkLocationInputSchema,
    outputSchema: SuggestWorkLocationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
