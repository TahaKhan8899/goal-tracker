import { NextRequest, NextResponse } from 'next/server';
import { updateGoal } from '@/lib/airtable';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const status = searchParams.get('status') as 'completed' | 'incomplete';
    const email = searchParams.get('email');
    
    if (!id || !status || !email) {
      return NextResponse.json({ success: false, message: 'Missing required parameters' }, { status: 400 });
    }
    
    if (status !== 'completed' && status !== 'incomplete') {
      return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
    }
    
    const updatedGoal = await updateGoal(id, { Status: status });
    
    if (updatedGoal) {
      // Redirect to a success page
      return NextResponse.redirect(new URL(`/status-updated?status=${status}`, request.url));
    } else {
      return NextResponse.json({ success: false, message: 'Failed to update goal status' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error updating goal status:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 