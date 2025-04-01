import { NextResponse } from 'next/server';
import { updateGoal, deleteGoal } from '@/lib/airtable';

interface GoalUpdates {
  Goal?: string;
  'Target Date'?: string;
  Status?: 'pending' | 'completed' | 'incomplete';
}

// Update a goal
export async function PUT(request: Request) {
  try {
    const id = request.url.split('/').pop();
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Goal ID is required' },
        { status: 400 }
      );
    }

    const { goal, targetDate, status } = await request.json();

    // Prepare updates
    const updates: GoalUpdates = {};
    if (goal) updates.Goal = goal;
    if (targetDate) updates['Target Date'] = targetDate;
    if (status) updates.Status = status;

    // No updates provided
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { success: false, message: 'No updates provided' },
        { status: 400 }
      );
    }

    const updatedGoal = await updateGoal(id, updates);

    if (updatedGoal) {
      return NextResponse.json({ success: true, goal: updatedGoal });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to update goal' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error updating goal:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
}

// Delete a goal
export async function DELETE(request: Request) {
  try {
    const id = request.url.split('/').pop();
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Goal ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteGoal(id);

    if (success) {
      return NextResponse.json({ success: true, message: 'Goal deleted' });
    } else {
      return NextResponse.json(
        { success: false, message: 'Failed to delete goal' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error deleting goal:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
} 