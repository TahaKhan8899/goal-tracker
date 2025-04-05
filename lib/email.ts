import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

type Goal = {
  id: string;
  Email: string | string[];
  Goal: string;
  'Target Date': string;
  Status: 'pending' | 'completed' | 'incomplete';
};

// Helper function to extract email from Airtable record
const getEmailAddress = (email: string | string[]): string => {
  if (Array.isArray(email)) {
    return 'Unknown Email';
  }
  return email;
};

export async function sendReminderEmail(goal: Goal) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const emailTo = getEmailAddress(goal.Email);
  
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: emailTo,
      subject: `Reminder: Your goal is due today`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Goal Reminder</h1>
          <p>Your goal <strong>"${goal.Goal}"</strong> was due today.</p>
          <p>Did you complete it?</p>
          
          <div style="margin: 30px 0;">
            <a href="${appUrl}/api/goals/updateStatus?id=${goal.id}&status=completed&email=${encodeURIComponent(emailTo)}" 
               style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; margin-right: 10px; border-radius: 4px;">
              ✅ Yes, I completed it
            </a>
            
            <a href="${appUrl}/api/goals/updateStatus?id=${goal.id}&status=incomplete&email=${encodeURIComponent(emailTo)}" 
               style="background-color: #f44336; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px;">
              ❌ No, I didn't complete it
            </a>
          </div>
          
          <p style="color: #666; font-size: 0.8em;">
            You're receiving this email because you've set up a goal in Goal Tracker.
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return null;
  }
}

type GroupedGoals = {
  completed: Goal[];
  pending: Goal[];
  incomplete: Goal[];
};

export async function sendWeeklyDigest(email: string, goals: GroupedGoals) {
  try {
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Your Weekly Goal Progress Recap',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Your Weekly Recap 🧠</h1>
          
          ${goals.completed.length > 0 ? `
            <h2 style="color: #4CAF50;">✅ Completed:</h2>
            <ul style="list-style-type: none; padding: 0;">
              ${goals.completed.map(goal => `
                <li style="margin-bottom: 10px; padding: 10px; background-color: #f2f9f2; border-radius: 4px;">
                  ${goal.Goal}
                </li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${goals.pending.length > 0 ? `
            <h2 style="color: #FFC107;">🟡 Still Working On:</h2>
            <ul style="list-style-type: none; padding: 0;">
              ${goals.pending.map(goal => `
                <li style="margin-bottom: 10px; padding: 10px; background-color: #fffbeb; border-radius: 4px;">
                  ${goal.Goal} (Due: ${new Date(goal['Target Date']).toLocaleDateString()})
                </li>
              `).join('')}
            </ul>
          ` : ''}
          
          ${goals.incomplete.length > 0 ? `
            <h2 style="color: #F44336;">🔴 Incomplete:</h2>
            <ul style="list-style-type: none; padding: 0;">
              ${goals.incomplete.map(goal => `
                <li style="margin-bottom: 10px; padding: 10px; background-color: #feebeb; border-radius: 4px;">
                  ${goal.Goal}
                </li>
              `).join('')}
            </ul>
          ` : ''}
          
          <p style="margin-top: 30px; font-weight: bold;">Let's make next week even better! 💪</p>
          
          <p style="color: #666; font-size: 0.8em; margin-top: 50px;">
            You're receiving this email because you've set up goals in Goal Tracker.
          </p>
        </div>
      `,
    });

    if (error) {
      throw new Error(error.message);
    }
    
    return data;
  } catch (error) {
    console.error('Error sending weekly digest:', error);
    return null;
  }
} 