'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import { addProduct, updateCategoryProductCounts } from '@/lib/firebaseAdminStore';
import { TagsInput } from '@/components/admin/TagsInput';
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
    mainCategory: '' as 'Men' | 'Boys' | 'Shemaghs' | '',
    subCategory: '',
    price: '',
    compareAtPrice: '',
    description: '',
    colors: [] as string[],
    sizes: [] as string[],
    tags: [] as string[],
    published: true,
  });
  const [variants, setVariants] = useState<{ size?: string; color?: string; stock: number; sku: string }[]>([]);
  const sizeOptions = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const colorOptions = ['White', 'Black', 'Navy', 'Gray', 'Beige', 'Brown', 'Red', 'Blue', 'Green'];

  const totalStock = variants.reduce((sum, v) => sum + (Number.isFinite(v.stock) ? v.stock : 0), 0);
  
  // Define subcategories based on main category
  const getSubCategories = (main: string) => {
    switch (main) {
      case 'Men':
        return ['Saudi', 'Emirati'];
      case 'Boys':
        return ['Thobes'];
      case 'Shemaghs':
        return ['Traditional', 'Yemeni'];
      default:
        return [];
    }
  };
  
  // Check if sizes should be hidden (only for Shemaghs)
  const hideSizes = formData.mainCategory === 'Shemaghs';

  const syncVariantsFromSelections = (sizes: string[], colors: string[]) => {
    const key = (s?: string, c?: string) => `${s || ''}__${c || ''}`;
    const currentMap = new Map<string, { size?: string; color?: string; stock: number; sku: string }>();
    variants.forEach(v => currentMap.set(key(v.size, v.color), v));

    const next: { size?: string; color?: string; stock: number; sku: string }[] = [];
    
    // If sizes are hidden, only use colors
    const sizesList = hideSizes ? [undefined as unknown as string] : (sizes.length > 0 ? sizes : [undefined as unknown as string]);
    const colorsList = colors.length > 0 ? colors : [undefined as unknown as string];

    sizesList.forEach(s => {
      colorsList.forEach(c => {
        const k = key(s, c);
        const existing = currentMap.get(k);
        // Auto-generate SKU if not exists: SIZE-COLOR or just COLOR for shemaghs
        const autoSku = hideSizes 
          ? `${c?.toUpperCase().replace(/\s+/g, '-') || 'SKU'}`
          : `${s || 'ONE'}-${c?.toUpperCase().replace(/\s+/g, '-') || 'COLOR'}`;
        next.push({ 
          size: hideSizes ? undefined : s || undefined, 
          color: c || undefined, 
          stock: existing?.stock ?? 0,
          sku: existing?.sku || autoSku
        });
      });
    });

    setVariants(next);
  };

  const toggleSelection = (field: 'sizes' | 'colors', value: string) => {
    const list = new Set(formData[field]);
    if (list.has(value)) list.delete(value); else list.add(value);
    const next = Array.from(list);
    setFormData({ ...formData, [field]: next } as any);
    if (field === 'sizes') syncVariantsFromSelections(next, formData.colors);
    if (field === 'colors') syncVariantsFromSelections(formData.sizes, next);
  };

  const addCustomOption = (field: 'sizes' | 'colors', inputId: string) => {
    const input = (document.getElementById(inputId) as HTMLInputElement | null);
    const raw = input?.value?.trim();
    if (!raw) return;
    const value = raw.replace(/\s+/g, ' ').trim();
    if (!formData[field].includes(value)) {
      const next = [...formData[field], value];
      setFormData({ ...formData, [field]: next } as any);
      if (field === 'sizes') syncVariantsFromSelections(next, formData.colors);
      if (field === 'colors') syncVariantsFromSelections(formData.sizes, next);
    }
    if (input) input.value = '';
  };

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);
  
  // Re-sync variants when main category changes (affects whether sizes are included)
  useEffect(() => {
    syncVariantsFromSelections(formData.sizes, formData.colors);
  }, [formData.mainCategory]);
  
  // Reset subcategory when main category changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, subCategory: '' }));
  }, [formData.mainCategory]);

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
    
    // Validate main category and subcategory
    if (!formData.mainCategory) {
      alert('Please select a main category');
      return;
    }
    
    if (!formData.subCategory) {
      alert('Please select a sub category');
      return;
    }
    
    // Validate tags
    if (formData.tags.length < 2) {
      alert('Please add at least 2 product tags');
      return;
    }
    
    // Validate variants
    if (variants.length === 0) {
      alert('Please add at least one variant with size and color');
      return;
    }
    
    setSaving(true);
    
    try {
      // Swap prices if sale price is provided
      const price = formData.compareAtPrice ? formData.compareAtPrice : formData.price;
      const compareAtPrice = formData.compareAtPrice ? formData.price : '';
      
      // Determine audience based on main category
      const audience = formData.mainCategory === 'Boys' ? 'CHILDREN' : 'MEN';
      
      // Determine categoryId for Firebase
      let categoryId = 'thobes';
      if (formData.mainCategory === 'Shemaghs') {
        categoryId = 'shemaghs';
      } else if (formData.mainCategory === 'Men' || formData.mainCategory === 'Boys') {
        categoryId = 'thobes';
      }
      
      // Add product to Firebase with images
      const productData = {
        ...formData,
        audience,
        categoryId,
        price, // Use sale price if provided, otherwise regular price
        compareAtPrice, // If there's a sale price, the regular price becomes compareAt
        images: images.length > 0 ? images : ['/placeholder.svg'],
        thumbnail: images.length > 0 ? images[0] : '/placeholder.svg',
        variants: variants.map(v => ({ size: v.size, color: v.color, stock: Number.isFinite(v.stock) ? v.stock : 0, sku: v.sku })),
        tags: formData.tags,
        category: `${formData.mainCategory} - ${formData.subCategory}`,
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
                <label className="block text-sm font-medium mb-2">Main Category *</label>
                <select
                  value={formData.mainCategory}
                  onChange={(e) => setFormData({ ...formData, mainCategory: e.target.value as any, subCategory: '' })}
                  required
                  className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                >
                  <option value="">Select Main Category</option>
                  <option value="Men">Men</option>
                  <option value="Boys">Boys</option>
                  <option value="Shemaghs">Shemaghs</option>
                </select>
                <p className="text-xs text-bmr-muted mt-1">Choose the primary product category</p>
              </div>
              
              {formData.mainCategory && (
                <div>
                  <label className="block text-sm font-medium mb-2">Sub Category *</label>
                  <select
                    value={formData.subCategory}
                    onChange={(e) => setFormData({ ...formData, subCategory: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:border-bmr-ink"
                  >
                    <option value="">Select Sub Category</option>
                    {getSubCategories(formData.mainCategory).map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                  <p className="text-xs text-bmr-muted mt-1">
                    {formData.mainCategory === 'Men' && 'Saudi or Emirati style'}
                    {formData.mainCategory === 'Boys' && 'Boys Thobes collection'}
                    {formData.mainCategory === 'Shemaghs' && 'Traditional or Yemeni style'}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-2">Total Stock (sum of variants)</label>
                <div className="px-4 py-3 border border-line rounded-lg bg-surface-1">{totalStock}</div>
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
                <p className="text-xs text-bmr-muted mt-1">Leave empty if not on sale. Must be less than regular price.</p>
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
            <h2 className="font-display text-xl mb-6">Variants (Size & Color)</h2>
            
            {!formData.mainCategory ? (
              <div className="text-center py-8 text-bmr-muted">
                <p>Please select a main category and sub category first</p>
              </div>
            ) : (
              <>
                {hideSizes && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-900">
                      ℹ️ <strong>Shemaghs only require colors</strong> - No sizes needed
                    </p>
                  </div>
                )}
                
                <div className={hideSizes ? 'grid grid-cols-1 gap-6' : 'grid md:grid-cols-2 gap-6'}>
                  {!hideSizes && (
                    <div>
                      <label className="block text-sm font-medium mb-2">Available Sizes *</label>
                      <div className="border border-line rounded-lg p-4">
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {sizeOptions.map((s) => (
                            <label key={s} className="flex items-center gap-2 text-sm">
                              <input type="checkbox" checked={formData.sizes.includes(s)} onChange={() => toggleSelection('sizes', s)} />
                              <span>{s}</span>
                            </label>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input id="custom-size-input" type="text" placeholder="Add custom size" className="w-full px-3 py-2 border border-line rounded" />
                          <button type="button" onClick={() => addCustomOption('sizes', 'custom-size-input')} className="px-3 py-2 border rounded">Add</button>
                        </div>
                      </div>
                      <p className="text-xs text-bmr-muted mt-1">Select all sizes available for this product</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-2">Available Colors *</label>
                    <div className="border border-line rounded-lg p-4">
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {colorOptions.map((c) => (
                          <label key={c} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={formData.colors.includes(c)} onChange={() => toggleSelection('colors', c)} />
                            <span>{c}</span>
                          </label>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input id="custom-color-input" type="text" placeholder="Add custom color" className="w-full px-3 py-2 border border-line rounded" />
                        <button type="button" onClick={() => addCustomOption('colors', 'custom-color-input')} className="px-3 py-2 border rounded">Add</button>
                      </div>
                    </div>
                    <p className="text-xs text-bmr-muted mt-1">Select all colors available for this product</p>
                  </div>
                </div>
              </>
            )}

            {formData.mainCategory && (
              <div className="mt-6">
                <label className="block text-sm font-medium mb-3">Stock by Variant</label>
                {variants.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-line rounded-lg text-center">
                    <p className="text-sm text-bmr-muted">
                      {hideSizes 
                        ? '👆 Select colors above to generate variants'
                        : '👆 Select sizes and colors above to generate variant combinations'
                      }
                    </p>
                    <p className="text-xs text-bmr-muted mt-2">
                      Each combination will create a separate variant where you can set individual stock levels
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-line rounded-lg">
                    <table className="min-w-full text-sm">
                      <thead className="bg-surface-3">
                        <tr>
                          {!hideSizes && <th className="text-left p-3 border-b border-line font-medium">Size</th>}
                          <th className="text-left p-3 border-b border-line font-medium">Color</th>
                          <th className="text-left p-3 border-b border-line font-medium">SKU *</th>
                          <th className="text-left p-3 border-b border-line font-medium">Stock Quantity</th>
                        </tr>
                      </thead>
                      <tbody>
                        {variants.map((v, idx) => (
                          <tr key={`${v.size || ''}-${v.color || ''}-${idx}`} className="hover:bg-surface-3">
                            {!hideSizes && <td className="p-3 border-b border-line font-medium">{v.size || '—'}</td>}
                            <td className="p-3 border-b border-line">{v.color || '—'}</td>
                            <td className="p-3 border-b border-line">
                              <input
                                type="text"
                                value={v.sku || ''}
                                onChange={(e) => {
                                  const next = [...variants];
                                  next[idx] = { ...next[idx], sku: e.target.value };
                                  setVariants(next);
                                }}
                                className="w-40 px-3 py-2 border border-line rounded focus:outline-none focus:border-bmr-ink"
                                placeholder="Enter SKU"
                                required
                              />
                            </td>
                            <td className="p-3 border-b border-line">
                              <input
                                type="number"
                                min={0}
                                value={Number.isFinite(v.stock) ? v.stock : 0}
                                onChange={(e) => {
                                  const next = [...variants];
                                  next[idx] = { ...next[idx], stock: Math.max(0, parseInt(e.target.value || '0')) };
                                  setVariants(next);
                                }}
                                className="w-28 px-3 py-2 border border-line rounded focus:outline-none focus:border-bmr-ink"
                                placeholder="0"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="p-3 bg-surface-3 border-t border-line">
                      <p className="text-sm text-bmr-muted">
                        💡 <strong>Total Stock:</strong> {totalStock} units across {variants.length} variant{variants.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Product Tags */}
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Tags & Classification</h2>

            <TagsInput
              label="Product Tags"
              name="tags"
              required
              value={formData.tags}
              onChange={(tags) => setFormData({ ...formData, tags })}
              error={formData.tags.length < 2 ? 'At least 2 tags are required' : undefined}
            />
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

