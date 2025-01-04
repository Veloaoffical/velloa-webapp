'use client';

import Lottie from 'lottie-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

type AnimationData = Record<string, unknown>;

export function PersonRentalApplication() {
  const [animationData, setAnimationData] = useState<AnimationData | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const params = useParams();

  useEffect(() => {
    import('../../../../../public/SentMessageAnimation.json')
      .then((mod) => {
        const data = mod.default;
        data.fr = 30;
        setAnimationData(data);
      })
      .catch(err => console.error('Error loading animation:', err));
  }, []);

  const handleResend = async () => {
    try {
      setIsResending(true);
      console.log('Starting resend request for prospect ID:', params.id);
      
      const response = await fetch(`/api/people/${params.id}/resend-application`, {
        method: 'POST',
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.details || data.error || 'Failed to resend application');
      }

      toast.success('Application resent successfully');
      console.log('Email sent successfully:', data.data);
    } catch (error) {
      console.error('Error resending application:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to resend application');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="h-[calc(100vh-16rem)]">
      <Card className="h-full">
        <CardContent className="h-full p-6">
          <div className="flex flex-col items-center justify-center h-full space-y-6">
            <div className="relative w-[300px] h-[300px]">
              {!isLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-lg animate-pulse">
                  <div className="w-full h-full" />
                </div>
              )}
              
              {animationData && (
                <Lottie
                  animationData={animationData}
                  loop={false}
                  autoplay={true}
                  className="w-full h-full"
                  onComplete={() => setIsLoaded(true)}
                  rendererSettings={{
                    preserveAspectRatio: 'xMidYMid slice',
                    progressiveLoad: false,
                  }}
                />
              )}
            </div>

            <h1 className="text-2xl font-semibold tracking-tight">
              Application Sent
            </h1>
            
            <p className="text-muted-foreground">
              The prospect has received a rental application, we&apos;re waiting for the application to be filled out.
            </p>

            <Button 
              className="w-full max-w-md bg-primary hover:bg-primary/90"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? 'Resending...' : 'Resend Application'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 