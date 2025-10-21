'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateAdminCredentials, setAdminSession } from '@/lib/adminAuth';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate credentials
    if (validateAdminCredentials(formData.username, formData.password)) {
      setAdminSession();
      router.push('/admin');
    } else {
      setError('Invalid username or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-surface-2 rounded-lg border border-line p-8 lg:p-12">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-bmr-ink text-surface-2 mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="font-display text-3xl mb-2">Admin Login</h1>
            <p className="text-bmr-muted">Sign in to manage your store</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-2">
                Username
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
                className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                placeholder="Enter your username"
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
                className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <div className="bg-bmr-acc-red/10 border border-bmr-acc-red rounded-lg p-4">
                <p className="text-sm text-bmr-acc-red text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>

            <div className="text-center text-sm text-bmr-muted">
              <p>Authorized personnel only</p>
            </div>
          </form>
        </div>

        <div className="mt-6 text-center text-sm text-bmr-muted">
          <a href="/" className="hover:text-bmr-ink underline">
            ← Back to Store
          </a>
        </div>
      </div>
    </div>
  );
}


