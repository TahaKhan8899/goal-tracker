import Airtable from 'airtable';

// Initialize Airtable
Airtable.configure({
  apiKey: process.env.AIRTABLE_API_KEY,
});

const base = Airtable.base(process.env.AIRTABLE_BASE_ID as string);

// User table operations
export const getUserByEmail = async (email: string) => {
  try {
    const records = await base('Users')
      .select({
        filterByFormula: `{Email} = '${email}'`,
        maxRecords: 1,
      })
      .firstPage();
    
    return records.length > 0 ? { ...records[0].fields, id: records[0].id } : null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const createUser = async (email: string, name: string = '') => {
  try {
    const records = await base('Users').create([
      {
        fields: {
          Email: email,
          Name: name,
          'Joined At': new Date().toISOString(),
        },
      },
    ]);
    
    return { ...records[0].fields, id: records[0].id };
  } catch (error) {
    console.error('Error creating user:', error);
    return null;
  }
};

// Goal table operations
export const getUserGoals = async (email: string) => {
  try {
    const records = await base('Goals')
      .select({
        filterByFormula: `{Email} = '${email}'`,
        sort: [{ field: 'Target Date', direction: 'asc' }],
      })
      .firstPage();
    
    return records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));
  } catch (error) {
    console.error('Error fetching goals:', error);
    return [];
  }
};

export const createGoal = async (
  email: string,
  goal: string,
  targetDate: string
) => {
  try {
    // First get the user record ID by email
    const user = await getUserByEmail(email);
    
    if (!user || !user.id) {
      console.error('User not found or missing ID:', email);
      return null;
    }
    
    const records = await base('Goals').create([
      {
        fields: {
          Email: [user.id], // This needs to be an array with the user's record ID
          Goal: goal,
          'Target Date': targetDate,
          Status: 'pending',
        },
      },
    ]);
    
    return { ...records[0].fields, id: records[0].id };
  } catch (error) {
    console.error('Error creating goal:', error);
    return null;
  }
};

export const updateGoal = async (
  id: string,
  updates: {
    Goal?: string;
    'Target Date'?: string;
    Status?: 'pending' | 'completed' | 'incomplete';
  }
) => {
  try {
    // First get the current goal to preserve the Email field
    const currentGoal = await base('Goals').find(id);
    if (!currentGoal) {
      console.error('Goal not found:', id);
      return null;
    }

    // Format the date to be Airtable-compatible (YYYY-MM-DD)
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    
    const records = await base('Goals').update([
      {
        id,
        fields: {
          ...updates,
          Email: currentGoal.fields.Email, // Preserve the Email field which contains the user ID
          'Updated At': formattedDate,
        },
      },
    ]);

    // Get the user data to include in the response
    const userId = Array.isArray(records[0].fields.Email) ? records[0].fields.Email[0] : records[0].fields.Email;
    const user = await base('Users').find(userId);
    
    return {
      id: records[0].id,
      ...records[0].fields,
      userId: userId,
      Email: user?.fields.Email || '',
      UserName: user?.fields.Name || user?.fields.Email || ''
    };
  } catch (error) {
    console.error('Error updating goal:', error);
    return null;
  }
};

export const deleteGoal = async (id: string) => {
  try {
    await base('Goals').destroy([id]);
    return true;
  } catch (error) {
    console.error('Error deleting goal:', error);
    return false;
  }
};

// For admin dashboard
export const getAllGoals = async () => {
  try {
    const records = await base('Goals')
      .select({
        sort: [{ field: 'Target Date', direction: 'asc' }],
        fields: ['Goal', 'Target Date', 'Status', 'Email', 'Created At', 'Updated At', 'Name (from Email)']
      })
      .firstPage();
    
    // Get all unique user IDs from goals
    const userIds = new Set(records.flatMap(record => 
      Array.isArray(record.fields.Email) ? record.fields.Email : [record.fields.Email]
    ).filter(Boolean));

    // Fetch all referenced users in one batch
    const users = await base('Users')
      .select({
        filterByFormula: `OR(${Array.from(userIds).map(id => `RECORD_ID()='${id}'`).join(',')})`,
      })
      .firstPage();

    // Create a map of user IDs to their data
    const userMap = new Map(users.map(user => [user.id, user.fields]));

    return records.map((record) => {
      const userId = Array.isArray(record.fields.Email) ? record.fields.Email[0] : record.fields.Email;
      const userData = userMap.get(userId) || {};
      
      return {
        id: record.id,
        ...record.fields,
        userId: userId, // Add the user's record ID
        Email: userData.Email || '', // Use the actual email from the Users table
        UserName: userData.Name || userData.Email || '' // Use name or fall back to email
      };
    });
  } catch (error) {
    console.error('Error fetching all goals:', error);
    return [];
  }
};

// Reminder operations
export const getGoalsDueToday = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    const records = await base('Goals')
      .select({
        filterByFormula: `AND({Target Date} = '${today}', {Status} = 'pending')`,
      })
      .firstPage();
    
    return records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));
  } catch (error) {
    console.error('Error fetching goals due today:', error);
    return [];
  }
};

// Get all users for weekly digest
export const getAllUsers = async () => {
  try {
    const records = await base('Users').select().firstPage();
    
    return records.map((record) => ({
      id: record.id,
      ...record.fields,
    }));
  } catch (error) {
    console.error('Error fetching all users:', error);
    return [];
  }
}; 