'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/adminAuth';

export default function NewProductPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      // Redirect to the unified create product page
      router.replace('/admin/products/create');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-surface-1 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-bmr-muted">Redirecting...</p>
      </div>
    </div>
  );
}
