'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/layout/Container';
import { signInWithEmail, signInWithGoogle } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signInWithEmail(formData.email, formData.password);
      router.push('/account');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
      router.push('/account');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Failed to sign in with Google.');
    }
  };

  return (
    <Container className="py-12 lg:py-20">
      <div className="max-w-md mx-auto">
        <h1 className="text-3xl lg:text-4xl font-display mb-8 text-center">Sign In</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="w-full px-4 py-3 border border-border focus:outline-none focus:border-bmr-black"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
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
            disabled={loading}
            className="w-full px-8 py-4 bg-bmr-black text-bmr-white text-sm uppercase tracking-wider hover:bg-muted transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center">
            <Link href="/reset-password" className="text-sm text-muted hover:text-bmr-black underline">
              Forgot your password?
            </Link>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-bmr-white text-muted">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full px-8 py-4 border border-border text-sm uppercase tracking-wider hover:bg-border/30 transition-colors"
          >
            Sign in with Google
          </button>

          <div className="text-center pt-4">
            <p className="text-sm text-muted">
              Don't have an account?{' '}
              <Link href="/register" className="text-bmr-black hover:underline font-medium">
                Create one
              </Link>
            </p>
          </div>
        </form>
      </div>
    </Container>
  );
}







