'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { isAdminAuthenticated, clearAdminSession } from '@/lib/adminAuth';
import { ProductFormField } from '@/components/admin/ProductFormField';
import { TagsInput } from '@/components/admin/TagsInput';
import { MultiImageUpload } from '@/components/admin/MultiImageUpload';
import { MultiSelect } from '@/components/admin/MultiSelect';
import { VariantStockMatrix } from '@/components/admin/VariantStockMatrix';
import { ColorImageMapper } from '@/components/admin/ColorImageMapper';
import { Loader2, CheckCircle, AlertCircle, ArrowLeft, LogOut } from 'lucide-react';
import Link from 'next/link';

// Category options and subcategories
const CATEGORY_OPTIONS = ['Men', 'Women', 'Boys', 'Girls'] as const;
const CATEGORY_TREE: Record<string, { subcategories: string[] }> = {
  Men: { subcategories: ['Thobes - Long Sleeve', 'Thobe - Short Sleeve', 'Shemaghs', 'Yemeni Shals'] },
  Women: { subcategories: ['Hijabs', 'Abayas'] },
  Boys: { subcategories: [] },
  Girls: { subcategories: [] },
};

// Available sizes and colors
const SIZE_OPTIONS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', '4XL'];
const COLOR_OPTIONS = ['White', 'Black', 'Beige', 'Brown', 'Navy', 'Grey', 'Cream', 'Olive'];

// Variant interface - Extended with new fields
interface Variant {
  size: string;
  color: string;
  stock: number;
  sku: string; // Now required
  barcode?: string; // Optional barcode
  price?: number; // Per-variant price (cents), defaults to product price
  salePrice?: number; // Per-variant sale price (cents)
}

// Color Image Mapping interface
interface ColorImageMapping {
  color: string;
  imageUrls: string[];
}

// Validation Schema - Updated with new fields
const productSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  brand: z.string().min(1, 'Brand is required').default('Bin Mukhtar Retail'),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED'], {
    required_error: 'Status is required',
  }).default('DRAFT'),
  price: z.number().positive('Price must be greater than 0'),
  salePrice: z.preprocess(
    (v) => {
      if (v === '' || v === undefined) return undefined;
      if (typeof v === 'number' && Number.isNaN(v)) return undefined;
      return Number(v);
    },
    z.number().positive('Sale price must be greater than 0').optional()
  ),
  // Image fields - support both legacy and new structure
  images: z.array(z.string()).min(1, 'At least 1 product image is required'),
  primaryImageUrl: z.string().url().optional(),
  galleryImageUrls: z.array(z.string().url()).optional(),
  primaryImageAlt: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  sizes: z.array(z.string()),
  colors: z.array(z.string()).min(1, 'At least 1 color is required'),
  variants: z.array(z.object({
    size: z.string(),
    color: z.string(),
    stock: z.number().int().nonnegative('Stock must be non-negative'),
    sku: z.string().min(1, 'SKU is required'), // Now required
    barcode: z.string().optional(),
    price: z.number().positive().optional(), // Per-variant price override
    salePrice: z.number().positive().optional(), // Per-variant sale price
  })).min(1, 'At least 1 variant is required'),
  colorImageMappings: z.array(z.object({
    color: z.string(),
    imageUrls: z.array(z.string()),
  })).optional(),
  sleeve: z.enum(['short', 'long']).optional(),
  tags: z.array(z.string()).min(2, 'At least 2 tags are required'),
  rating: z.preprocess(
    (v) => {
      if (v === '' || v === undefined || (typeof v === 'number' && Number.isNaN(v))) return undefined;
      return Number(v);
    },
    z.number().min(0).max(5).optional()
  ),
  numReviews: z.preprocess(
    (v) => {
      if (v === '' || v === undefined || (typeof v === 'number' && Number.isNaN(v))) return undefined;
      return Number(v);
    },
    z.number().int().nonnegative().optional()
  ),
}).refine((data) => {
  // Sizes are required for all categories except Shemaghs
  if (data.subcategory !== 'Shemaghs' && data.sizes.length === 0) {
    return false;
  }
  return true;
}, {
  message: 'At least 1 size is required',
  path: ['sizes'],
}).refine((data) => {
  // Check for duplicate SKUs within variants
  const skus = data.variants.map(v => v.sku).filter(Boolean);
  const uniqueSkus = new Set(skus);
  return skus.length === uniqueSkus.size;
}, {
  message: 'Each variant must have a unique SKU',
  path: ['variants'],
});

type ProductFormData = z.infer<typeof productSchema>;

