'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import GoalForm from '@/components/GoalForm';
import GoalList from '@/components/GoalList';

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