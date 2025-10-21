'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import { getAllCategories } from '@/lib/firebaseAdminStore';
import Link from 'next/link';
import { ArrowLeft, LogOut, Save, Upload } from 'lucide-react';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
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
      loadData();
    }
  }, [router, productId]);

  const loadData = async () => {
    setLoading(true);
    
    // Load categories
    const categoriesData = await getAllCategories();
    setCategories(categoriesData);

    // Load product
    const response = await fetch(`/api/admin/products?id=${productId}`);
    const data = await response.json();
    
    if (data.success && data.product) {
      const prod = data.product;
      setProduct(prod);
      setImages(prod.images || []);
      setFormData({
        name: prod.name || '',
        subtitle: prod.subtitle || '',
        categoryId: prod.categoryId || 'thobes',
        price: prod.price ? (prod.price / 100).toFixed(2) : '',
        compareAtPrice: prod.compareAtPrice ? (prod.compareAtPrice / 100).toFixed(2) : '',
        stock: prod.stock?.toString() || '',
        description: prod.descriptionHtml?.replace(/<[^>]*>/g, '') || '',
        colors: prod.colors?.join(', ') || '',
        sizes: prod.sizes?.join(', ') || '',
        published: prod.published !== false,
      });
    }
    
    setLoading(false);
  };

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
      const productData = {
        ...formData,
        images: images.length > 0 ? images : ['/placeholder.svg'],
        thumbnail: images.length > 0 ? images[0] : '/placeholder.svg',
      };

      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: productId, ...productData }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✓ Product updated successfully!');
        router.push('/admin/products');
      } else {
        alert('Error: ' + data.error);
        setSaving(false);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      alert('Error updating product. Please try again.');
      setSaving(false);
    }
  };

  if (!isAuthenticated || loading) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-bmr-muted">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-bmr-muted mb-4">Product not found</p>
          <Link href="/admin/products" className="text-bmr-ink hover:underline">
            ← Back to Products
          </Link>
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
        {/* Back Button */}
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm text-bmr-muted hover:text-bmr-ink mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Products
        </Link>

        {/* Page Header */}
        <div className="mb-8">
          <h2 className="font-display text-3xl mb-2">Edit Product</h2>
          <p className="text-bmr-muted">Update product information</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h3 className="font-display text-xl mb-6">Basic Information</h3>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Product Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface-1 focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  placeholder="e.g., Premium White Thobe"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Subtitle</label>
                <input
                  type="text"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface-1 focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  placeholder="e.g., Luxury cotton blend"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category *</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface-1 focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface-1 focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  placeholder="Product description..."
                />
              </div>
            </div>
          </div>

          {/* Pricing & Stock */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h3 className="font-display text-xl mb-6">Pricing & Inventory</h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Regular Price ($) *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface-1 focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  placeholder="99.99"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sale Price ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.compareAtPrice}
                  onChange={(e) => setFormData({ ...formData, compareAtPrice: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface-1 focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  placeholder="79.99"
                />
                <p className="text-xs text-bmr-muted mt-1">Leave empty if not on sale</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stock Quantity *</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface-1 focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  placeholder="50"
                />
              </div>
            </div>
          </div>

          {/* Product Images */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h3 className="font-display text-xl mb-6">Product Images</h3>

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
                          <Upload className="w-5 h-5" />
                          Choose Images
                        </>
                      )}
                    </div>
                  </label>
                  <p className="text-sm text-bmr-muted">
                    {images.length > 0 ? `${images.length} image(s)` : 'No images'}
                  </p>
                </div>
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-3">Current Images</label>
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
            <h3 className="font-display text-xl mb-6">Variants</h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">Available Sizes</label>
                <input
                  type="text"
                  value={formData.sizes}
                  onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface-1 focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  placeholder="S, M, L, XL"
                />
                <p className="text-xs text-bmr-muted mt-1">Separate with commas</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Available Colors</label>
                <input
                  type="text"
                  value={formData.colors}
                  onChange={(e) => setFormData({ ...formData, colors: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg border border-line bg-surface-1 focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  placeholder="White, Black, Navy"
                />
                <p className="text-xs text-bmr-muted mt-1">Separate with commas</p>
              </div>
            </div>
          </div>

          {/* Publish */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                className="w-5 h-5 rounded border-line"
              />
              <div>
                <div className="font-medium">Publish product</div>
                <p className="text-sm text-bmr-muted">Make this product visible in the store</p>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-8 py-4 bg-bmr-ink text-surface-2 rounded-lg hover:bg-bmr-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin w-4 h-4 border-2 border-surface-2 border-t-transparent rounded-full"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Update Product
                </>
              )}
            </button>
            <Link
              href="/admin/products"
              className="px-8 py-4 border border-line rounded-lg hover:bg-surface-3 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}


