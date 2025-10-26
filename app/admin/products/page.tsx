'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import { getAllProducts, deleteProduct, getAllCategories, updateCategoryProductCounts } from '@/lib/firebaseAdminStore';
import Link from 'next/link';
import { Plus, LogOut, Edit, Trash2, Filter } from 'lucide-react';

export default function AdminProductsPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      loadData();
    }
  }, [router]);

  const loadData = async () => {
    setIsLoading(true);
    const [productsData, categoriesData] = await Promise.all([
      getAllProducts(),
      getAllCategories()
    ]);
    setProducts(productsData);
    setCategories(categoriesData);
    setIsLoading(false);
  };

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      await deleteProduct(productId);
      await updateCategoryProductCounts();
      loadData(); // Reload products
      alert('✓ Product deleted successfully!');
    }
  };

  const getCategoryName = (categoryId: string) => {
    // categoryId is already the category name (Men, Women, Boys, Girls, etc.)
    // Just return it directly, or try to find it in categories list
    if (!categoryId) return 'Unknown';
    
    // Check if it's a Firestore ID by looking it up
    const category = categories.find(c => c.id === categoryId);
    if (category) return category.name;
    
    // Otherwise, it's likely already the category name (Men, Women, etc.)
    return categoryId;
  };

  const formatPrice = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.categoryId === selectedCategory);

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
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl mb-2">Products</h2>
            <p className="text-bmr-muted">
              Manage your product catalog ({filteredProducts.length} {selectedCategory === 'all' ? 'total' : 'in category'})
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/products/create"
              className="flex items-center gap-2 px-6 py-3 bg-bmr-acc-green text-surface-2 rounded-lg hover:bg-bmr-acc-green/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Product (Firestore)
            </Link>
            <Link
              href="/admin/products/new"
              className="flex items-center gap-2 px-6 py-3 bg-bmr-ink text-surface-2 rounded-lg hover:bg-bmr-fg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Product (Local)
            </Link>
          </div>
        </div>

        {/* Category Filter */}
        <div className="bg-surface-2 rounded-lg border border-line p-6 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Filter className="w-4 h-4" />
              Filter by Category:
            </div>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-bmr-ink text-surface-2'
                    : 'bg-surface-3 text-bmr-muted hover:bg-line'
                }`}
              >
                All Products ({products.length})
              </button>
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-bmr-ink text-surface-2'
                      : 'bg-surface-3 text-bmr-muted hover:bg-line'
                  }`}
                >
                  {category.name} ({products.filter(p => p.categoryId === category.id).length})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Products Table */}
        {isLoading ? (
          <div className="bg-surface-2 rounded-lg border border-line p-12 text-center">
            <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-bmr-muted">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-surface-2 rounded-lg border border-line p-12 text-center">
            <p className="text-bmr-muted mb-4">No products found {selectedCategory !== 'all' && 'in this category'}</p>
            <Link
              href="/admin/products/new"
              className="inline-flex items-center gap-2 px-6 py-3 bg-bmr-ink text-surface-2 rounded-lg hover:bg-bmr-fg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Your First Product
            </Link>
          </div>
        ) : (
          <div className="bg-surface-2 rounded-lg border border-line overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-3 border-b border-line">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium">Image</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Stock</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-surface-3 transition-colors">
                    <td className="px-6 py-4">
                      <div className="w-16 h-16 rounded-lg overflow-hidden bg-surface-3">
                        <img
                          src={product.thumbnail || product.images?.[0] || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{product.name}</div>
                      {product.subtitle && (
                        <div className="text-sm text-bmr-muted mt-1">{product.subtitle}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm">{getCategoryName(product.categoryId)}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {formatPrice(product.price)}
                        {product.compareAtPrice && (
                          <span className="ml-2 text-bmr-muted line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-sm ${
                        product.stock === 0 
                          ? 'text-bmr-acc-red' 
                          : product.stock < 10 
                            ? 'text-orange-500' 
                            : 'text-bmr-acc-green'
                      }`}>
                        {product.stock} units
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs ${
                          product.published 
                            ? 'bg-bmr-acc-green/10 text-bmr-acc-green' 
                            : 'bg-bmr-muted/10 text-bmr-muted'
                        }`}
                      >
                        {product.published ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="p-2 hover:bg-surface-3 rounded-lg transition-colors"
                          title="Edit product"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="p-2 hover:bg-bmr-acc-red/10 text-bmr-acc-red rounded-lg transition-colors"
                          title="Delete product"
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
  );
}



