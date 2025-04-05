'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import GoalForm from '@/components/GoalForm';

type ViewType = 'grid' | 'list';
type StatusFilter = 'all' | 'pending' | 'completed' | 'incomplete';

type Goal = {
  id: string;
  Goal: string;
  'Target Date': string;
  Status: 'pending' | 'completed' | 'incomplete';
  Email: string;
  'Created At'?: string;
  'Updated At'?: string;
  userId?: string;
  UserName?: string;
};

interface GoalListProps {
  goals: Goal[];
  onGoalUpdated: (updatedGoal: Goal) => void;
  onGoalDeleted: (id: string) => void;
  isAdmin?: boolean;
}

export default function GoalList({ goals, onGoalUpdated, onGoalDeleted, isAdmin = false }: GoalListProps) {
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [viewType, setViewType] = useState<ViewType>('grid');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [updatingGoalId, setUpdatingGoalId] = useState<string | null>(null);

  // Sort and filter goals
  const sortedAndFilteredGoals = goals
    .filter(goal => statusFilter === 'all' || goal.Status === statusFilter)
    .sort((a, b) => {
      // Define status priority
      const statusPriority = {
        pending: 0,
        incomplete: 1,
        completed: 2
      };
      
      // Sort by status priority
      return statusPriority[a.Status] - statusPriority[b.Status];
    });

  // Calculate progress for a goal (days passed / total days)
  const calculateProgress = (goal: Goal) => {
    try {
      const createdAt = goal['Created At'] ? new Date(goal['Created At']) : new Date();
      const targetDate = new Date(goal['Target Date']);
      const today = new Date();
      
      // If past due date, set appropriate progress
      if (goal.Status === 'completed') return 100;
      if (goal.Status === 'incomplete') return 100;
      if (today > targetDate) return 100;
      
      // Calculate total days between creation and target
      const totalDays = Math.ceil((targetDate.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysElapsed = Math.floor((today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
      
      if (totalDays <= 0) return 0;
      
      // Calculate progress percentage
      const progress = Math.min(100, Math.round((daysElapsed / totalDays) * 100));
      
      // If goal was created today, show a small progress (like 5%)
      if (daysElapsed === 0) return 5;
      
      return progress;
    } catch (error) {
      console.error('Error calculating progress:', error);
      return 0;
    }
  };

  // Get status color class
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-600/20';
      case 'incomplete':
        return 'bg-rose-100 text-rose-800 ring-1 ring-rose-600/20';
      default:
        return 'bg-amber-100 text-amber-800 ring-1 ring-amber-600/20';
    }
  };

  // Get progress bar color
  const getProgressColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500';
      case 'incomplete':
        return 'bg-rose-500';
      default:
        return 'bg-amber-500';
    }
  };

  // Update goal status
  const updateGoalStatus = async (id: string, status: 'completed' | 'incomplete' | 'pending') => {
    setUpdatingGoalId(id);
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        onGoalUpdated(data.goal);
      } else {
        toast.error('Failed to update goal status');
      }
    } catch (error) {
      console.error('Error updating goal status:', error);
      toast.error('An error occurred while updating the goal');
    } finally {
      setUpdatingGoalId(null);
    }
  };

  // Delete a goal
  const deleteGoal = async (id: string) => {
    try {
      const response = await fetch(`/api/goals/${id}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        onGoalDeleted(id);
      } else {
        toast.error('Failed to delete goal');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('An error occurred while deleting the goal');
    }
  };

  const renderViewToggle = () => (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Filter:</span>
        <div className="inline-flex rounded-lg border border-gray-200 p-1">
          <Button
            size="sm"
            variant={statusFilter === 'all' ? 'default' : 'ghost'}
            className="flex items-center gap-2"
            onClick={() => setStatusFilter('all')}
          >
            All
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'pending' ? 'default' : 'ghost'}
            className="flex items-center gap-2"
            onClick={() => setStatusFilter('pending')}
          >
            Pending
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'incomplete' ? 'default' : 'ghost'}
            className="flex items-center gap-2"
            onClick={() => setStatusFilter('incomplete')}
          >
            Incomplete
          </Button>
          <Button
            size="sm"
            variant={statusFilter === 'completed' ? 'default' : 'ghost'}
            className="flex items-center gap-2"
            onClick={() => setStatusFilter('completed')}
          >
            Completed
          </Button>
        </div>
      </div>

      <div className="inline-flex rounded-lg border border-gray-200 p-1">
        <Button
          size="sm"
          variant={viewType === 'grid' ? 'default' : 'ghost'}
          className="flex items-center gap-2"
          onClick={() => setViewType('grid')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          Grid
        </Button>
        <Button
          size="sm"
          variant={viewType === 'list' ? 'default' : 'ghost'}
          className="flex items-center gap-2"
          onClick={() => setViewType('list')}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          List
        </Button>
      </div>
    </div>
  );

  const renderGridView = () => (
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6 px-2 pb-3">
      {sortedAndFilteredGoals.map((goal) => (
        <div key={goal.id} className="break-inside-avoid mb-6">
          <Card 
            className={`
              transform transition-all duration-200 flex flex-col h-fit
              ${goal.Status === 'completed' ? 'border-emerald-500/50 shadow-emerald-100 hover:border-emerald-500' : 
                goal.Status === 'incomplete' ? 'border-rose-500/50 shadow-rose-100 hover:border-rose-500' : 
                'border-amber-200 hover:border-amber-500/50 hover:border-amber-500 shadow-gray-100'}
            `}
          >
            <CardHeader className="pb-3 flex-none">
              <div className="flex justify-between items-start gap-4">
                <CardTitle className="text-lg font-semibold leading-normal break-words">{goal.Goal}</CardTitle>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors flex-shrink-0 ${getStatusColor(goal.Status)}`}>
                  {goal.Status.charAt(0).toUpperCase() + goal.Status.slice(1)}
                </span>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium">
                    Due: {format(parseISO(goal['Target Date']), 'MMMM d, yyyy')}
                  </p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <p className="text-xs font-medium text-gray-500">Progress</p>
                    <span className="text-xs font-medium text-gray-500">{calculateProgress(goal)}%</span>
                  </div>
                  <Progress 
                    value={calculateProgress(goal)} 
                    className={`h-2 transition-all ${getProgressColor(goal.Status)}`}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between flex-wrap gap-2 border-t flex-none">
              {goal.Status === 'pending' && (
                <>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                    onClick={() => updateGoalStatus(goal.id, 'completed')}
                    disabled={updatingGoalId === goal.id}
                  >
                    {updatingGoalId === goal.id ? (
                      <div className="flex items-center">
                        <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Complete
                      </>
                    )}
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                    onClick={() => updateGoalStatus(goal.id, 'incomplete')}
                    disabled={updatingGoalId === goal.id}
                  >
                    {updatingGoalId === goal.id ? (
                      <div className="flex items-center">
                        <div className="h-4 w-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                        Updating...
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Incomplete
                      </>
                    )}
                  </Button>
                </>
              )}
              {goal.Status !== 'pending' && (
                <Button 
                  size="sm" 
                  variant="outline"
                  className="text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => updateGoalStatus(goal.id, 'pending')}
                  disabled={updatingGoalId === goal.id}
                >
                  {updatingGoalId === goal.id ? (
                    <div className="flex items-center">
                      <div className="h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin mr-2"></div>
                      Updating...
                    </div>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Reset Status
                    </>
                  )}
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setEditingGoal(goal)}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Edit
                </Button>
                
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:max-w-[425px]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-semibold">Delete Goal</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-500">
                        Are you sure you want to delete this goal? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-gray-500 hover:text-gray-600">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteGoal(goal.id)}
                        className="bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardFooter>
          </Card>
        </div>
      ))}
    </div>
  );

  const renderListView = () => (
    <div className="flex flex-col gap-2">
      {sortedAndFilteredGoals.map((goal) => (
        <Card 
          key={goal.id}
          className={`
            transform transition-all duration-200 hover:shadow-md
            ${goal.Status === 'completed' ? 'border-emerald-500/50 shadow-emerald-100' : 
              goal.Status === 'incomplete' ? 'border-rose-500/50 shadow-rose-100' : 
              'border-gray-200 hover:border-amber-500/50 shadow-gray-100'}
          `}
        >
          <div className="flex items-center justify-between gap-4 p-4">
            <div className="flex-1 min-w-0 max-w-[30%]">
              <div className="flex items-center gap-3 mb-1">
                <h3 className="text-lg font-semibold leading-tight truncate max-w-[250px]">{goal.Goal}</h3>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full transition-colors flex-shrink-0 ${getStatusColor(goal.Status)}`}>
                  {goal.Status.charAt(0).toUpperCase() + goal.Status.slice(1)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="whitespace-nowrap">Due: {format(parseISO(goal['Target Date']), 'MMM d, yyyy')}</span>
                </div>
                {isAdmin && (
                  <>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="truncate max-w-[200px]">{goal.Email}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="whitespace-nowrap">Created: {format(new Date(goal['Created At'] || ''), 'MMM d, yyyy')}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="w-32 flex-shrink-0">
                <div className="flex justify-between items-center mb-1">
                  <p className="text-xs font-medium text-gray-500">Progress</p>
                  <span className="text-xs font-medium text-gray-500">{calculateProgress(goal)}%</span>
                </div>
                <Progress 
                  value={calculateProgress(goal)} 
                  className={`h-2 transition-all ${getProgressColor(goal.Status)}`}
                />
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                {goal.Status === 'pending' ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-300 transition-colors"
                      onClick={() => updateGoalStatus(goal.id, 'completed')}
                      disabled={updatingGoalId === goal.id}
                    >
                      {updatingGoalId === goal.id ? (
                        <div className="h-4 w-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"/>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 transition-colors"
                      onClick={() => updateGoalStatus(goal.id, 'incomplete')}
                      disabled={updatingGoalId === goal.id}
                    >
                      {updatingGoalId === goal.id ? (
                        <div className="h-4 w-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin"/>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="text-gray-600 hover:bg-gray-50 transition-colors"
                    onClick={() => updateGoalStatus(goal.id, 'pending')}
                    disabled={updatingGoalId === goal.id}
                  >
                    {updatingGoalId === goal.id ? (
                      <div className="h-4 w-4 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"/>
                    ) : (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    )}
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost"
                  className="text-gray-600 hover:bg-gray-50 transition-colors"
                  onClick={() => setEditingGoal(goal)}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent className="sm:max-w-[425px]">
                    <AlertDialogHeader>
                      <AlertDialogTitle className="text-xl font-semibold">Delete Goal</AlertDialogTitle>
                      <AlertDialogDescription className="text-gray-500">
                        Are you sure you want to delete this goal? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel className="text-gray-500 hover:text-gray-600">Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteGoal(goal.id)}
                        className="bg-rose-600 text-white hover:bg-rose-700"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );

  if (goals.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
        <p className="text-gray-500 text-lg">No goals yet! Let&apos;s set one up 🎯</p>
        <p className="text-gray-400 text-sm mt-2">Click the &quot;Create Goal&quot; button to get started</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto">
      <div className="space-y-6">
        {renderViewToggle()}

        {editingGoal && (
          <div className="mb-8">
            <GoalForm 
              email={editingGoal.Email}
              goal={editingGoal}
              onGoalUpdated={onGoalUpdated}
              onCancel={() => setEditingGoal(null)}
            />
          </div>
        )}
        
        {!editingGoal && (
          <>
            {sortedAndFilteredGoals.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-lg">
                <p className="text-gray-500">No goals match the selected filter</p>
              </div>
            ) : (
              <div className="max-w-full overflow-x-hidden overflow-y-hidden pb-1">
                {viewType === 'grid' ? renderGridView() : renderListView()}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
} 