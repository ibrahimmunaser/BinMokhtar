'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import Link from 'next/link';
import { ArrowLeft, LogOut, Save } from 'lucide-react';

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

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
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
                <Link href="/admin/products" className="text-sm text-bmr-muted hover:text-bmr-ink">
                  Products
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

          {/* Pricing & Currency */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Pricing & Currency</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                </select>
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
