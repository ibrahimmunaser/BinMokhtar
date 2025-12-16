'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import { getAllSubcategories, addSubcategory, updateSubcategory, deleteSubcategory } from '@/lib/firebaseAdminStore';
import Link from 'next/link';
import { ArrowLeft, LogOut, ChevronDown, ChevronRight, Plus, Edit2, Trash2, X, Check, Loader2 } from 'lucide-react';

// Define the main category structure (these are the parent categories)
const MAIN_CATEGORIES = [
  {
    id: 'Men',
    name: 'Men',
    slug: 'men',
    description: 'Traditional Islamic attire for men',
  },
  {
    id: 'Women',
    name: 'Women',
    slug: 'women',
    description: 'Traditional Islamic attire for women',
  },
  {
    id: 'Boys',
    name: 'Boys',
    slug: 'boys',
    description: 'Traditional Islamic attire for boys',
  },
  {
    id: 'Girls',
    name: 'Girls',
    slug: 'girls',
    description: 'Traditional Islamic attire for girls',
  },
  {
    id: 'Shemaghs',
    name: 'Shemaghs',
    slug: 'shemaghs',
    description: 'Traditional head scarves',
  },
];

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  parentCategoryId: string;
  active: boolean;
}

export default function CategoriesPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['Men', 'Boys', 'Shemaghs']);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null);
  
  // Form states
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSlug, setFormSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

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
    try {
      // Fetch subcategories (API will auto-seed defaults if empty)
      const subs = await getAllSubcategories();
      setSubcategories(subs);
      
      // Fetch product counts
      await fetchProductCounts();
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          
          // Count by subcategory slug
          if (subcategory) {
            const key = `${categoryId}-${subcategory}`;
            counts[key] = (counts[key] || 0) + 1;
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

  // Get subcategories for a specific parent category
  const getSubcategoriesForCategory = (categoryId: string): Subcategory[] => {
    return subcategories.filter(sub => sub.parentCategoryId === categoryId);
  };

  // Add subcategory
  const handleAddSubcategory = (categoryId: string) => {
    setSelectedCategory(categoryId);
    setFormName('');
    setFormDescription('');
    setFormSlug('');
    setError('');
    setShowAddModal(true);
  };

  const handleSaveNewSubcategory = async () => {
    if (!formName.trim()) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const newSub = await addSubcategory({
        name: formName.trim(),
        description: formDescription.trim(),
        slug: formSlug.trim() || formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        parentCategoryId: selectedCategory,
      });
      
      setSubcategories(prev => [...prev, newSub]);
      setShowAddModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to create subcategory');
    } finally {
      setIsSaving(false);
    }
  };

  // Edit subcategory
  const handleEditSubcategory = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
    setFormName(subcategory.name);
    setFormDescription(subcategory.description || '');
    setFormSlug(subcategory.slug);
    setError('');
    setShowEditModal(true);
  };

  const handleSaveEditSubcategory = async () => {
    if (!formName.trim() || !selectedSubcategory) {
      setError('Name is required');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      await updateSubcategory(selectedSubcategory.id, {
        name: formName.trim(),
        description: formDescription.trim(),
        slug: formSlug.trim() || formName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      });
      
      setSubcategories(prev => prev.map(sub => 
        sub.id === selectedSubcategory.id 
          ? { ...sub, name: formName.trim(), description: formDescription.trim(), slug: formSlug.trim() }
          : sub
      ));
      setShowEditModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update subcategory');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete subcategory
  const handleDeleteSubcategory = (subcategory: Subcategory) => {
    setSelectedSubcategory(subcategory);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!selectedSubcategory) return;

    setIsSaving(true);
    setError('');

    try {
      await deleteSubcategory(selectedSubcategory.id);
      setSubcategories(prev => prev.filter(sub => sub.id !== selectedSubcategory.id));
      setShowDeleteModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete subcategory');
    } finally {
      setIsSaving(false);
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
          <h1 className="font-display text-3xl lg:text-4xl mb-2">Categories & Subcategories</h1>
          <p className="text-bmr-muted">Manage product categories and create custom subcategories for your store</p>
        </div>

        {isLoading ? (
          <div className="bg-surface-2 rounded-lg border border-line p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-bmr-ink" />
            <p className="text-bmr-muted">Loading categories...</p>
          </div>
        ) : (
          <div className="bg-surface-2 rounded-lg border border-line overflow-hidden">
            <div className="p-6 border-b border-line bg-surface-3">
              <div className="grid grid-cols-12 gap-4 text-sm font-medium text-bmr-muted">
                <div className="col-span-4">Category / Subcategory</div>
                <div className="col-span-3">Description</div>
                <div className="col-span-2">Products</div>
                <div className="col-span-1">Status</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
            </div>
            
            <div className="divide-y divide-line">
              {MAIN_CATEGORIES.map((category) => {
                const categorySubcategories = getSubcategoriesForCategory(category.id);
                
                return (
                  <div key={category.id}>
                    {/* Main Category Row */}
                    <div className="p-6 hover:bg-surface-3 transition-colors">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4 flex items-center gap-3">
                          <button
                            onClick={() => toggleCategory(category.id)}
                            className="p-1 hover:bg-surface-3 rounded"
                          >
                            {expandedCategories.includes(category.id) ? (
                              <ChevronDown className="w-5 h-5 text-bmr-muted" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-bmr-muted" />
                            )}
                          </button>
                          <div>
                            <p className="font-semibold text-lg">{category.name}</p>
                            <p className="text-sm text-bmr-muted">/{category.slug}</p>
                          </div>
                        </div>
                        <div className="col-span-3">
                          <p className="text-bmr-muted text-sm">{category.description}</p>
                        </div>
                        <div className="col-span-2">
                          <span className="px-3 py-1 bg-blue-500/10 text-blue-600 rounded-full text-sm font-medium">
                            {productCounts[category.name] || 0} products
                          </span>
                        </div>
                        <div className="col-span-1">
                          <span className="px-3 py-1 bg-bmr-acc-green/10 text-bmr-acc-green rounded-full text-sm">
                            Active
                          </span>
                        </div>
                        <div className="col-span-2 text-right">
                          <button
                            onClick={() => handleAddSubcategory(category.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-bmr-ink bg-surface-3 hover:bg-bmr-ink hover:text-white rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Add Subcategory
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subcategories */}
                    {expandedCategories.includes(category.id) && (
                      <div className="bg-surface-3/50">
                        {categorySubcategories.length === 0 ? (
                          <div className="p-6 pl-16 text-bmr-muted text-sm border-t border-line/50">
                            No subcategories yet. Click "Add Subcategory" to create one.
                          </div>
                        ) : (
                          categorySubcategories.map((sub) => (
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
                                <div className="col-span-3">
                                  <p className="text-bmr-muted text-sm">{sub.description || '-'}</p>
                                </div>
                                <div className="col-span-2">
                                  <span className="px-3 py-1 bg-surface-3 rounded-full text-sm">
                                    {productCounts[`${category.name}-${sub.slug}`] || 0} products
                                  </span>
                                </div>
                                <div className="col-span-1">
                                  <span className={`px-3 py-1 rounded-full text-sm ${
                                    sub.active !== false 
                                      ? 'bg-bmr-acc-green/10 text-bmr-acc-green' 
                                      : 'bg-gray-100 text-gray-500'
                                  }`}>
                                    {sub.active !== false ? 'Active' : 'Inactive'}
                                  </span>
                                </div>
                                <div className="col-span-2 flex items-center justify-end gap-2">
                                  <button
                                    onClick={() => handleEditSubcategory(sub)}
                                    className="p-2 text-bmr-muted hover:text-bmr-ink hover:bg-surface-2 rounded-lg transition-colors"
                                    title="Edit subcategory"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubcategory(sub)}
                                    className="p-2 text-bmr-muted hover:text-bmr-acc-red hover:bg-red-50 rounded-lg transition-colors"
                                    title="Delete subcategory"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-900 mb-2">ℹ️ How Subcategories Work</h3>
          <p className="text-blue-800 text-sm">
            Subcategories help organize your products within main categories. You can add, edit, or delete 
            any subcategory using the buttons provided. Changes will automatically appear in the product 
            creation form, shop filters, and navigation. Products assigned to a subcategory will be filterable by shoppers.
          </p>
        </div>
      </div>

      {/* Add Subcategory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-2 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-line">
              <h2 className="font-display text-xl">Add Subcategory to {selectedCategory}</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-surface-3 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  placeholder="e.g., Emirati Thobes"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug (URL-friendly name)</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  placeholder="e.g., emirati-thobes (auto-generated if empty)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  rows={3}
                  placeholder="Brief description of this subcategory"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-line">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-bmr-muted hover:text-bmr-ink"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewSubcategory}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-bmr-ink text-white rounded-lg hover:bg-bmr-fg disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Create Subcategory
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Subcategory Modal */}
      {showEditModal && selectedSubcategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-2 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-line">
              <h2 className="font-display text-xl">Edit Subcategory</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-surface-3 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-2">Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Slug</label>
                <input
                  type="text"
                  value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value)}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-line">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-sm font-medium text-bmr-muted hover:text-bmr-ink"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEditSubcategory}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-bmr-ink text-white rounded-lg hover:bg-bmr-fg disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedSubcategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-2 rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="font-display text-xl mb-4">Delete Subcategory</h2>
              <p className="text-bmr-muted mb-2">
                Are you sure you want to delete <strong className="text-bmr-ink">{selectedSubcategory.name}</strong>?
              </p>
              <p className="text-sm text-bmr-acc-red">
                Products using this subcategory will no longer be associated with it.
              </p>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-line">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-sm font-medium text-bmr-muted hover:text-bmr-ink"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium bg-bmr-acc-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
