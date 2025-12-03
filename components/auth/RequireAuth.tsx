'use client';

/**
 * RequireAuth Component
 * Wraps protected pages and redirects to login if not authenticated
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function RequireAuth({ 
  children, 
  redirectTo,
  fallback 
}: RequireAuthProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
      const loginUrl = redirectTo 
        ? `/login?redirect=${encodeURIComponent(redirectTo)}`
        : `/login?redirect=${encodeURIComponent(currentPath)}`;
      router.push(loginUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectTo]);
  
  if (isLoading) {
    return fallback || (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-bmr-muted" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return null;
  }
  
  return <>{children}</>;
}

