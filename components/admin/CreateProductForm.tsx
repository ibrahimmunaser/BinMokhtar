'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductFormField } from './ProductFormField';
import { TagsInput } from './TagsInput';
import { MultiImageUpload } from './MultiImageUpload';
import { MultiSelect } from './MultiSelect';
import { VariantStockMatrix } from './VariantStockMatrix';
import { ColorImageMapper } from './ColorImageMapper';
import { Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { getAllSubcategories } from '@/lib/firebaseAdminStore';

// Category options (main categories)
const CATEGORY_OPTIONS = ['Men', 'Women', 'Boys', 'Girls', 'Shemaghs'] as const;

// Fallback subcategories (shown only if Firebase returns empty)
const FALLBACK_SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  Men: [
    { value: 'emirati', label: 'Emirati Thobes' },
    { value: 'saudi', label: 'Saudi Thobes' },
  ],
  Women: [
    { value: 'hijabs', label: 'Hijabs' },
    { value: 'abayas', label: 'Abayas' },
  ],
  Boys: [
    { value: 'thobes', label: 'Emirati Thobes' },
  ],
  Girls: [],
  Shemaghs: [
    { value: 'traditional', label: 'Traditional' },
    { value: 'yemeni', label: 'Yemeni' },
  ],
};

// Subcategory interface
interface SubcategoryOption {
  value: string;
  label: string;
}

interface Subcategory {
  id: string;
  name: string;
  slug: string;
  parentCategoryId: string;
  active: boolean;
}

// Available sizes and colors
const SIZE_OPTIONS = ['54', '56', '58', '60', '62'];
const COLOR_OPTIONS = ['White', 'Black', 'Beige', 'Brown', 'Navy', 'Grey', 'Cream', 'Olive'];

// Variant interface - Extended with new required fields
interface Variant {
  size?: string; // Optional for one-size items like Shemaghs
  color: string;
  stock: number;
  sku: string; // Now required
  barcode?: string; // Optional barcode
  price?: number; // Per-variant price override
  salePrice?: number; // Per-variant sale price
}

// Color Image Mapping interface
interface ColorImageMapping {
  color: string;
  imageUrls: string[];
}

