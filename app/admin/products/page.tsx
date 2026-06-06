'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import Link from 'next/link';
import Image from 'next/image';
import { Package, LogOut, Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { getAllProducts, deleteProduct, updateCategoryProductCounts } from '@/lib/firebaseAdminStore';

export default function AdminProductsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      loadProducts();
    }
  }, [router, refreshKey]);

  const loadProducts = async () => {
    setLoading(true);
    try {
      const loadedProducts = await getAllProducts();
      setProducts(loadedProducts);
      setFilteredProducts(loadedProducts);
    } catch (error) {
      console.error('Failed to load products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter products when search or status filter changes
  useEffect(() => {
    let filtered = [...products];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name || p.titleEn || '').toLowerCase().includes(query) ||
        (p.sku || '').toLowerCase().includes(query) ||
        (p.categoryId || '').toLowerCase().includes(query)
      );
    }
    
    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => {
        if (statusFilter === 'active') return p.status === 'ACTIVE';
        if (statusFilter === 'draft') return p.status === 'DRAFT' || !p.status;
        if (statusFilter === 'archived') return p.status === 'ARCHIVED';
        if (statusFilter === 'out-of-stock') return (p.counts?.totalStock ?? 0) === 0;
        return true;
      });
    }
    
    setFilteredProducts(filtered);
  }, [products, searchQuery, statusFilter]);

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    clearAdminSession();
    router.push('/admin/login');
  };

  const handleDelete = async (productId: string, productName: string) => {
    if (confirm(`Are you sure you want to delete "${productName}"? This cannot be undone.`)) {
      await deleteProduct(productId);
      await updateCategoryProductCounts();
      setRefreshKey(prev => prev + 1);
      alert('✓ Product deleted successfully!');
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
                <Link href="/admin/products" className="text-sm font-medium text-bmr-ink">
                  Products
                </Link>
                <Link href="/admin/orders" className="text-sm text-bmr-muted hover:text-bmr-ink">
                  Orders
                </Link>
                <Link href="/admin/categories" className="text-sm text-bmr-muted hover:text-bmr-ink">
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

      <div className="container-wide py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-bmr-ink mb-2">Products</h1>
            <p className="text-bmr-muted">
              {filteredProducts.length} of {products.length} products
            </p>
          </div>
          <Link
            href="/admin/products/create"
            className="flex items-center gap-2 px-4 py-2 bg-bmr-ink text-surface-2 rounded-lg hover:bg-bmr-fg transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-surface-2 rounded-lg border border-line p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-bmr-muted" />
              <input
                type="text"
                placeholder="Search products by name, SKU, or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink"
              />
            </div>
            
            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-bmr-muted" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink bg-surface-2"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
                <option value="out-of-stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-surface-2 rounded-lg border border-line overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full"></div>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-bmr-muted mx-auto mb-3" />
              <p className="text-bmr-muted mb-2">
                {searchQuery || statusFilter !== 'all' 
                  ? 'No products match your filters' 
                  : 'No products yet'}
              </p>
              {!searchQuery && statusFilter === 'all' && (
                <Link
                  href="/admin/products/create"
                  className="inline-flex items-center gap-2 text-bmr-ink hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Create your first product
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-3 border-b border-line">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium">Product</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Category</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Subcategory</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Price</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Stock</th>
                    <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                    <th className="px-6 py-4 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredProducts.map((product) => (
                    <tr key={product.id} className="hover:bg-surface-3 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded bg-surface-3 flex items-center justify-center overflow-hidden">
                            {product.primaryImageUrl || product.images?.[0] || product.thumbnail ? (
                              <Image
                                src={product.primaryImageUrl || product.images?.[0] || product.thumbnail}
                                alt={product.name || product.titleEn || 'Product'}
                                width={48}
                                height={48}
                                className="object-cover w-full h-full"
                              />
                            ) : (
                              <Package className="w-6 h-6 text-bmr-muted" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium">{product.name || product.titleEn || product.titleAr || 'Unnamed Product'}</p>
                            <p className="text-sm text-bmr-muted">{product.sku || 'No SKU'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-sm">
                          {product.categoryId || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-surface-3 rounded-full text-sm">
                          {product.subcategory || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium">${((product.price || product.basePrice || 0) / 100).toFixed(2)}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          (product.counts?.totalStock ?? 0) > 10
                            ? 'bg-bmr-acc-green/10 text-bmr-acc-green'
                            : (product.counts?.totalStock ?? 0) > 0
                            ? 'bg-yellow-500/10 text-yellow-600'
                            : 'bg-bmr-acc-red/10 text-bmr-acc-red'
                        }`}>
                          {product.counts?.totalStock ?? 0} units
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          product.status === 'ACTIVE'
                            ? 'bg-bmr-acc-green/10 text-bmr-acc-green'
                            : product.status === 'ARCHIVED'
                            ? 'bg-bmr-acc-red/10 text-bmr-acc-red'
                            : 'bg-bmr-muted/10 text-bmr-muted'
                        }`}>
                          {product.status || 'Draft'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/products/${product.id}`}
                            className="p-2 hover:bg-surface-3 rounded transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id, product.name || product.titleEn || 'this product')}
                            className="p-2 hover:bg-bmr-acc-red/10 text-bmr-acc-red rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

