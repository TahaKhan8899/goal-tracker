'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

type Goal = {
  id: string;
  Goal: string;
  'Target Date': string;
  Status: 'pending' | 'completed' | 'incomplete';
  Email: string;
  'Created At'?: string;
  'Updated At'?: string;
};

type GoalFormProps = {
  email: string;
  goal?: Goal;
  onGoalCreated?: (goal: Goal) => void;
  onGoalUpdated?: (goal: Goal) => void;
  onCancel: () => void;
};

export default function GoalForm({ 
  email, 
  goal, 
  onGoalCreated, 
  onGoalUpdated, 
  onCancel 
}: GoalFormProps) {
  const [description, setDescription] = useState(goal?.Goal || '');
  const [targetDate, setTargetDate] = useState(goal?.['Target Date'] || '');
  const [isRewriting, setIsRewriting] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasRewritten, setHasRewritten] = useState(false);

  const isEditMode = !!goal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!description || !targetDate) {
      toast.error('Please fill in all fields');
      return;
    }

    // Validate that target date is not in the past
    const selectedDate = new Date(targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      toast.error('Target date cannot be in the past');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      if (isEditMode) {
        // Update existing goal
        const response = await fetch(`/api/goals/${goal.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            goal: description,
            targetDate,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          onGoalUpdated?.(data.goal);
          onCancel();
        } else {
          toast.error('Failed to update goal');
        }
      } else {
        // Create new goal
        const response = await fetch('/api/goals', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            goal: description,
            targetDate,
          }),
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
          onGoalCreated?.(data.goal);
        } else {
          toast.error('Failed to create goal');
        }
      }
    } catch (error) {
      console.error('Error saving goal:', error);
      toast.error('An error occurred while saving your goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRewriteGoal = async () => {
    if (!description || hasRewritten) return;
    
    setIsRewriting(true);
    
    try {
      const response = await fetch('/api/rewriteGoal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ goal: description }),
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setDescription(data.goal);
        toast.success('Goal rewritten for clarity!');
        setHasRewritten(true);
      } else {
        toast.error('Failed to rewrite goal');
      }
    } catch (error) {
      console.error('Error rewriting goal:', error);
      toast.error('An error occurred while rewriting your goal');
    } finally {
      setIsRewriting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditMode ? 'Edit Goal' : 'Create New Goal'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="description" className="block text-sm font-medium">
              Goal Description
            </label>
            <div className="flex space-x-2">
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What do you want to achieve?"
                disabled={isSubmitting || isRewriting}
                required
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleRewriteGoal}
                disabled={!description || isSubmitting || isRewriting || hasRewritten || isEditMode}
              >
                {isRewriting ? 'Rewriting...' : hasRewritten ? '✓ Made Actionable' : '✨ Make Actionable'}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="targetDate" className="block text-sm font-medium">
              Target Date
            </label>
            <Input
              id="targetDate"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              disabled={isSubmitting}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
} 