'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

function StatusContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get('status');

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mb-4">
              {status === 'completed' ? (
                <span className="text-6xl">🎉</span>
              ) : (
                <span className="text-6xl">💪</span>
              )}
            </div>
            <h1 className="text-2xl font-bold mb-2">
              Goal marked as {status}!
            </h1>
            <p className="text-gray-600 mb-6">
              {status === 'completed'
                ? "Congratulations! You've achieved your goal."
                : "Don't worry, you can try again later."}
            </p>
            <Button
              onClick={() => window.close()}
              className="w-full"
            >
              Close Window
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function StatusUpdated() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <StatusContent />
    </Suspense>
  );
} 