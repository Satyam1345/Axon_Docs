// app/page.tsx
"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, FileText, Zap, ArrowRight, Sparkles } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 40);

    // Redirect after animation
    const timer = setTimeout(() => {
      router.push('/upload');
    }, 3500);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-700 to-red-600 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        {/* Floating PDF Icons */}
        <div className="absolute top-20 left-20 opacity-10">
          <FileText className="w-16 h-16 text-white animate-fade-in" />
        </div>
        <div className="absolute top-40 right-32 opacity-10">
          <FileText className="w-20 h-20 text-white animate-fade-in" />
        </div>
        <div className="absolute bottom-32 left-40 opacity-10">
          <FileText className="w-12 h-12 text-white animate-fade-in" />
        </div>
        
        {/* Geometric Shapes */}
        <div className="absolute top-32 right-20 w-32 h-32 border-2 border-white/20 rounded-full animate-spin-slow"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-white/10 rounded-lg transform rotate-45 animate-pulse"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-r from-white/20 to-transparent rounded-full animate-ping"></div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-red-400/30 to-orange-500/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-r from-red-600/20 to-red-800/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 text-center">
        {/* Logo/Icon Section */}
        <div className="mb-8 animate-fade-in">
          <div className="relative">
            <div className="w-24 h-24 bg-white/20 rounded-2xl backdrop-blur-sm border border-white/30 flex items-center justify-center mb-6 mx-auto">
              <FileText className="w-12 h-12 text-white" />
              <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-yellow-300" />
            </div>
          </div>
        </div>

        {/* Main Title */}
        <div className="mb-8 animate-slide-up">
          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            WELCOME TO
          </h1>
          
          <div className="relative">
            <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-red-100 to-white bg-clip-text text-transparent">
              ADOBE PDF LIFE
            </h2>
            {/* Animated underline */}
            <div className="w-64 h-1 bg-gradient-to-r from-transparent via-white to-transparent mx-auto mt-4 animate-shine"></div>
          </div>
        </div>

        {/* Subtitle */}
        <p className="text-xl md:text-2xl text-red-100 mb-8 max-w-2xl leading-relaxed animate-fade-in-up delay-500">
          Prepare to experience PDFs like never before with{" "}
          <span className="text-white font-semibold">AI-powered intelligence</span>
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap justify-center gap-4 mb-12 animate-fade-in-up delay-700">
          <div className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-white font-medium flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Lightning Fast</span>
          </div>
          <div className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-white font-medium flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Smart Analysis</span>
          </div>
          <div className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-full border border-white/30 text-white font-medium flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>AI Powered</span>
          </div>
        </div>

        {/* Loading Section */}
        <div className="w-full max-w-md animate-fade-in-up delay-1000">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <Loader2 className="h-6 w-6 animate-spin text-white" />
            <span className="text-white font-medium">Initializing your experience...</span>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-white to-red-200 rounded-full transition-all duration-100 ease-out relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"></div>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <span className="text-red-100 text-sm">{progress}% Complete</span>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-12 animate-fade-in-up delay-1200">
          <div className="flex items-center space-x-2 text-red-100 animate-pulse">
            <span>Get ready to revolutionize your workflow</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        </div>
      </div>
    </div>
  );
}
