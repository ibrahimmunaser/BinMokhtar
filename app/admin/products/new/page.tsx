'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import { addProduct, updateCategoryProductCounts } from '@/lib/firebaseAdminStore';
import Link from 'next/link';
import { ArrowLeft, LogOut, Save } from 'lucide-react';

export default function NewProductPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    subtitle: '',
    categoryId: 'thobes',
    price: '',
    compareAtPrice: '',
    stock: '',
    description: '',
    colors: '',
    sizes: '',
    published: true,
  });

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);

    try {
      const uploadedUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          uploadedUrls.push(data.url);
        } else {
          alert(`Failed to upload ${file.name}: ${data.error}`);
        }
      }

      setImages([...images, ...uploadedUrls]);
      alert(`✓ ${uploadedUrls.length} image(s) uploaded successfully!`);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Error uploading images. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      // Add product to Firebase with images
      const productData = {
        ...formData,
        images: images.length > 0 ? images : ['/placeholder.svg'],
        thumbnail: images.length > 0 ? images[0] : '/placeholder.svg',
      };

      const newProduct = await addProduct(productData);
      
      // Update category product counts
      await updateCategoryProductCounts();
      
      console.log('Product created:', newProduct);
      alert('✓ Product saved to Firebase! (Cloud Database)');
      router.push('/admin');
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Error creating product. Please try again.');
      setSaving(false);
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

      <div className="container-narrow py-12">
        <div className="mb-8">
          <Link href="/admin" className="flex items-center gap-2 text-bmr-muted hover:text-bmr-ink mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-3xl lg:text-4xl">Add New Product</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Basic Information</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Classic White Thobe"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  placeholder="e.g., Premium cotton blend with elegant drape"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                  placeholder="Detailed product description..."
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink resize-none"
                />
              </div>
            </div>
          </div>

          {/* Category & Pricing */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Category & Pricing</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                >
                  <option value="thobes">Thobes</option>
                  <option value="shemaghs">Shemaghs</option>
                  <option value="shaals">Shaals</option>
                  <option value="kufis">Kufis</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stock Quantity *</label>
                <input
                  type="number"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  required
                  min="0"
                  placeholder="0"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Regular Price * (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bmr-muted">$</span>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sale Price (USD)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-bmr-muted">$</span>
                  <input
                    type="number"
                    value={formData.compareAtPrice}
                    onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full pl-8 pr-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                  />
                </div>
                <p className="text-xs text-bmr-muted mt-1">Leave empty if not on sale</p>
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Product Images</h2>

            <div className="space-y-6">
              {/* Upload Button */}
              <div>
                <label className="block text-sm font-medium mb-2">Upload Images</label>
                <div className="flex items-center gap-4">
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                    <div className="px-6 py-3 bg-bmr-ink text-surface-2 rounded-lg hover:bg-bmr-fg transition-colors flex items-center gap-2">
                      {uploading ? (
                        <>
                          <div className="animate-spin w-4 h-4 border-2 border-surface-2 border-t-transparent rounded-full"></div>
                          Uploading...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Choose Images
                        </>
                      )}
                    </div>
                  </label>
                  <p className="text-sm text-bmr-muted">
                    {images.length > 0 ? `${images.length} image(s) uploaded` : 'No images uploaded yet'}
                  </p>
                </div>
                <p className="text-xs text-bmr-muted mt-2">
                  Upload product images (max 5MB each). First image will be the main thumbnail.
                </p>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-3">Uploaded Images</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {images.map((url, index) => (
                      <div key={index} className="relative group">
                        <div className="aspect-square rounded-lg border-2 border-line overflow-hidden bg-surface-3">
                          <img
                            src={url}
                            alt={`Product ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {index === 0 && (
                          <div className="absolute top-2 left-2 px-2 py-1 bg-bmr-acc-green text-surface-2 text-xs rounded">
                            Main
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-2 right-2 w-6 h-6 bg-bmr-acc-red text-surface-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Variants */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Variants</h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Available Sizes</label>
                <input
                  type="text"
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  placeholder="e.g., S, M, L, XL, XXL"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
                <p className="text-xs text-bmr-muted mt-1">Separate with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Available Colors</label>
                <input
                  type="text"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  placeholder="e.g., White, Black, Gray"
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                />
                <p className="text-xs text-bmr-muted mt-1">Separate with commas</p>
              </div>
            </div>
          </div>

          {/* Publishing */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Publishing</h2>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-5 h-5 rounded border-line text-bmr-ink focus:ring-bmr-ink"
              />
              <div>
                <p className="font-medium">Publish product immediately</p>
                <p className="text-sm text-bmr-muted">Make this product visible in the store</p>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            <Link href="/admin" className="btn-ghost">
              Cancel
            </Link>
            <button 
              type="submit" 
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

