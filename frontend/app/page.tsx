// app/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.push('/dashboard'); // If logged in, go to the main dashboard
      } else {
        router.push('/login'); // If not logged in, go to the login page
      }
    }
  }, [isAuthenticated, loading, router]);

  // Display a loading spinner while the authentication check is in progress
  return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  );
}
