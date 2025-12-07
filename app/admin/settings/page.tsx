'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession, getAdminUsername, updateAdminCredentials } from '@/lib/adminAuth';
import Link from 'next/link';
import { ArrowLeft, LogOut, Save, Shield, Eye, EyeOff, Check, AlertTriangle } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState({
    storeName: 'Bin Mukhtar Retail',
    storeEmail: 'info@binmukhtarretail.com',
    storePhone: '+1 (234) 567-890',
    currency: 'USD',
    taxRate: '0',
    freeShippingThreshold: '99',
    flatShippingRate: '9.99',
  });

  // Credential management state
  const [credentialForm, setCredentialForm] = useState({
    currentUsername: '',
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [credentialError, setCredentialError] = useState('');
  const [credentialSuccess, setCredentialSuccess] = useState('');
  const [credentialLoading, setCredentialLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      // Pre-fill current username
      const username = getAdminUsername();
      if (username) {
        setCredentialForm(prev => ({ ...prev, currentUsername: username }));
      }
    }
  }, [router]);

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In production, this would save to Firebase
    console.log('Settings saved:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    alert('Settings saved successfully!');
  };

  const handleCredentialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialError('');
    setCredentialSuccess('');

    // Validation
    if (!credentialForm.currentUsername || !credentialForm.currentPassword) {
      setCredentialError('Please enter your current username and password');
      return;
    }

    if (!credentialForm.newUsername && !credentialForm.newPassword) {
      setCredentialError('Please enter a new username or password');
      return;
    }

    if (credentialForm.newPassword && credentialForm.newPassword !== credentialForm.confirmPassword) {
      setCredentialError('New passwords do not match');
      return;
    }

    if (credentialForm.newUsername && credentialForm.newUsername.length < 3) {
      setCredentialError('Username must be at least 3 characters');
      return;
    }

    if (credentialForm.newPassword && credentialForm.newPassword.length < 6) {
      setCredentialError('Password must be at least 6 characters');
      return;
    }

    setCredentialLoading(true);

    try {
      const result = await updateAdminCredentials(
        credentialForm.currentUsername,
        credentialForm.currentPassword,
        credentialForm.newUsername || undefined,
        credentialForm.newPassword || undefined
      );

      if (result.success) {
        setCredentialSuccess(result.message || 'Credentials updated successfully!');
        // Clear the form
        setCredentialForm({
          currentUsername: credentialForm.newUsername || credentialForm.currentUsername,
          currentPassword: '',
          newUsername: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        // If username changed, update the session
        if (credentialForm.newUsername) {
          // Re-authenticate with new credentials
          setTimeout(() => {
            handleLogout();
          }, 2000);
        }
      } else {
        setCredentialError(result.error || 'Failed to update credentials');
      }
    } catch (error: any) {
      setCredentialError(error.message || 'An error occurred');
    } finally {
      setCredentialLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-bmr-muted">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-1">
      {/* Header */}
      <header className="bg-surface-2 border-b border-line sticky top-0 z-50">
        <div className="container-wide py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <h1 className="font-display text-2xl">BMR Admin</h1>
              <nav className="hidden md:flex items-center gap-6">
                <Link href="/admin" className="text-sm text-bmr-muted hover:text-bmr-ink">
                  Dashboard
                </Link>
                <Link href="/admin/categories" className="text-sm text-bmr-muted hover:text-bmr-ink">
                  Categories
                </Link>
                <Link href="/admin/settings" className="text-sm font-medium text-bmr-ink">
                  Settings
                </Link>
              </nav>
            </div>

            <div className="flex items-center gap-4">
              <a href="/" target="_blank" className="text-sm text-bmr-muted hover:text-bmr-ink">
                View Store →
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-bmr-muted hover:text-bmr-acc-red"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container-narrow py-12">
        <div className="mb-8">
          <Link href="/admin" className="flex items-center gap-2 text-bmr-muted hover:text-bmr-ink mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl lg:text-4xl">Store Settings</h1>
        </div>

        {/* Admin Credentials Section */}
        <div className="bg-surface-2 rounded-lg border-2 border-bmr-ink p-6 lg:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-bmr-ink" />
            <h2 className="font-display text-xl">Admin Credentials</h2>
          </div>
          <p className="text-sm text-bmr-muted mb-6">
            Change your admin username and/or password. You&apos;ll need to log in again after changing your credentials.
          </p>

          <form onSubmit={handleCredentialSubmit} className="space-y-6">
            {/* Current Credentials */}
            <div className="bg-surface-3/50 rounded-lg p-4 border border-line">
              <h3 className="text-sm font-medium mb-4 text-bmr-muted">Current Credentials (Required)</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Current Username</label>
                  <input
                    type="text"
                    value={credentialForm.currentUsername}
                    onChange={(e) => setCredentialForm({ ...credentialForm, currentUsername: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                    placeholder="Enter current username"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={credentialForm.currentPassword}
                      onChange={(e) => setCredentialForm({ ...credentialForm, currentPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink pr-12"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bmr-muted hover:text-bmr-ink"
                    >
                      {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* New Credentials */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-bmr-muted">New Credentials (Fill in what you want to change)</h3>
              
              <div>
                <label className="block text-sm font-medium mb-2">New Username</label>
                <input
                  type="text"
                  value={credentialForm.newUsername}
                  onChange={(e) => setCredentialForm({ ...credentialForm, newUsername: e.target.value })}
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                  placeholder="Leave blank to keep current username"
                  minLength={3}
                />
                <p className="text-xs text-bmr-muted mt-1">Minimum 3 characters</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={credentialForm.newPassword}
                      onChange={(e) => setCredentialForm({ ...credentialForm, newPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink pr-12"
                      placeholder="Leave blank to keep current"
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bmr-muted hover:text-bmr-ink"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-bmr-muted mt-1">Minimum 6 characters</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={credentialForm.confirmPassword}
                      onChange={(e) => setCredentialForm({ ...credentialForm, confirmPassword: e.target.value })}
                      className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink pr-12"
                      placeholder="Confirm new password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-bmr-muted hover:text-bmr-ink"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Error/Success Messages */}
            {credentialError && (
              <div className="bg-bmr-acc-red/10 border border-bmr-acc-red rounded-lg p-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-bmr-acc-red flex-shrink-0" />
                <p className="text-sm text-bmr-acc-red">{credentialError}</p>
              </div>
            )}

            {credentialSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                <p className="text-sm text-green-700">{credentialSuccess}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={credentialLoading}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {credentialLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4" />
                  Update Credentials
                </>
              )}
            </button>
          </form>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Store Information */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Store Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Store Name</label>
                <input
                  type="text"
                  value={settings.storeName}
                  onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Store Email</label>
                  <input
                    type="email"
                    value={settings.storeEmail}
                    onChange={(e) => setSettings({ ...settings, storeEmail: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Store Phone</label>
                  <input
                    type="tel"
                    value={settings.storePhone}
                    onChange={(e) => setSettings({ ...settings, storePhone: e.target.value })}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Pricing</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <div className="w-full px-4 py-3 border border-line rounded-lg bg-surface-3 text-bmr-muted">
                  USD - US Dollar
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Tax Rate (%)</label>
                <input
                  type="number"
                  value={settings.taxRate}
                  onChange={(e) => setSettings({ ...settings, taxRate: e.target.value })}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Shipping Settings</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Free Shipping Threshold ($)</label>
                <input
                  type="number"
                  value={settings.freeShippingThreshold}
                  onChange={(e) => setSettings({ ...settings, freeShippingThreshold: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
                <p className="text-xs text-bmr-muted mt-1">Orders above this amount ship free</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Flat Shipping Rate ($)</label>
                <input
                  type="number"
                  value={settings.flatShippingRate}
                  onChange={(e) => setSettings({ ...settings, flatShippingRate: e.target.value })}
                  min="0"
                  step="0.01"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
                <p className="text-xs text-bmr-muted mt-1">Standard shipping cost</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <Link href="/admin" className="btn-ghost">
              Cancel
            </Link>
            <div className="flex items-center gap-4">
              {saved && (
                <p className="text-sm text-bmr-acc-green">✓ Settings saved</p>
              )}
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Settings
              </button>
            </div>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-12 bg-bmr-acc-red/5 rounded-lg border-2 border-bmr-acc-red/20 p-6 lg:p-8">
          <h2 className="font-display text-xl mb-4 text-bmr-acc-red">Danger Zone</h2>
          <p className="text-sm text-bmr-muted mb-6">
            These actions are irreversible. Please be careful.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-6 py-3 bg-bmr-acc-red text-surface-2 rounded-lg hover:bg-bmr-acc-red/90 transition-colors text-sm font-medium">
              Clear All Products
            </button>
            <button className="px-6 py-3 border-2 border-bmr-acc-red text-bmr-acc-red rounded-lg hover:bg-bmr-acc-red/10 transition-colors text-sm font-medium">
              Reset All Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
