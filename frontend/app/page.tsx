// app/page.tsx
"use client";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/upload');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white text-red-700 space-y-4">
      <h1 className="text-4xl font-bold">WELCOME TO ADOBE PDF LIFE</h1>
      <p className="text-lg">Prepare to experience PDFs like never before.</p>
      <Loader2 className="h-8 w-8 animate-spin text-red-700" />
    </div>
  );
}
