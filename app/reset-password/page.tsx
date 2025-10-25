'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { resetPassword } from '@/lib/auth';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('sending');
    setError('');

    try {
      await resetPassword(email);
      setStatus('success');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send reset email. Please try again.');
      setStatus('error');
    }
  };

  return (
    <Container className="py-12 lg:py-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl lg:text-4xl font-display mb-8 text-center">Reset Password</h1>

        {status === 'success' ? (
          <div className="space-y-6">
            <div className="p-6 border border-bmr-black bg-bmr-black/5">
              <p className="text-center mb-4">
                ✓ Password reset email sent!
              </p>
              <p className="text-sm text-muted text-center">
                Check your inbox for instructions to reset your password. The link will expire in 1 hour.
              </p>
            </div>
            <div className="text-center">
              <Link href="/login" className="text-sm text-bmr-black hover:underline font-medium">
                Return to sign in
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <p className="text-muted text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
              />
            </div>

            {error && (
              <div className="p-4 border border-border bg-border/30">
                <p className="text-sm text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'sending'}
              className="w-full px-8 py-4 bg-bmr-black text-bmr-white text-sm uppercase tracking-wider hover:bg-muted transition-colors disabled:opacity-50"
            >
              {status === 'sending' ? 'Sending...' : 'Send Reset Link'}
            </button>

            <div className="text-center pt-4">
              <Link href="/login" className="text-sm text-muted hover:text-bmr-black underline">
                Back to sign in
              </Link>
            </div>
          </form>
        )}
      </div>
    </Container>
  );
}







