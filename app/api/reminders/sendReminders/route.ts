import { NextResponse } from 'next/server';
import { getGoalsDueToday } from '@/lib/airtable';
import { sendReminderEmail } from '@/lib/email';

type Goal = {
  id: string;
  Goal: string;
  'Target Date': string;
  Status: 'pending' | 'completed' | 'incomplete';
  Email: string;
  'Created At'?: string;
  'Updated At'?: string;
  userId?: string;
  UserName?: string;
};

export async function GET() {
  try {
    // Get goals due today with pending status
    const goalsDueToday = await getGoalsDueToday() as Goal[];
    
    if (goalsDueToday.length === 0) {
      return NextResponse.json({ success: true, message: 'No reminders to send today' });
    }
    
    // Send email for each goal
    const results = await Promise.all(
      goalsDueToday.map(async (goal) => {
        const result = await sendReminderEmail(goal);
        return {
          goal: goal.Goal,
          email: goal.Email,
          sent: !!result,
        };
      })
    );
    
    return NextResponse.json({
      success: true,
      message: `Sent ${results.filter(r => r.sent).length} reminders`,
      results,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 