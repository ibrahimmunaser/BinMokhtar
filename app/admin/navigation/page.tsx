'use client';

import { Container } from '@/components/layout/Container';
import { useNavigation } from '@/hooks/useData';
import Link from 'next/link';
import { Plus } from 'lucide-react';

export default function AdminNavigationPage() {
  const { navigation, isLoading } = useNavigation();

  return (
    <Container narrow className="py-12">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Navigation Menu</h1>
        <button className="flex items-center gap-2 px-6 py-3 bg-bmr-black text-bmr-white text-sm uppercase tracking-wideish hover:bg-bmr-black/90">
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted py-12">Loading navigation...</div>
      ) : (
        <div className="space-y-8">
          <section className="border border-border p-6">
            <h2 className="text-xl font-display mb-4">Navigation Items</h2>
            <div className="space-y-3">
              {navigation.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 border border-border hover:bg-border/30">
                  <div>
                    <div className="font-medium">{item.labelEn} / {item.labelAr}</div>
                    {item.href && <div className="text-sm text-muted">{item.href}</div>}
                    {item.children && (
                      <div className="text-xs text-muted mt-1">{item.children.length} subitems</div>
                    )}
                  </div>
                  <button className="text-sm hover:underline">Edit</button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      <div className="mt-8">
        <Link href="/admin" className="text-sm text-muted hover:text-bmr-black">
          ← Back to Dashboard
        </Link>
      </div>
    </Container>
  );
}




