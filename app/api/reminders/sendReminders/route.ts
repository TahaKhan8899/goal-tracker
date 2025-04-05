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
      return NextResponse.json({ 
        success: true, 
        message: 'No reminders to send today'
      });
    }
    
    // Send email for each goal
    const results = await Promise.all(
      goalsDueToday.map(async (goal) => {
        try {
          const result = await sendReminderEmail(goal);
          console.log(`Reminder email sent to ${goal.Email} for goal: ${goal.Goal}`);
          return {
            goal: goal.Goal,
            email: goal.Email,
            sent: !!result
          };
        } catch (error) {
          return {
            goal: goal.Goal,
            email: goal.Email,
            sent: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
        }
      })
    );
    
    return NextResponse.json({
      success: true,
      message: `Sent ${results.filter(r => r.sent).length} reminders`,
      results
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Server error' 
    }, { status: 500 });
  }
} 