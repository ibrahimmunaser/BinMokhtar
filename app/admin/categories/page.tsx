'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import { getAllCategories, addCategory, deleteCategory, updateCategory } from '@/lib/firebaseAdminStore';
import Link from 'next/link';
import { ArrowLeft, LogOut, Edit, Trash2, Plus } from 'lucide-react';

export default function CategoriesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      // Load categories from Firebase
      getAllCategories().then(cats => setCategories(cats));
    }
  }, [router, refreshKey]);

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    await addCategory(newCategory);
    setNewCategory({ name: '', description: '' });
    setShowAddModal(false);
    setRefreshKey(prev => prev + 1); // Force refresh
    alert('✓ Category saved to Firebase!');
  };

  const handleDelete = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category && category.productCount > 0) {
      alert(`Cannot delete category with ${category.productCount} products. Please move or delete the products first.`);
      return;
    }
    if (confirm('Are you sure you want to delete this category?')) {
      await deleteCategory(categoryId);
      setRefreshKey(prev => prev + 1); // Force refresh
      alert('✓ Category deleted from Firebase!');
    }
  };

  const toggleActive = async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      await updateCategory(categoryId, { active: !category.active });
      setRefreshKey(prev => prev + 1); // Force refresh
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
                <Link href="/admin/products" className="text-sm text-bmr-muted hover:text-bmr-ink">
                  Products
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <Link href="/admin" className="flex items-center gap-2 text-bmr-muted hover:text-bmr-ink mb-4">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
            <h1 className="font-display text-3xl lg:text-4xl">Categories</h1>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        <div className="bg-surface-2 rounded-lg border border-line overflow-hidden">
          <table className="w-full">
            <thead className="bg-surface-3 border-b border-line">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Description</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Products</th>
                <th className="px-6 py-4 text-left text-sm font-medium">Status</th>
                <th className="px-6 py-4 text-right text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {categories.map((category) => (
                <tr key={category.id} className="hover:bg-surface-3 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-bmr-muted">/{category.slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm text-bmr-muted">{category.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-surface-3 rounded-full text-sm">
                      {category.productCount} products
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(category.id)}
                      className={`px-3 py-1 rounded-full text-sm ${
                        category.active
                          ? 'bg-bmr-acc-green/10 text-bmr-acc-green'
                          : 'bg-bmr-muted/10 text-bmr-muted'
                      }`}
                    >
                      {category.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        className="p-2 hover:bg-surface-3 rounded transition-colors"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
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

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-2 rounded-lg max-w-md w-full p-8">
            <h2 className="font-display text-2xl mb-6">Add New Category</h2>
            
            <form onSubmit={handleAddCategory} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Category Name *</label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  required
                  placeholder="e.g., Abayas"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                  rows={3}
                  placeholder="Brief description..."
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setNewCategory({ name: '', description: '' });
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Add Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
