'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ProductFormField } from './ProductFormField';
import { TagsInput } from './TagsInput';
import { MultiImageUpload } from './MultiImageUpload';
import { MultiSelect } from './MultiSelect';
import { VariantStockMatrix } from './VariantStockMatrix';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

// Category options and subcategories (per your spec)
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

// Variant interface
interface Variant {
  size: string;
  color: string;
  stock: number;
  sku?: string;
}

// Validation Schema
const productSchema = z.object({
  title: z.string().min(4, 'Title must be at least 4 characters'),
  price: z.number().positive('Price must be greater than 0'),
  salePrice: z.preprocess(
    (v) => {
      if (v === '' || v === undefined) return undefined;
      if (typeof v === 'number' && Number.isNaN(v)) return undefined;
      return Number(v);
    },
    z.number().positive('Sale price must be greater than 0').optional()
  ),
  images: z.array(z.string()).min(1, 'At least 1 product image is required'),
  category: z.string().min(1, 'Category is required'),
  subcategory: z.string().optional(),
  sizes: z.array(z.string()).min(1, 'At least 1 size is required'),
  colors: z.array(z.string()).min(1, 'At least 1 color is required'),
  variants: z.array(z.object({
    size: z.string(),
    color: z.string(),
    stock: z.number(),
    sku: z.string().optional(),
  })).min(1, 'At least 1 variant is required'),
  sleeve: z.enum(['short', 'long']).optional(),
  tags: z.array(z.string()).min(2, 'At least 2 tags are required'),
  orders: z.number().int().nonnegative('Orders must be non-negative').default(0),
  views: z.number().int().nonnegative('Views must be non-negative').default(0),
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
});

type ProductFormData = z.infer<typeof productSchema>;

export function CreateProductForm() {
  const router = useRouter();
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
      price: 0,
      salePrice: undefined,
      images: [],
      category: '',
      subcategory: undefined,
      sleeve: undefined,
      sizes: [],
      colors: [],
      variants: [],
      tags: [],
      orders: 0,
      views: 0,
      rating: undefined,
      numReviews: undefined,
    },
  });

  const category = watch('category');
  const subcategory = watch('subcategory');

  const onSubmit = async (data: ProductFormData) => {
    console.log('Form submitted with data:', data);
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Calculate total stock from variants
      const totalStock = data.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
      const activeVariants = data.variants.filter(v => v.stock > 0).length;

      // Prepare data for API
      const productData = {
        name: data.title,
        subtitle: '',
        price: data.price.toString(),
        compareAtPrice: data.salePrice ? data.salePrice.toString() : undefined,
        images: data.images,
        thumbnail: data.images[0],
        categoryId: data.category,
        subcategory: data.subcategory,
        audience: (data.category || 'Men').toUpperCase(),
        sizes: data.sizes,
        colors: data.colors,
        variants: data.variants,
        tags: data.tags,
        published: true,
        description: `${data.category}`,
      };

      console.log('Sending to API:', productData);

      // Send to API route
      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();
      console.log('API response:', result);

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product');
      }

      console.log('Product created successfully with ID:', result.product?.id);
      
      // Success state
      setSubmitStatus('success');
      
      // Reset form and redirect after 2 seconds
      setTimeout(() => {
        reset();
        setSubmitStatus('idle');
        router.push('/admin/products');
      }, 2000);
      
    } catch (error: any) {
      console.error('Error creating product:', error);
      setSubmitStatus('error');
      setErrorMessage(error.message || 'Failed to create product. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // No subcategory options in this simplified model

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Banner */}
      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-bmr-acc-green/10 border border-bmr-acc-green rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle className="w-5 h-5 text-bmr-acc-green flex-shrink-0" />
          <p className="text-bmr-acc-green font-medium">Product created successfully!</p>
        </div>
      )}

      {/* Error Banner */}
      {submitStatus === 'error' && (
        <div className="mb-6 p-4 bg-bmr-acc-red/10 border border-bmr-acc-red rounded-lg flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
          <AlertCircle className="w-5 h-5 text-bmr-acc-red flex-shrink-0" />
          <div>
            <p className="text-bmr-acc-red font-medium">Failed to create product</p>
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
                label="Price"
                type="number"
                required
                placeholder="99.99"
                step="0.01"
                min="0"
                error={errors.price?.message}
                {...register('price', { valueAsNumber: true })}
              />

              <ProductFormField
                label="Sale Price"
                type="number"
                placeholder="79.99 (Optional)"
                step="0.01"
                min="0"
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

          {/* Subcategory (depends on chosen category) */}
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

        {/* Variants */}
        <div className="bg-surface-2 rounded-lg border border-line p-6 lg:p-8">
          <h2 className="font-display text-xl mb-6">Product Variants</h2>
          
          <div className="space-y-6">
            {/* Size and Color Selection */}
            <div className="grid md:grid-cols-2 gap-6">
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
            <ProductFormField
              label="Initial Orders Count"
              type="number"
              placeholder="0"
              min="0"
              error={errors.orders?.message}
              {...register('orders', { valueAsNumber: true })}
            />

            <ProductFormField
              label="Initial Views Count"
              type="number"
              placeholder="0"
              min="0"
              error={errors.views?.message}
              {...register('views', { valueAsNumber: true })}
            />

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
                Creating Product...
              </>
            ) : (
              'Create Product'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
