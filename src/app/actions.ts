'use server';

import { suggestWorkLocation } from '@/ai/flows/suggest-work-location';

export async function getAISuggestion(timeOfDay: string) {
  try {
    // In a real app, you'd fetch this from a calendar API
    const mockCalendarEvents = `
      - 10:00 AM - 11:00 AM: Project A-Team Sync @ Main Office
      - 02:00 PM - 03:00 PM: Client Meeting @ Client Site X
    `;

    const suggestion = await suggestWorkLocation({
      calendarEvents: mockCalendarEvents,
      timeOfDay,
    });

    return { success: true, location: suggestion.suggestedLocation, reason: suggestion.reason };
  } catch (error) {
    console.error('Error getting AI suggestion:', error);
    return { success: false, error: 'Failed to get suggestion from AI.' };
  }
}