// Validation Schema
const productSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters').regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
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
  weight: z.preprocess(
    (v) => {
      if (v === '' || v === undefined) return undefined;
      if (typeof v === 'number' && Number.isNaN(v)) return undefined;
      return Number(v);
    },
    z.number().positive('Weight must be greater than 0').optional()
  ),
  images: z.array(z.string()).min(1, 'At least 1 product image is required'),
  primaryImageUrl: z.string().url().optional(),
  galleryImageUrls: z.array(z.string().url()).optional(),
  primaryImageAlt: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  sizes: z.array(z.string()),
  colors: z.array(z.string()).min(1, 'At least 1 color is required'),
  variants: z.array(z.object({
    size: z.string().optional(), // Optional for one-size items like Shemaghs
    color: z.string(),
    stock: z.number().int().nonnegative('Stock must be non-negative'),
    sku: z.string().min(1, 'SKU is required'),
    barcode: z.string().optional(),
    price: z.number().positive().optional(),
    salePrice: z.number().positive().optional(),
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
  if (data.category !== 'Shemaghs' && data.sizes.length === 0) {
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

interface CreateProductFormProps {
  productId?: string; // If provided, form is in edit mode
}

export function CreateProductForm({ productId }: CreateProductFormProps = {}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!!productId);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const isEditMode = !!productId;
  
  // Dynamic subcategories state
  const [allSubcategories, setAllSubcategories] = useState<Subcategory[]>([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(true);

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
      slug: undefined,
      brand: 'Bin Mukhtar Retail',
      status: 'DRAFT' as const,
      price: 0,
      salePrice: undefined,
      weight: undefined,
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
  const title = watch('title');
  const price = watch('price');
  
  // Check if basic information is filled (required fields only)
  const isBasicInfoComplete = title && title.length >= 4 && price && price > 0 && category;

  // Load subcategories on mount
  useEffect(() => {
    const loadSubcategories = async () => {
      setIsLoadingSubcategories(true);
      try {
        const subs = await getAllSubcategories();
        setAllSubcategories(subs);
      } catch (error) {
        console.error('Error loading subcategories:', error);
      } finally {
        setIsLoadingSubcategories(false);
      }
    };
    loadSubcategories();
  }, []);

  // Load product data if in edit mode
  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  // Auto-refresh stock data every 30 seconds in edit mode
  useEffect(() => {
    if (!productId) return;

    const refreshInterval = setInterval(() => {
      console.log('🔄 Auto-refreshing stock data...');
      loadProduct();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(refreshInterval);
  }, [productId]);

  // Refresh when user returns to the tab
  useEffect(() => {
    if (!productId) return;

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 Tab became visible - refreshing stock data');
        loadProduct();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [productId]);

  // Get subcategories for the selected category (from Firebase, with fallback)
  const getSubcategoriesForCategory = (categoryId: string): SubcategoryOption[] => {
    // Get subcategories from Firebase for this category
    const firebaseSubs = allSubcategories
      .filter(sub => sub.parentCategoryId === categoryId && sub.active !== false)
      .map(sub => ({
        value: sub.slug,
        label: sub.name,
      }));
    
    // If Firebase has data for this category, use it
    if (firebaseSubs.length > 0) {
      return firebaseSubs;
    }
    
    // Otherwise fall back to defaults (Firebase might not be seeded yet)
    return FALLBACK_SUBCATEGORIES[categoryId] || [];
  };

  const loadProduct = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/admin/products?id=${productId}`);
      const result = await response.json();

      if (!response.ok || !result.product) {
        throw new Error(result.error || 'Failed to load product');
      }

      const product = result.product;
      
      // Debug: Log product data to see what we're getting
      console.log('📦 Loading product data:', {
        name: product.name,
        tags: product.tags,
        tagsType: typeof product.tags,
        tagsIsArray: Array.isArray(product.tags),
        allKeys: Object.keys(product),
      });
      
      // Convert price from cents to dollars
      // If compareAtPrice exists, it means product is on sale:
      // - price = current selling price (sale price)
      // - compareAtPrice = original price (regular price)
      // Form fields should show:
      // - "Regular Price" = compareAtPrice (or price if no sale)
      // - "Sale Price" = price (only if compareAtPrice exists)
      const hasActivePromo = product.compareAtPrice && product.compareAtPrice > product.price;
      const priceInDollars = product.price ? product.price / 100 : 0;
      const compareAtPriceInDollars = product.compareAtPrice ? product.compareAtPrice / 100 : undefined;
      
      // Set form values correctly:
      const regularPrice = hasActivePromo ? compareAtPriceInDollars : priceInDollars;
      const salePrice = hasActivePromo ? priceInDollars : undefined;

      // Prepare variants - convert prices from cents to dollars.
      // loadedStock records the DB value at load time so the API can compute
      // a delta rather than blindly overwriting (prevents reverting order decrements).
      const variants = (product.variants || []).map((v: any) => ({
        size: v.size || '',
        color: v.color || '',
        stock: v.stock || 0,
        loadedStock: v.stock || 0, // snapshot of DB value when form was opened
        sku: v.sku || '',
        barcode: v.barcode || undefined,
        price: v.price ? v.price / 100 : undefined,
        salePrice: v.salePrice ? v.salePrice / 100 : undefined,
      }));

      // Handle tags - ensure it's always an array
      // Check multiple possible locations for tags
      let tags: string[] = [];
      
      // Try product.tags first
      if (product.tags !== undefined && product.tags !== null) {
        if (Array.isArray(product.tags)) {
          tags = product.tags.filter(Boolean); // Remove any empty/null values
        } else if (typeof product.tags === 'string') {
          // Handle case where tags might be stored as comma-separated string
          tags = product.tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        }
      }

      console.log('🏷️ Raw tags from API:', product.tags);
      console.log('🏷️ Processed tags:', tags);
      console.log('🏷️ Tags will be set in form:', tags);

      // Convert weight from grams to ounces (if exists)
      const weightInOz = product.weight_grams ? product.weight_grams / 28.35 : undefined;

      // Reset form with product data
      reset({
        title: product.name || '',
        slug: product.slug || '',
        brand: product.brand || 'Bin Mukhtar Retail',
        status: product.status || 'DRAFT',
        price: regularPrice,  // Regular/base price
        salePrice: salePrice,  // Sale price (if on sale)
        weight: weightInOz ? Math.round(weightInOz * 100) / 100 : undefined, // Round to 2 decimals
        images: product.galleryImageUrls || product.images || [],
        primaryImageUrl: product.primaryImageUrl || product.images?.[0] || undefined,
        galleryImageUrls: product.galleryImageUrls || product.images || [],
        primaryImageAlt: product.primaryImageAlt || undefined,
        category: product.categoryId || '',
        subcategory: product.subcategory || undefined,
        sizes: product.sizes || [],
        colors: product.colors || [],
        variants: variants,
        colorImageMappings: product.colorImageMappings || [],
        sleeve: product.sleeve || undefined,
        tags: tags, // Use processed tags array
        rating: product.rating || undefined,
        numReviews: product.numReviews || undefined,
      });
      
      setLastRefreshTime(new Date());
    } catch (error: any) {
      console.error('Error loading product:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProductData = async () => {
    if (!productId) return;
    
    try {
      setIsRefreshing(true);
      await loadProduct();
      // Show brief success message
      const originalStatus = submitStatus;
      setSubmitStatus('success');
      setErrorMessage('');
      setTimeout(() => {
        setSubmitStatus(originalStatus);
      }, 2000);
    } catch (error: any) {
      console.error('Error refreshing product:', error);
      setErrorMessage('Failed to refresh product data');
      setSubmitStatus('error');
    } finally {
      setIsRefreshing(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    console.log('Form submitted with data:', data);
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Calculate total stock from variants
      const totalStock = data.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const activeVariants = data.variants.filter(v => v.stock > 0).length;

      // Generate slug from title if not provided
      const slug = data.slug || data.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

      // Prepare data for API
      const productData: any = {
        name: data.title,
        slug: slug,
        subtitle: '',
        price: data.salePrice ? data.salePrice.toString() : data.price.toString(), // Use sale price if provided, otherwise regular price (this is the SELLING price)
        compareAtPrice: data.salePrice ? data.price.toString() : undefined, // If there's a sale price, regular price becomes "was $X"
        weight_grams: data.weight ? Math.round(data.weight * 28.35) : undefined, // Convert oz to grams (1 oz = 28.35g)
        images: data.images,
        thumbnail: data.images[0],
        categoryId: data.category,
        subcategory: data.subcategory,
        sizes: data.sizes,
        colors: data.colors,
        variants: data.variants.map(v => ({
          ...v,
          price: v.price ? v.price * 100 : undefined, // Convert to cents
          salePrice: v.salePrice ? v.salePrice * 100 : undefined, // Convert to cents
        })),
        colorImageMappings: data.colorImageMappings || [],
        tags: data.tags,
        published: true,
        description: `${data.category}`,
      };

      // Add id for edit mode
      if (isEditMode) {
        productData.id = productId;
      }

      console.log('Sending to API:', productData);

      // Send to API route
      const response = await fetch('/api/admin/products', {
        method: isEditMode ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.error || `Failed to ${isEditMode ? 'update' : 'create'} product`);
      }

      console.log(`Product ${isEditMode ? 'updated' : 'created'} successfully with ID:`, result.product?.id);
      
      // Invalidate cache so the frontend shows updated product
      try {
        const slug = data.title.toLowerCase().replace(/\s+/g, '-');
        await fetch('/api/revalidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            type: isEditMode ? 'product' : 'all-products',
            ...(isEditMode && { slug })
          }),
        });
        console.log(`Cache invalidated for ${isEditMode ? 'product' : 'all products'}`);
      } catch (cacheError) {
        console.warn('Failed to invalidate cache:', cacheError);
      }
      
      // Success state
      setSubmitStatus('success');
      
      // Reset form and redirect after 2 seconds
      setTimeout(() => {
        if (!isEditMode) {
        reset();
        }
        setSubmitStatus('idle');
        router.push('/admin');
      }, 2000);
      
    } catch (error: any) {
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} product:`, error);
      setSubmitStatus('error');
      setErrorMessage(error.message || `Failed to ${isEditMode ? 'update' : 'create'} product. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // No subcategory options in this simplified model

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-bmr-ink mx-auto mb-4" />
          <p className="text-bmr-muted">Loading product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Banner */}
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-bmr-acc-green/10 border border-bmr-acc-green rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-5 h-5 text-bmr-acc-green flex-shrink-0" />
          <p className="text-bmr-acc-green font-medium">Product {isEditMode ? 'updated' : 'created'} successfully!</p>
        </div>
      )}

      {/* Error Banner */}
      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-bmr-acc-red/10 border border-bmr-acc-red rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-bmr-acc-red flex-shrink-0" />
          <div>
            <p className="text-bmr-acc-red font-medium">Failed to {isEditMode ? 'update' : 'create'} product</p>
            <p className="text-sm text-bmr-acc-red/80">{errorMessage}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Debug Info (remove in production) */}
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

            <div className="grid md:grid-cols-2 gap-6">
              <ProductFormField
                label="Regular Price"
                type="number"
                required
                placeholder="99.99"
                step="0.01"
                min="0"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />

              <ProductFormField
                label="Sale Price (Optional)"
                type="number"
                placeholder="79.99 - Leave empty if not on sale"
                step="0.01"
                min="0"
                error={errors.salePrice?.message}
                {...register('salePrice', { valueAsNumber: true })}
              />
            </div>

            <div className="space-y-2">
              <ProductFormField
                label="Weight (oz) - Optional but recommended for accurate shipping"
                type="number"
                placeholder="12 (e.g., 12 oz for a thobe, 6 oz for a shemagh)"
                step="0.1"
                min="0"
                error={errors.weight?.message}
                {...register('weight', { valueAsNumber: true })}
              />
              <p className="text-xs text-muted">
                💡 Tip: Men's thobes ~12 oz, Boys' thobes ~10 oz, Shemaghs ~6 oz. Leave empty to use 16 oz default.
              </p>
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

          {/* Subcategory (depends on chosen category - loaded dynamically from Firebase) */}
          {category && (
            <div className="space-y-2">
              <label className="block text-sm font-medium">Subcategory</label>
              {isLoadingSubcategories ? (
                <div className="w-full px-4 py-3 border border-line rounded-lg bg-surface-3 text-bmr-muted flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading subcategories...
                </div>
              ) : (
                <>
                  <select
                    {...register('subcategory')}
                    className="w-full px-4 py-3 border border-line rounded-lg focus:outline-none focus:ring-2 focus:ring-bmr-ink"
                  >
                    <option value="">Select subcategory</option>
                    {getSubcategoriesForCategory(category).map((sub) => (
                      <option key={sub.value} value={sub.value}>
                        {sub.label}
                      </option>
                    ))}
                  </select>
                  {getSubcategoriesForCategory(category).length === 0 && (
                    <p className="text-sm text-bmr-muted mt-1">
                      No subcategories available for {category}.{' '}
                      <a href="/admin/categories" className="text-blue-600 hover:underline" target="_blank">
                        Create one →
                      </a>
                    </p>
                  )}
                </>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Instructions: Show this when basic info is NOT complete */}
        {!isBasicInfoComplete && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                ℹ️
              </div>
              <div>
                <h3 className="font-medium text-blue-900 mb-2">Complete Basic Information First</h3>
                <p className="text-sm text-blue-800 mb-3">
                  Please fill out all required fields in the "Basic Information" section above before accessing additional form sections:
                </p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Product Title (minimum 4 characters)</li>
                  <li>Price</li>
                  <li>Category</li>
                </ul>
                <p className="text-xs text-blue-700 mt-3">
                  Note: Sale Price is optional and can be left empty
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Images */}
        {isBasicInfoComplete && (
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <h2 className="font-display text-xl mb-6">Product Images</h2>
            
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
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}

        {/* Variants */}
        {isBasicInfoComplete && (
          <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="font-display text-xl">Product Variants</h2>
                {isEditMode && lastRefreshTime && (
                  <p className="text-xs text-bmr-muted mt-1">
                    Last updated: {lastRefreshTime.toLocaleTimeString()} • Auto-refreshes every 30s
                  </p>
                )}
              </div>
              {isEditMode && (
                <button
                  type="button"
                  onClick={refreshProductData}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 text-sm border border-line rounded hover:bg-surface-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Reload stock data from database"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Now'}
                </button>
              )}
            </div>
            
            <div className="space-y-6">
              {/* Size and Color Selection */}
              <div className={category === 'Shemaghs' ? 'grid grid-cols-1 gap-6' : 'grid md:grid-cols-2 gap-6'}>
                {category !== 'Shemaghs' && (
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

              {/* Stock Matrix */}
              <Controller
                name="variants"
                control={control}
                render={({ field }) => (
                  <VariantStockMatrix
                    sizes={watch('sizes')}
                    colors={watch('colors')}
                    value={field.value}
                    onChange={field.onChange}
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
        )}

        {/* Product Tags */}
        {isBasicInfoComplete && (
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
        )}

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => {
              reset();
              setSubmitStatus('idle');
            }}
            className="px-8 py-4 border border-line rounded-lg hover:bg-surface-3 transition-colors"
            disabled={isSubmitting}
          >
            Clear Form
          </button>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-8 py-4 bg-bmr-ink text-surface-2 rounded-lg hover:bg-bmr-fg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {isEditMode ? 'Updating Product...' : 'Creating Product...'}
              </>
            ) : (
              isEditMode ? 'Update Product' : 'Create Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
