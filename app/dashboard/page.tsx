'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import GoalForm from '@/components/GoalForm';
import GoalList from '@/components/GoalList';
import { Card, CardContent } from '@/components/ui/card';

type Goal = {
  id: string;
  Goal: string;
  'Target Date': string;
  Status: 'pending' | 'completed' | 'incomplete';
  Email: string;
};

export default function Dashboard() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const router = useRouter();

  // Check for logged-in user
  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      router.push('/');
      return;
    }
    
    try {
      const userData = JSON.parse(userJson);
      setUser(userData);
      fetchGoals(userData.email);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      router.push('/');
    }
  }, [router]);

  // Fetch user's goals
  const fetchGoals = async (email: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/goals?email=${encodeURIComponent(email)}`);
      const data = await response.json();
      
      if (response.ok && data.success) {
        setGoals(data.goals);
      } else {
        toast.error('Failed to fetch goals');
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('An error occurred while fetching your goals');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle goal creation
  const handleGoalCreated = (newGoal: Goal) => {
    setGoals(prevGoals => [...prevGoals, newGoal]);
    setShowForm(false);
    toast.success('Goal created successfully!');
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

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/');
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

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <main className="min-h-screen p-4 md:p-8 bg-gray-50">
      <Toaster />
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Your Goals</h1>
            <p className="text-gray-500">Logged in as {user.email}</p>
          </div>
          <div className="flex space-x-2">
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? 'Cancel' : 'Create Goal'}
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Goal Summary Section */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <h3 className="text-2xl font-bold">{stats.total}</h3>
                <p className="text-gray-500">Total Goals</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <h3 className="text-2xl font-bold text-green-600">{stats.completed}</h3>
                <p className="text-gray-500">Completed</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <h3 className="text-2xl font-bold text-yellow-600">{stats.pending}</h3>
                <p className="text-gray-500">Pending</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <h3 className="text-2xl font-bold text-red-600">{stats.incomplete}</h3>
                <p className="text-gray-500">Incomplete</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {showForm && (
          <div className="mb-8">
            <GoalForm 
              email={user.email} 
              onGoalCreated={handleGoalCreated} 
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-10">
            <p>Loading your goals...</p>
          </div>
        ) : (
          <GoalList 
            goals={goals} 
            onGoalUpdated={handleGoalUpdated} 
            onGoalDeleted={handleGoalDeleted}
          />
        )}
      </div>
    </main>
  );
} 