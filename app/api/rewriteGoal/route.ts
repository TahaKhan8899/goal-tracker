import { NextRequest, NextResponse } from 'next/server';
import { rewriteGoal } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const { goal } = await request.json();
    
    if (!goal || typeof goal !== 'string') {
      return NextResponse.json({ success: false, message: 'Goal text is required' }, { status: 400 });
    }
    
    const rewrittenGoal = await rewriteGoal(goal);
    
    return NextResponse.json({ success: true, goal: rewrittenGoal });
  } catch (error) {
    console.error('Error rewriting goal:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
} 