'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { validateAdminCredentialsAsync, setAdminSession } from '@/lib/adminAuth';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('🔐 AdminLoginPage: Form submitted');
    
    setError('');
    setLoading(true);

    try {
      // Validate credentials against Firebase
      const isValid = await validateAdminCredentialsAsync(formData.username, formData.password);
      console.log('🔐 AdminLoginPage: Validation result:', isValid);
      
      if (isValid) {
        console.log('✅ AdminLoginPage: Credentials valid, setting session...');
        setAdminSession();
        console.log('✅ AdminLoginPage: Redirecting to /admin...');
        router.push('/admin');
      } else {
        console.error('❌ AdminLoginPage: Invalid credentials');
        setError('Invalid username or password');
        setLoading(false);
      }
    } catch (err) {
      console.error('❌ AdminLoginPage: Login error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bmr-night via-bmr-night/95 to-bmr-night flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-surface-2 rounded-2xl mb-4 shadow-lg">
            <Lock className="w-8 h-8 text-bmr-ink" />
          </div>
          <h1 className="font-display text-3xl text-surface-2 mb-2">Admin Portal</h1>
          <p className="text-surface-2/60 text-sm">Bin Mukhtar Retail</p>
        </div>

        {/* Login Form */}
        <div className="bg-surface-2 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-bmr-ink mb-2">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-bmr-muted" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="block w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink/20 focus:border-bmr-ink transition-colors"
                  placeholder="Enter username"
                  required
                  disabled={loading}
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-bmr-ink mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-bmr-muted" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="block w-full pl-10 pr-12 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink/20 focus:border-bmr-ink transition-colors"
                  placeholder="Enter password"
                  required
                  disabled={loading}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-bmr-muted hover:text-bmr-ink transition-colors" />
                  ) : (
                    <Eye className="h-5 w-5 text-bmr-muted hover:text-bmr-ink transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-bmr-acc-red/10 border border-bmr-acc-red/20 rounded-lg">
                <p className="text-sm text-bmr-acc-red text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-bmr-night text-surface-2 rounded-lg font-medium hover:bg-bmr-night/90 focus:outline-none focus:ring-2 focus:ring-bmr-night/20 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Back to Store Link */}
          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-bmr-muted hover:text-bmr-ink transition-colors"
            >
              ← Back to Store
            </a>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-surface-2/40 text-xs mt-6">
          Protected admin area. Authorized personnel only.
        </p>
      </div>
    </div>
  );
}
