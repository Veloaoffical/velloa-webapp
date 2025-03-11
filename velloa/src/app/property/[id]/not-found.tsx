import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Building2, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center p-4">
      <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
      <h1 className="text-2xl font-bold mb-2">Property Not Found</h1>
      <p className="text-muted-foreground mb-6">The property you&apos;re looking for doesn&apos;t exist or you don&apos;t have access to it.</p>
      <Link href="/property">
        <Button variant="outline" size="sm" className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Properties
        </Button>
      </Link>
    </div>
  );
} 