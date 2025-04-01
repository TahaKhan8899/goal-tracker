import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, createUser } from '@/lib/airtable';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ success: false, message: 'Email is required' }, { status: 400 });
    }
    
    // Check if user exists
    const user = await getUserByEmail(email);
    
    if (user) {
      // User exists, grant access
      return NextResponse.json({ success: true, message: 'Login successful' });
    } else {
      // User doesn't exist, return error
      return NextResponse.json({ success: false, message: 'You\'re not in the system' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 