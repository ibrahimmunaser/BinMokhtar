'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, LogOut, Package, ChevronDown, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export function AccountDropdown() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);
  
  const handleSignOut = async () => {
    setIsOpen(false);
    await signOut();
    router.push('/');
  };
  
  // Don't render until mounted to avoid hydration issues
  if (!mounted || isLoading) {
    return (
      <div className="text-bmr-black">
        <User className="w-5 h-5" />
      </div>
    );
  }
  
  // Logged out state
  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="text-bmr-black hover:text-muted transition-colors flex items-center gap-1"
        aria-label="Sign in"
      >
        <User className="w-5 h-5" />
        <span className="hidden lg:inline text-sm font-medium">Sign in</span>
      </Link>
    );
  }
  
  // Logged in state
  const displayName = user?.displayName || user?.profile?.firstName || user?.email?.split('@')[0] || 'Account';
  const initials = getInitials(displayName);
  const hasAvatar = user?.photoURL || user?.profile?.photoURL;
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-bmr-black hover:text-muted transition-colors"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {hasAvatar ? (
          <img
            src={user?.photoURL || user?.profile?.photoURL || ''}
            alt={displayName}
            className="w-7 h-7 rounded-full object-cover border border-border"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-bmr-night text-surface-2 flex items-center justify-center text-xs font-medium">
            {initials}
          </div>
        )}
        <span className="hidden lg:flex items-center gap-1">
          <span className="text-sm font-medium max-w-[100px] truncate">
            Hi, {displayName.split(' ')[0]}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-surface-2 border border-border rounded-lg shadow-lg py-2 z-50">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-bmr-black truncate">{displayName}</p>
            <p className="text-xs text-muted truncate">{user?.email}</p>
          </div>
          
          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-bmr-black hover:bg-surface-3 transition-colors"
            >
              <User className="w-4 h-4 text-muted" />
              Profile
            </Link>
            
            <Link
              href="/profile#orders"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-bmr-black hover:bg-surface-3 transition-colors"
            >
              <Package className="w-4 h-4 text-muted" />
              Order History
            </Link>
          </div>
          
          {/* Sign Out */}
          <div className="border-t border-border pt-1">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

