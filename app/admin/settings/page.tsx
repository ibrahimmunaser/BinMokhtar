'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession, getAdminUsername, updateAdminCredentials } from '@/lib/adminAuth';
import Link from 'next/link';
import { ArrowLeft, LogOut, Save, Lock, Eye, EyeOff, User, Key, CheckCircle, AlertCircle } from 'lucide-react';

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

  // Credentials state
  const [currentUsername, setCurrentUsername] = useState('');
  const [credentials, setCredentials] = useState({
    currentPassword: '',
    newUsername: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [credentialsLoading, setCredentialsLoading] = useState(false);
  const [credentialsMessage, setCredentialsMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      // Fetch current username
      getAdminUsername().then(setCurrentUsername);
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

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCredentialsMessage(null);
    
    // Validation
    if (!credentials.currentPassword) {
      setCredentialsMessage({ type: 'error', text: 'Current password is required' });
      return;
    }
    
    if (!credentials.newUsername && !credentials.newPassword) {
      setCredentialsMessage({ type: 'error', text: 'Please enter a new username or password' });
      return;
    }
    
    if (credentials.newPassword && credentials.newPassword !== credentials.confirmPassword) {
      setCredentialsMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    
    if (credentials.newPassword && credentials.newPassword.length < 6) {
      setCredentialsMessage({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    
    if (credentials.newUsername && credentials.newUsername.length < 3) {
      setCredentialsMessage({ type: 'error', text: 'Username must be at least 3 characters' });
      return;
    }
    
    setCredentialsLoading(true);
    
    try {
      const result = await updateAdminCredentials(
        credentials.currentPassword,
        credentials.newUsername || undefined,
        credentials.newPassword || undefined
      );
      
      if (result.success) {
        setCredentialsMessage({ type: 'success', text: 'Credentials updated successfully!' });
        // Update displayed username
        if (credentials.newUsername) {
          setCurrentUsername(credentials.newUsername);
        }
        // Clear form
        setCredentials({
          currentPassword: '',
          newUsername: '',
          newPassword: '',
          confirmPassword: '',
        });
        
        // If password was changed, log out after 2 seconds
        if (credentials.newPassword) {
          setTimeout(() => {
            clearAdminSession();
            router.push('/admin/login');
          }, 2000);
        }
      } else {
        setCredentialsMessage({ type: 'error', text: result.error || 'Failed to update credentials' });
      }
    } catch (error) {
      setCredentialsMessage({ type: 'error', text: 'An error occurred. Please try again.' });
    } finally {
      setCredentialsLoading(false);
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

        {/* Login Credentials Section */}
        <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-bmr-night/10 rounded-lg">
              <Key className="w-5 h-5 text-bmr-night" />
            </div>
            <div>
              <h2 className="font-display text-xl">Login Credentials</h2>
              <p className="text-sm text-bmr-muted">Change your admin username and password</p>
            </div>
          </div>

          {/* Current Username Display */}
          <div className="mb-6 p-4 bg-surface-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-bmr-muted">
              <User className="w-4 h-4" />
              <span>Current Username:</span>
              <span className="font-medium text-bmr-ink">{currentUsername || 'Loading...'}</span>
            </div>
          </div>

          <form onSubmit={handleCredentialsSubmit} className="space-y-6">
            {/* Current Password */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Current Password <span className="text-bmr-acc-red">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-bmr-muted" />
                </div>
                <input
                  type={showPasswords.current ? 'text' : 'password'}
                  value={credentials.currentPassword}
                  onChange={(e) => setCredentials({ ...credentials, currentPassword: e.target.value })}
                  className="w-full pl-10 pr-12 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                  placeholder="Enter current password"
                  disabled={credentialsLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  tabIndex={-1}
                >
                  {showPasswords.current ? (
                    <EyeOff className="h-5 w-5 text-bmr-muted hover:text-bmr-ink" />
                  ) : (
                    <Eye className="h-5 w-5 text-bmr-muted hover:text-bmr-ink" />
                  )}
                </button>
              </div>
            </div>

            <hr className="border-line" />

            {/* New Username */}
            <div>
              <label className="block text-sm font-medium mb-2">New Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-bmr-muted" />
                </div>
                <input
                  type="text"
                  value={credentials.newUsername}
                  onChange={(e) => setCredentials({ ...credentials, newUsername: e.target.value })}
                  className="w-full pl-10 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                  placeholder="Enter new username (leave empty to keep current)"
                  disabled={credentialsLoading}
                  minLength={3}
                />
              </div>
              <p className="text-xs text-bmr-muted mt-1">Minimum 3 characters</p>
            </div>

            {/* New Password */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-bmr-muted" />
                  </div>
                  <input
                    type={showPasswords.new ? 'text' : 'password'}
                    value={credentials.newPassword}
                    onChange={(e) => setCredentials({ ...credentials, newPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                    placeholder="Enter new password"
                    disabled={credentialsLoading}
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    tabIndex={-1}
                  >
                    {showPasswords.new ? (
                      <EyeOff className="h-5 w-5 text-bmr-muted hover:text-bmr-ink" />
                    ) : (
                      <Eye className="h-5 w-5 text-bmr-muted hover:text-bmr-ink" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-bmr-muted mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-bmr-muted" />
                  </div>
                  <input
                    type={showPasswords.confirm ? 'text' : 'password'}
                    value={credentials.confirmPassword}
                    onChange={(e) => setCredentials({ ...credentials, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-12 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                    placeholder="Confirm new password"
                    disabled={credentialsLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    tabIndex={-1}
                  >
                    {showPasswords.confirm ? (
                      <EyeOff className="h-5 w-5 text-bmr-muted hover:text-bmr-ink" />
                    ) : (
                      <Eye className="h-5 w-5 text-bmr-muted hover:text-bmr-ink" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Credentials Message */}
            {credentialsMessage && (
              <div className={`p-4 rounded-lg flex items-center gap-3 ${
                credentialsMessage.type === 'success' 
                  ? 'bg-bmr-acc-green/10 border border-bmr-acc-green/20' 
                  : 'bg-bmr-acc-red/10 border border-bmr-acc-red/20'
              }`}>
                {credentialsMessage.type === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-bmr-acc-green flex-shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-bmr-acc-red flex-shrink-0" />
                )}
                <p className={`text-sm ${
                  credentialsMessage.type === 'success' ? 'text-bmr-acc-green' : 'text-bmr-acc-red'
                }`}>
                  {credentialsMessage.text}
                  {credentialsMessage.type === 'success' && credentials.newPassword && (
                    <span className="block mt-1 text-xs opacity-80">
                      You will be logged out in 2 seconds...
                    </span>
                  )}
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={credentialsLoading}
                className="inline-flex items-center gap-2 px-6 py-3 bg-bmr-night text-surface-2 rounded-lg font-medium hover:bg-bmr-night/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {credentialsLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Update Credentials
                  </>
                )}
              </button>
            </div>
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
