'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    if (error) setMessage(error.message);
    else setMessage('Password reset link sent to your email.');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Reset Password</h2>
        {message && <p>{message}</p>}
        <form onSubmit={handleReset} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-400"
          />
          <button type="submit" className="w-full py-2 bg-orange-500 text-white rounded-md">
            Send Reset Link
          </button>
        </form>
        <div className="text-center mt-4 text-sm">
          <a href="/login" className="text-orange-500 hover:underline">Back to login</a>
        </div>
      </div>
    </div>
  );
}
