import { NextRequest, NextResponse } from 'next/server';
import { getUserGoals, createGoal, updateGoal, deleteGoal } from '@/lib/airtable';

// Get goals for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }

    const goals = await getUserGoals(email);
    return NextResponse.json({ success: true, goals });
  } catch (error) {
    console.error('Error fetching goals:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}

// Create a new goal
export async function POST(request: NextRequest) {
  try {
    const { email, goal, targetDate } = await request.json();
    
    if (!email || !goal || !targetDate) {
      return NextResponse.json(
        { success: false, message: 'Email, goal, and target date are required' },
        { status: 400 }
      );
    }

    const newGoal = await createGoal(email, goal, targetDate);
    
    if (newGoal) {
      return NextResponse.json({ success: true, goal: newGoal });
    } else {
      return NextResponse.json({ success: false, message: 'Failed to create goal' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error creating goal:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 