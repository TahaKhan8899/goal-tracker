'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import GoalList from '@/components/GoalList';

type Goal = {
  id: string;
  Goal: string;
  'Target Date': string;
  Status: 'pending' | 'completed' | 'incomplete';
  Email: string;
  'Created At'?: string;
  'Updated At'?: string;
  userId: string;
  UserName: string;
};

export default function AdminDashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [filteredGoals, setFilteredGoals] = useState<Goal[]>([]);
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const router = useRouter();

  // Check for admin permission
  useEffect(() => {
    const checkAdminPermission = async () => {
      setIsCheckingAdmin(true);
      try {
        const userJson = localStorage.getItem('user');
        if (!userJson) {
          toast.error('Please log in first');
          router.push('/');
          return;
        }
        
        const userData = JSON.parse(userJson);
        const isAdmin = userData.email === 'admin@example.com';
        
        if (!isAdmin) {
          toast.error('You do not have admin permissions');
          router.push('/dashboard');
          return;
        }
        
        setEmail(userData.email);
        setIsCheckingAdmin(false);
        await fetchAllGoals(userData.email);
      } catch (error) {
        console.error('Error checking admin permission:', error);
        toast.error('An error occurred while checking permissions');
        router.push('/');
      }
    };

    checkAdminPermission();
  }, [router]);

  // Apply filters when goals or filter settings change
  useEffect(() => {
    filterGoals();
  }, [goals, statusFilter, userFilter]);

  // Fetch all goals for admin
  const fetchAllGoals = async (adminEmail: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/getAllGoals?email=${encodeURIComponent(adminEmail)}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGoals(data.goals);
        setFilteredGoals(data.goals);
      } else {
        const errorMessage = data.message || 'Failed to fetch goals';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      const errorMessage = 'An error occurred while fetching the goals';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter goals based on status and user
  const filterGoals = () => {
    let filtered = [...goals];
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(goal => goal.Status === statusFilter);
    }
    
    // Filter by user
    if (userFilter && userFilter !== 'all') {
      filtered = filtered.filter(goal => goal.userId === userFilter);
    }
    
    setFilteredGoals(filtered);
  };

  // Handle goal update
  const handleGoalUpdated = (updatedGoal: Goal) => {
    setGoals(prevGoals => 
      prevGoals.map(goal => goal.id === updatedGoal.id ? updatedGoal : goal)
    );
    toast.success('Goal updated successfully!');
  };

  // Handle goal deletion
  const handleGoalDeleted = (id: string) => {
    setGoals(prevGoals => prevGoals.filter(goal => goal.id !== id));
    toast.success('Goal deleted successfully!');
  };

  // Get unique users from goals
  const getUniqueUsers = () => {
    // Create a map to store unique users by ID
    const uniqueUsers = new Map();
    
    goals.forEach(goal => {
      if (!uniqueUsers.has(goal.userId)) {
        uniqueUsers.set(goal.userId, {
          id: goal.userId,
          email: goal.Email,
          name: goal.UserName || goal.Email
        });
      }
    });
    
    // Convert map values to array and sort by name
    return Array.from(uniqueUsers.values()).sort((a, b) => 
      String(a.name || '').localeCompare(String(b.name || ''))
    );
  };

  // Calculate statistics
  const getStats = () => {
    const total = goals.length;
    const completed = goals.filter(g => g.Status === 'completed').length;
    const incomplete = goals.filter(g => g.Status === 'incomplete').length;
    const pending = goals.filter(g => g.Status === 'pending').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return {
      total,
      completed,
      incomplete,
      pending,
      completionRate
    };
  };

  const stats = getStats();

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <Toaster />
      {isCheckingAdmin ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-primary border-r-transparent border-l-transparent border-b-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Checking permissions...</p>
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-gray-500">Managing all users' goals</p>
            </div>
            <Button variant="outline" onClick={() => router.push('/dashboard')}>
              Back to My Goals
            </Button>
          </div>

          {error ? (
            <div className="text-center py-10">
              <p className="text-rose-600">{error}</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => fetchAllGoals(email)}
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-gray-500">Total Goals</div>
                    <div className="text-3xl font-bold">{stats.total}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-green-500">Completed</div>
                    <div className="text-3xl font-bold">{stats.completed}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-yellow-500">Pending</div>
                    <div className="text-3xl font-bold">{stats.pending}</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="text-sm font-medium text-red-500">Incomplete</div>
                    <div className="text-3xl font-bold">{stats.incomplete}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium mb-1">
                    Filter by User
                  </label>
                  <Select 
                    value={userFilter || 'all'} 
                    onValueChange={(value) => setUserFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Users</SelectItem>
                      {getUniqueUsers().map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {isLoading ? (
                <div className="text-center py-10">
                  <p>Loading goals...</p>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-semibold mb-4">
                    {filteredGoals.length} Goals 
                    {statusFilter !== 'all' ? ` (${statusFilter})` : ''}
                    {userFilter && userFilter !== 'all' ? ` for ${goals.find(g => g.userId === userFilter)?.UserName}` : ''}
                  </h2>
                  
                  <GoalList 
                    goals={filteredGoals}
                    onGoalUpdated={handleGoalUpdated}
                    onGoalDeleted={handleGoalDeleted}
                  />
                </>
              )}
            </>
          )}
        </div>
      )}
    </main>
  );
} 