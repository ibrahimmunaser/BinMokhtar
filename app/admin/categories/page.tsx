'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import Link from 'next/link';
import { ArrowLeft, LogOut, ChevronDown, ChevronRight } from 'lucide-react';

// Define the category structure that matches the product form and navigation
const CATEGORY_STRUCTURE = [
  {
    id: 'men',
    name: 'Men',
    slug: 'men',
    description: 'Traditional Islamic attire for men',
    subcategories: [
      { id: 'emirati', name: 'Emirati', slug: 'emirati', description: 'Emirati style thobes' },
      { id: 'saudi', name: 'Saudi', slug: 'saudi', description: 'Saudi style thobes' },
    ],
  },
  {
    id: 'boys',
    name: 'Boys',
    slug: 'boys',
    description: 'Traditional Islamic attire for boys',
    subcategories: [
      { id: 'thobes', name: 'Thobes', slug: 'thobes', description: 'Boys thobes' },
    ],
  },
  {
    id: 'shemaghs',
    name: 'Shemaghs',
    slug: 'shemaghs',
    description: 'Traditional head scarves',
    subcategories: [
      { id: 'traditional', name: 'Traditional', slug: 'traditional', description: 'Traditional shemaghs' },
      { id: 'yemeni', name: 'Yemeni', slug: 'yemeni', description: 'Yemeni style shemaghs' },
    ],
  },
];

export default function CategoriesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['men', 'boys', 'shemaghs']);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      // Fetch product counts per category
      fetchProductCounts();
    }
  }, [router]);

  const fetchProductCounts = async () => {
    try {
      const response = await fetch('/api/admin/products');
      const data = await response.json();
      if (data.success && data.products) {
        const counts: Record<string, number> = {};
        data.products.forEach((product: any) => {
          const categoryId = product.categoryId;
          const subcategory = product.subcategory;
          
          // Count by category
          if (categoryId) {
            counts[categoryId] = (counts[categoryId] || 0) + 1;
          }
          
          // Count by subcategory
          if (subcategory) {
            counts[`${categoryId}-${subcategory}`] = (counts[`${categoryId}-${subcategory}`] || 0) + 1;
          }
        });
        setProductCounts(counts);
      }
    } catch (error) {
      console.error('Error fetching product counts:', error);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
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
                <Link href="/admin/categories" className="text-sm font-medium text-bmr-ink">
                  Categories
                </Link>
                <Link href="/admin/settings" className="text-sm text-bmr-muted hover:text-bmr-ink">
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

      <div className="container-wide py-12">
        <div className="mb-8">
          <Link href="/admin" className="flex items-center gap-2 text-bmr-muted hover:text-bmr-ink mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl lg:text-4xl mb-2">Categories</h1>
          <p className="text-bmr-muted">Product categories and subcategories for your store</p>
        </div>

        <div className="bg-surface-2 rounded-lg border border-line overflow-hidden">
          <div className="p-6 border-b border-line bg-surface-3">
            <div className="grid grid-cols-12 gap-4 text-sm font-medium text-bmr-muted">
              <div className="col-span-4">Category</div>
              <div className="col-span-4">Description</div>
              <div className="col-span-2">Products</div>
              <div className="col-span-2">Status</div>
            </div>
          </div>
          
          <div className="divide-y divide-line">
            {CATEGORY_STRUCTURE.map((category) => (
              <div key={category.id}>
                {/* Main Category Row */}
                <div 
                  className="p-6 hover:bg-surface-3 transition-colors cursor-pointer"
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-4 flex items-center gap-3">
                      {expandedCategories.includes(category.id) ? (
                        <ChevronDown className="w-5 h-5 text-bmr-muted" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-bmr-muted" />
                      )}
                      <div>
                        <p className="font-semibold text-lg">{category.name}</p>
                        <p className="text-sm text-bmr-muted">/{category.slug}</p>
                      </div>
                    </div>
                    <div className="col-span-4">
                      <p className="text-bmr-muted">{category.description}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-sm font-medium">
                        {productCounts[category.name] || 0} products
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="px-3 py-1 bg-bmr-acc-green/10 text-bmr-acc-green rounded-full text-sm">
                        Active
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subcategories */}
                {expandedCategories.includes(category.id) && category.subcategories.length > 0 && (
                  <div className="bg-surface-3/50">
                    {category.subcategories.map((sub) => (
                      <div 
                        key={sub.id}
                        className="p-6 pl-16 border-t border-line/50 hover:bg-surface-3 transition-colors"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          <div className="col-span-4">
                            <div className="flex items-center gap-2">
                              <span className="text-bmr-muted">↳</span>
                              <div>
                                <p className="font-medium">{sub.name}</p>
                                <p className="text-sm text-bmr-muted">/{category.slug}/{sub.slug}</p>
                              </div>
                            </div>
                          </div>
                          <div className="col-span-4">
                            <p className="text-bmr-muted text-sm">{sub.description}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="px-3 py-1 bg-surface-3 rounded-full text-sm">
                              {productCounts[`${category.name}-${sub.name}`] || 0} products
                            </span>
                          </div>
                          <div className="col-span-2">
                            <span className="px-3 py-1 bg-bmr-acc-green/10 text-bmr-acc-green rounded-full text-sm">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ About Categories</h3>
          <p className="text-blue-800 text-sm">
            Categories are predefined to match your store navigation. When creating or editing products, 
            select the appropriate Category and Subcategory. Products will automatically appear in the 
            correct section of your storefront.
          </p>
        </div>
      </div>
    </div>
  );
}
