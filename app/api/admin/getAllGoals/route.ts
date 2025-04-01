import { NextRequest, NextResponse } from 'next/server';
import { getAllGoals } from '@/lib/airtable';

// Simple admin check - in a real app, use a more robust authorization mechanism
const ADMIN_EMAILS = ['admin@example.com'];

export async function GET(request: NextRequest) {
  try {
    // Get email from query params for authorization
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    // Check if user is admin
    if (!email || !ADMIN_EMAILS.includes(email)) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    
    // Get all goals
    const goals = await getAllGoals();
    
    return NextResponse.json({ success: true, goals });
  } catch (error) {
    console.error('Error fetching all goals:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 