'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function StatusUpdatedPage() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');
  
  const statusInfo = {
    completed: {
      title: 'Goal Completed! 🎉',
      message: 'Congratulations on completing your goal! Keep up the great work.',
      color: 'text-green-600',
    },
    incomplete: {
      title: 'Goal Marked as Incomplete',
      message: 'No worries - acknowledging incomplete goals helps you plan better next time.',
      color: 'text-red-600',
    },
  }[status as string] || {
    title: 'Goal Status Updated',
    message: 'Your goal status has been updated successfully.',
    color: 'text-blue-600',
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className={`text-2xl font-bold text-center ${statusInfo.color}`}>
            {statusInfo.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4">{statusInfo.message}</p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Link href="/dashboard" passHref>
            <Button>Go to Dashboard</Button>
          </Link>
        </CardFooter>
      </Card>
    </main>
  );
} 