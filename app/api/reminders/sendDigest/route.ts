import { NextResponse } from 'next/server';
import { getAllUsers, getUserGoals } from '@/lib/airtable';
import { sendWeeklyDigest } from '@/lib/email';

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

type User = {
  id: string;
  Email: string;
  Name?: string;
};

interface GroupedGoals {
  completed: Goal[];
  pending: Goal[];
  incomplete: Goal[];
}

export async function GET() {
  try {
    // Get all users
    const users = await getAllUsers() as User[];
    
    if (users.length === 0) {
      return NextResponse.json({ success: true, message: 'No users to send digests to' });
    }
    
    // In test mode, we can only send to our own email
    // Filter to only include your email or process at most one email at a time
    const testModeEmail = 'taha.khan8899@gmail.com'; // Your email address for testing
    const testModeUsers = users.filter(user => user.Email === testModeEmail);
    
    // Use testModeUsers in test mode, or all users in production
    const targetUsers = process.env.NODE_ENV === 'production' ? users : testModeUsers;
    
    // Send digest for each user
    const results = await Promise.all(
      targetUsers.map(async (user) => {
        try {
          // Get all goals for the user
          const userGoals = await getUserGoals(user.Email) as Goal[];
          
          // Group goals by status
          const groupedGoals: GroupedGoals = {
            completed: userGoals.filter(goal => goal.Status === 'completed'),
            pending: userGoals.filter(goal => goal.Status === 'pending'),
            incomplete: userGoals.filter(goal => goal.Status === 'incomplete'),
          };
          
          // Send digest email
          const result = await sendWeeklyDigest(user.Email, groupedGoals);
          
          return {
            email: user.Email,
            sent: !!result,
            completedCount: groupedGoals.completed.length,
            pendingCount: groupedGoals.pending.length,
            incompleteCount: groupedGoals.incomplete.length,
          };
        } catch (error) {
          return {
            email: user.Email,
            sent: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            completedCount: 0,
            pendingCount: 0,
            incompleteCount: 0,
          };
        }
      })
    );
    
    // For non-test mode users, add them to results with a clear message
    if (process.env.NODE_ENV !== 'production') {
      const skippedUsers = users.filter(user => user.Email !== testModeEmail).map(user => ({
        email: user.Email,
        sent: false,
        skipped: true,
        message: 'Skipped in test mode - can only send to your own email',
        completedCount: 0,
        pendingCount: 0,
        incompleteCount: 0,
      }));
      
      results.push(...skippedUsers);
    }
    
    return NextResponse.json({
      success: true,
      message: `Sent ${results.filter(r => r.sent).length} weekly digests`,
      results,
    });
  } catch (error) {
    console.error('Error sending weekly digests:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 