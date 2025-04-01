import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, getUserGoals } from '@/lib/airtable';
import { sendWeeklyDigest } from '@/lib/email';

export async function GET(request: NextRequest) {
  try {
    // Get all users
    const users = await getAllUsers();
    
    if (users.length === 0) {
      return NextResponse.json({ success: true, message: 'No users to send digests to' });
    }
    
    // Send digest for each user
    const results = await Promise.all(
      users.map(async (user) => {
        // Get all goals for the user
        const userGoals = await getUserGoals(user.Email);
        
        // Group goals by status
        const groupedGoals = {
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
      })
    );
    
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