export default function EditProductForm() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isValid },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    mode: 'onChange',
    defaultValues: {
      title: '',
      slug: '',
      brand: 'Bin Mukhtar Retail',
      status: 'DRAFT' as const,
      price: 0,
      salePrice: undefined,
      images: [],
      primaryImageUrl: undefined,
      galleryImageUrls: [],
      primaryImageAlt: undefined,
      category: '',
      subcategory: undefined,
      sleeve: undefined,
      sizes: [],
      colors: [],
      variants: [],
      colorImageMappings: [],
      tags: [],
      rating: undefined,
      numReviews: undefined,
    },
  });

  const category = watch('category');
  const subcategory = watch('subcategory');

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push('/admin/login');
    } else {
      setIsAuthenticated(true);
      loadProduct();
    }
  }, [router, productId]);

  const loadProduct = async () => {
    try {
      const response = await fetch(`/api/admin/products?id=${productId}`);
      const data = await response.json();

      if (data.success && data.product) {
        const product = data.product;
        
        // Reset form with product data - include new fields
        reset({
          title: product.titleEn || product.name || '',
          slug: product.slug || product.name?.toLowerCase().replace(/\s+/g, '-') || '',
          brand: product.brand || 'Bin Mukhtar Retail',
          status: product.status || (product.published ? 'ACTIVE' : 'DRAFT'),
          price: product.price ? product.price / 100 : 0,
          salePrice: undefined,
          // Image fields - support both legacy and new structure
          images: product.images || [],
          primaryImageUrl: product.primaryImageUrl || product.images?.[0] || undefined,
          galleryImageUrls: product.galleryImageUrls || product.images || [],
          primaryImageAlt: product.primaryImageAlt || product.titleEn || '',
          category: product.categoryId || '',
          subcategory: product.subcategory || undefined,
          sleeve: product.sleeve || undefined,
          sizes: product.sizes || [],
          colors: product.colors || [],
          // Map variants with new fields
          variants: (product.variants || []).map((v: any) => ({
            size: v.size || '',
            color: v.color || '',
            stock: v.stock || 0,
            sku: v.sku || `SKU-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            barcode: v.barcode || '',
            price: v.price ? v.price / 100 : undefined,
            salePrice: v.salePrice ? v.salePrice / 100 : undefined,
          })),
          colorImageMappings: product.colorImageMappings || [],
          tags: product.tags || [],
          rating: product.rating || undefined,
          numReviews: product.numReviews || undefined,
        });
      } else {
        alert('Product not found');
        router.push('/admin/products');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      alert('Error loading product');
      router.push('/admin/products');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    router.push('/admin/login');
  };

  const onSubmit = async (data: ProductFormData) => {
    console.log('Form submitted with data:', data);
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      const productData = {
        id: productId,
        name: data.title,
        slug: data.slug,
        brand: data.brand,
        status: data.status,
        subtitle: '',
        price: data.price.toString(), // Base price in dollars
        compareAtPrice: data.salePrice ? data.salePrice.toString() : undefined,
        // Image fields - support both structures
        images: data.images,
        thumbnail: data.images[0],
        primaryImageUrl: data.primaryImageUrl || data.images?.[0],
        galleryImageUrls: data.galleryImageUrls || data.images,
        primaryImageAlt: data.primaryImageAlt || data.title,
        categoryId: data.category,
        subcategory: data.subcategory,
        audience: (data.category || 'Men').toUpperCase(),
        sizes: data.sizes,
        colors: data.colors,
        // Send variants with new fields
        variants: data.variants.map(v => ({
          size: v.size,
          color: v.color,
          stock: v.stock,
          sku: v.sku,
          barcode: v.barcode || undefined,
          price: v.price !== undefined ? v.price : data.price, // Use variant price or fallback to base price
          salePrice: v.salePrice || undefined,
        })),
        colorImageMappings: data.colorImageMappings || [],
        tags: data.tags,
        published: data.status === 'ACTIVE', // Derive from status
        description: `${data.category}`,
      };

      console.log('Sending to API:', productData);

      const response = await fetch('/api/admin/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product');
      }

      // Invalidate cache so the frontend shows updated data
      try {
        const slug = data.title.toLowerCase().replace(/\s+/g, '-');
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'product', slug }),
        });
        console.log('Cache invalidated for product:', slug);
      } catch (cacheError) {
        console.warn('Failed to invalidate cache:', cacheError);
      }

      setSubmitStatus('success');
      
      setTimeout(() => {
        router.push('/admin/products');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error updating product:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to update product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || isLoading) {
    return (
      <div className="min-h-screen bg-surface-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-bmr-ink border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-bmr-muted">Loading product...</p>
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

        <div className="max-w-4xl mx-auto">
          {/* Success Banner */}
          {submitStatus === 'success' && (
            <div className="mb-6 p-4 bg-bmr-acc-green/10 border border-bmr-acc-green rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <CheckCircle className="w-5 h-5 text-bmr-acc-green flex-shrink-0" />
              <p className="text-bmr-acc-green font-medium">Product updated successfully!</p>
            </div>
          )}

          {/* Error Banner */}
          {submitStatus === 'error' && (
            <div className="mb-6 p-4 bg-bmr-acc-red/10 border border-bmr-acc-red rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <AlertCircle className="w-5 h-5 text-bmr-acc-red flex-shrink-0" />
              <div>
                <p className="text-bmr-acc-red font-medium">Failed to update product</p>
                <p className="text-sm text-bmr-acc-red/80">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Page Header */}
          <div className="mb-8">
            <h2 className="font-display text-3xl mb-2">Edit Product</h2>
            <p className="text-bmr-muted">Update product information</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {/* Debug Info */}
            {!isValid && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-900 mb-2">Form Validation Issues:</p>
                <ul className="text-xs text-yellow-800 space-y-1">
                  {Object.keys(errors).map((key) => (
                    <li key={key}>• {key}: {(errors as any)[key]?.message}</li>
                  ))}
                  {Object.keys(errors).length === 0 && (
                    <li>• Form is validating... Please ensure all required fields are filled.</li>
                  )}
                </ul>
              </div>
            )}

            {/* Basic Information */}
            <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
              <h2 className="font-display text-xl mb-6">Basic Information</h2>
              
              <div className="space-y-6">
                <ProductFormField
                  label="Product Title"
                  required
                  placeholder="e.g., Premium White Thobe"
                  error={errors.title?.message}
                  {...register('title')}
                />

                {/* New: Slug/Handle Field */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    URL Slug (Handle)
                    <span className="text-bmr-acc-red ml-1">*</span>
                  </label>
                  <ProductFormField
                    placeholder="premium-white-thobe"
                    error={errors.slug?.message}
                    helpText="URL-friendly identifier (lowercase letters, numbers, and hyphens only). Must be unique."
                    {...register('slug')}
                  />
                </div>

                {/* New: Brand and Status */}
                <div className="grid md:grid-cols-2 gap-6">
                  <ProductFormField
                    label="Brand"
                    required
                    placeholder="Bin Mukhtar Retail"
                    error={errors.brand?.message}
                    {...register('brand')}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium">
                      Status
                      <span className="text-bmr-acc-red ml-1">*</span>
                    </label>
                    <select
                      {...register('status')}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        errors.status
                          ? 'border-bmr-acc-red focus:ring-bmr-acc-red'
                          : 'border-line focus:ring-bmr-ink'
                      }`}
                    >
                      <option value="DRAFT">Draft (Hidden from store)</option>
                      <option value="ACTIVE">Active (Visible in store)</option>
                      <option value="ARCHIVED">Archived (Hidden, no longer sold)</option>
                    </select>
                    {errors.status && (
                      <p className="text-sm text-bmr-acc-red">{errors.status.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <ProductFormField
                    label="Base Price (USD)"
                    type="number"
                    required
                    placeholder="99.99"
                    step="0.01"
                    min="0"
                    helpText="Default price for all variants (can be overridden per variant)"
                    error={errors.price?.message}
                    {...register('price', { valueAsNumber: true })}
                  />

                  <ProductFormField
                    label="Base Sale Price (USD)"
                    type="number"
                    placeholder="79.99 (Optional)"
                    step="0.01"
                    min="0"
                    helpText="Optional discounted price (can be overridden per variant)"
                    error={errors.salePrice?.message}
                    {...register('salePrice', { valueAsNumber: true })}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Category
                    <span className="text-bmr-acc-red ml-1">*</span>
                  </label>
                  <select
                    {...register('category')}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                      errors.category
                        ? 'border-bmr-acc-red focus:ring-bmr-acc-red'
                        : 'border-line focus:ring-bmr-ink'
                    }`}
                  >
                    <option value="">Select category</option>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-sm text-bmr-acc-red">{errors.category.message}</p>
                  )}
                </div>

              {/* Subcategory */}
              {category && CATEGORY_TREE[category]?.subcategories?.length > 0 && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Subcategory</label>
                  <select
                    {...register('subcategory')}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  >
                    <option value="">Select subcategory</option>
                    {CATEGORY_TREE[category].subcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              </div>
            </div>

            {/* Images */}
            <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
              <h2 className="font-display text-xl mb-6">Product Images</h2>
              
              <div className="space-y-6">
                <Controller
                  name="images"
                  control={control}
                  render={({ field }) => (
                    <MultiImageUpload
                      label="Product Images"
                      name="images"
                      required
                      error={errors.images?.message}
                      value={field.value}
                      onChange={(newImages: string[]) => {
                        field.onChange(newImages);
                        // Auto-update primary image URL if not set
                        if (!watch('primaryImageUrl') && newImages.length > 0) {
                          register('primaryImageUrl').onChange({ target: { value: newImages[0] } });
                        }
                        // Auto-update gallery
                        register('galleryImageUrls').onChange({ target: { value: newImages } });
                      }}
                    />
                  )}
                />

                <div className="bg-surface-3/50 p-4 rounded-lg border border-line/50">
                  <p className="text-sm text-bmr-muted mb-3">
                    <strong>Note:</strong> The first image will be used as the primary/featured image on product pages.
                  </p>
                  
                  <ProductFormField
                    label="Primary Image Alt Text (SEO)"
                    placeholder="e.g., Premium white thobe with embroidered collar"
                    helpText="Describes the primary image for accessibility and SEO. Auto-fills with product title if left empty."
                    error={errors.primaryImageAlt?.message}
                    {...register('primaryImageAlt')}
                  />
                </div>
              </div>
            </div>

            {/* Variants */}
            <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
              <h2 className="font-display text-xl mb-6">Product Variants</h2>
              
              <div className="space-y-6">
                {/* Size and Color Selection */}
                <div className={subcategory === 'Shemaghs' ? 'grid grid-cols-1 gap-6' : 'grid md:grid-cols-2 gap-6'}>
                  {subcategory !== 'Shemaghs' && (
                    <Controller
                      name="sizes"
                      control={control}
                      render={({ field }) => (
                        <MultiSelect
                          label="Available Sizes"
                          name="sizes"
                          required
                          options={SIZE_OPTIONS}
                          value={field.value}
                          onChange={field.onChange}
                          error={errors.sizes?.message}
                          placeholder="Select sizes"
                        />
                      )}
                    />
                  )}

                  <Controller
                    name="colors"
                    control={control}
                    render={({ field }) => (
                      <MultiSelect
                        label="Available Colors"
                        name="colors"
                        required
                        options={COLOR_OPTIONS}
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.colors?.message}
                        placeholder="Select colors"
                      />
                    )}
                  />
                </div>

                {/* Stock Matrix - with base price defaults */}
                <Controller
                  name="variants"
                  control={control}
                  render={({ field }) => (
                    <VariantStockMatrix
                      sizes={watch('sizes')}
                      colors={watch('colors')}
                      value={field.value}
                      onChange={field.onChange}
                      basePrice={watch('price')}
                      baseSalePrice={watch('salePrice')}
                    />
                  )}
                />
                {errors.variants && (
                  <p className="text-sm text-bmr-acc-red">{errors.variants.message}</p>
                )}
              </div>

              {/* Color to Image Mapping */}
              <div className="mt-8">
                <Controller
                  name="colorImageMappings"
                  control={control}
                  render={({ field }) => (
                    <ColorImageMapper
                      colors={watch('colors')}
                      images={watch('images')}
                      value={field.value || []}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            </div>

            {/* Tags */}
            <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
              <h2 className="font-display text-xl mb-6">Tags & Classification</h2>
              
              <Controller
                name="tags"
                control={control}
                render={({ field }) => (
                  <TagsInput
                    label="Product Tags"
                    name="tags"
                    required
                    error={errors.tags?.message}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>

            {/* Metrics */}
            <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
              <h2 className="font-display text-xl mb-6">Metrics</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="text-sm text-gray-600">
                  <p>Product metrics (views, orders, ratings) are automatically calculated from system data.</p>
                </div>

                <ProductFormField
                  label="Rating"
                  type="number"
                  placeholder="0-5 (Optional)"
                  min="0"
                  max="5"
                  step="0.1"
                  error={errors.rating?.message}
                  {...register('rating', { valueAsNumber: true })}
                />

                <ProductFormField
                  label="Number of Reviews"
                  type="number"
                  placeholder="Optional"
                  min="0"
                  error={errors.numReviews?.message}
                  {...register('numReviews', { valueAsNumber: true })}
                />
              </div>

              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-900">
                  ℹ️ <strong>Note:</strong> Stock levels are managed per variant (size+color combination) 
                  in the "Product Variants" section above. Total stock is calculated automatically.
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4">
              <Link
                href="/admin/products"
                className="px-8 py-4 border border-line rounded-lg hover:bg-surface-3 transition-colors"
              >
                Cancel
              </Link>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-8 py-4 bg-bmr-ink text-surface-2 rounded-lg hover:bg-bmr-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Updating Product...
                  </>
                ) : (
                  'Update Product'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

