'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import Link from 'next/link';
import { Package, Tag, ShoppingCart, FileText, LogOut, Plus, Edit, Trash2 } from 'lucide-react';
import { getAllProducts, deleteProduct, updateCategoryProductCounts } from '@/lib/firebaseAdminStore';

export default function AdminDashboard() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      // Load products from Firebase
      getAllProducts().then(products => setProducts(products));
    }
  }, [router, refreshKey]);

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(productId);
      await updateCategoryProductCounts();
      setRefreshKey(prev => prev + 1); // Force refresh
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
                <Link href="/admin" className="text-sm font-medium text-bmr-ink">
                  Dashboard
                </Link>
                <Link href="/admin/products" className="text-sm text-bmr-muted hover:text-bmr-ink">
                  Products
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

      <div className="container-wide py-12">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="bg-surface-2 rounded-lg border border-line p-6">
            <div className="flex items-center justify-between mb-4">
              <Package className="w-8 h-8 text-bmr-ink" />
            </div>
            <p className="text-3xl font-display mb-2">{products.length}</p>
            <p className="text-sm text-bmr-muted">Total Products</p>
          </div>

          <div className="bg-surface-2 rounded-lg border border-line p-6">
            <div className="flex items-center justify-between mb-4">
              <Tag className="w-8 h-8 text-bmr-acc-green" />
            </div>
            <p className="text-3xl font-display mb-2">4</p>
            <p className="text-sm text-bmr-muted">Categories</p>
          </div>

          <div className="bg-surface-2 rounded-lg border border-line p-6">
            <div className="flex items-center justify-between mb-4">
              <ShoppingCart className="w-8 h-8 text-bmr-stone" />
            </div>
            <p className="text-3xl font-display mb-2">{products.filter(p => p.stock > 0).length}</p>
            <p className="text-sm text-bmr-muted">In Stock</p>
          </div>

          <div className="bg-surface-2 rounded-lg border border-line p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-bmr-muted" />
            </div>
            <p className="text-3xl font-display mb-2">{products.filter(p => p.compareAtPrice).length}</p>
            <p className="text-sm text-bmr-muted">On Sale</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-surface-2 rounded-lg border border-line p-6 mb-12">
          <h2 className="font-display text-xl mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/admin/products/new"
              className="flex items-center gap-3 p-4 bg-bmr-ink text-surface-2 rounded-lg hover:bg-bmr-fg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Add New Product</span>
            </Link>
            <Link
              href="/admin/categories"
              className="flex items-center gap-3 p-4 border-2 border-line rounded-lg hover:bg-surface-3 transition-colors"
            >
              <Tag className="w-5 h-5" />
              <span className="font-medium">Manage Categories</span>
            </Link>
            <Link
              href="/admin/settings"
              className="flex items-center gap-3 p-4 border-2 border-line rounded-lg hover:bg-surface-3 transition-colors"
            >
              <FileText className="w-5 h-5" />
              <span className="font-medium">Store Settings</span>
            </Link>
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-surface-2 rounded-lg border border-line overflow-hidden">
          <div className="p-6 border-b border-line flex items-center justify-between">
            <h2 className="font-display text-xl">Products</h2>
            <Link href="/admin/products/new" className="btn-primary text-sm">
              <Plus className="w-4 h-4 inline mr-2" />
              Add Product
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-3 border-b border-line">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-3 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded bg-surface-3 flex items-center justify-center">
                          <Package className="w-6 h-6 text-bmr-muted" />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-bmr-muted">{product.subtitle}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-3 py-1 bg-surface-3 rounded-full text-sm">
                        {product.categoryId}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium">${(product.price / 100).toFixed(2)}</p>
                        {product.compareAtPrice && (
                          <p className="text-sm text-bmr-muted line-through">
                            ${(product.compareAtPrice / 100).toFixed(2)}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        product.stock > 10
                          ? 'bg-bmr-acc-green/10 text-bmr-acc-green'
                          : product.stock > 0
                          ? 'bg-yellow-500/10 text-yellow-600'
                          : 'bg-bmr-acc-red/10 text-bmr-acc-red'
                      }`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-sm ${
                        product.published
                          ? 'bg-bmr-acc-green/10 text-bmr-acc-green'
                          : 'bg-bmr-muted/10 text-bmr-muted'
                      }`}>
                        {product.published ? 'Published' : 'Draft'}
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
                          onClick={() => handleDelete(product.id)}
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
        </div>
      </div>
    </div>
  );
}
