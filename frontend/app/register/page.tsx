// app/(auth)/register/page.tsx
"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { registerUser } from '@/app/lib/api';
import Link from 'next/link';
import { UserPlus, Loader2, Chrome, Apple } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/api/auth/google`;
  };

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await registerUser(formData);
      login(data.token);
      router.push('/upload'); // Redirect to upload page on successful registration
    } catch (err) {
      setError('User already exists or failed to register.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-slate-800 rounded-xl shadow-2xl">
        <div className="text-center">
            <UserPlus className="mx-auto h-12 w-12 text-blue-500"/>
            <h1 className="text-3xl font-bold text-white mt-4">Create an Account</h1>
        </div>

        {/* Social Logins */}
        <div className="space-y-4">
          <button onClick={handleGoogleLogin} className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-md text-white font-medium transition-colors">
            <Chrome size={20} /> Continue with Google
          </button>
          <button className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-slate-700 hover:bg-slate-600 rounded-md text-white font-medium transition-colors">
            <Apple size={20} /> Continue with Apple
          </button>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-600" /></div>
          <div className="relative flex justify-center text-sm"><span className="bg-slate-800 px-2 text-slate-400">OR</span></div>
        </div>

        {/* Email and Password Form */}
        <form onSubmit={onSubmit} className="space-y-4">
          <input name="email" type="email" value={formData.email} onChange={onChange} placeholder="Email Address" required className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"/>
          <input name="password" type="password" value={formData.password} onChange={onChange} placeholder="Password" required className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm"/>
          <button type="submit" disabled={loading} className="w-full flex justify-center py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium disabled:bg-slate-500">
            {loading ? <Loader2 className="animate-spin"/> : 'Create Account'}
          </button>
          {error && <p className="text-red-400 text-center text-sm">{error}</p>}
        </form>

        <p className="text-center text-sm text-slate-400">
          Already have an account? <Link href="/login" className="text-blue-400 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
