'use client';

import { useState } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

interface MultiImageUploadProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  value: string[];
  onChange: (urls: string[]) => void;
}

export function MultiImageUpload({ label, name, required = false, error, value, onChange }: MultiImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate all files
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        setUploadError('All files must be images');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`${file.name} is too large. Maximum size is 5MB`);
        return;
      }
    }

    setUploading(true);
    setUploadError('');
    const uploadedUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success && data.url) {
          uploadedUrls.push(data.url);
        } else {
          setUploadError(data.error || `Failed to upload ${file.name}`);
          break;
        }
      }

      if (uploadedUrls.length > 0) {
        onChange([...value, ...uploadedUrls]);
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError('Failed to upload images. Please try again.');
    } finally {
      setUploading(false);
      setUploadProgress('');
      // Reset file input
      e.target.value = '';
    }
  };

  const handleRemove = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const moveImage = (fromIndex: number, toIndex: number) => {
    const newImages = [...value];
    const [movedImage] = newImages.splice(fromIndex, 1);
    newImages.splice(toIndex, 0, movedImage);
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-bmr-acc-red ml-1">*</span>}
        {value.length > 0 && (
          <span className="text-bmr-muted ml-2">({value.length} image{value.length !== 1 ? 's' : ''})</span>
        )}
      </label>

      {/* Upload Area */}
      <div>
        <label
          htmlFor={name}
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            uploading
              ? 'border-bmr-muted bg-surface-3/50 cursor-not-allowed'
              : error
              ? 'border-bmr-acc-red bg-bmr-acc-red/5 hover:bg-bmr-acc-red/10'
              : 'border-line bg-surface-3 hover:bg-surface-3/80'
          }`}
        >
          <div className="flex flex-col items-center justify-center py-4">
            {uploading ? (
              <>
                <Loader2 className="w-8 h-8 mb-2 text-bmr-muted animate-spin" />
                <p className="text-sm text-bmr-muted">{uploadProgress}</p>
              </>
            ) : (
              <>
                <Upload className="w-8 h-8 mb-2 text-bmr-muted" />
                <p className="text-sm text-bmr-muted">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-bmr-muted mt-1">PNG, JPG, GIF up to 5MB (multiple files allowed)</p>
              </>
            )}
          </div>
          <input
            id={name}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Error Message */}
      {(error || uploadError) && (
        <p className="text-sm text-bmr-acc-red">{error || uploadError}</p>
      )}

      {/* Image Grid */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Uploaded Images</p>
            <p className="text-xs text-bmr-muted">Drag to reorder • First image is the main image</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {value.map((url, index) => (
              <div
                key={`${url}-${index}`}
                className="relative group aspect-[3/4] bg-surface-3 rounded-lg overflow-hidden border border-line"
              >
                {/* Main Image Badge */}
                {index === 0 && (
                  <div className="absolute top-2 left-2 z-10 px-2 py-1 bg-bmr-ink text-surface-2 text-xs font-medium rounded">
                    Main
                  </div>
                )}

                {/* Image */}
                <img
                  src={url}
                  alt={`Product image ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-bmr-ink/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {/* Move Left */}
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index - 1)}
                      className="p-2 bg-surface-2 text-bmr-ink rounded-full hover:bg-surface-3 transition-colors"
                      title="Move left"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="p-2 bg-bmr-acc-red text-surface-2 rounded-full hover:bg-bmr-acc-red/90 transition-colors"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>

                  {/* Move Right */}
                  {index < value.length - 1 && (
                    <button
                      type="button"
                      onClick={() => moveImage(index, index + 1)}
                      className="p-2 bg-surface-2 text-bmr-ink rounded-full hover:bg-surface-3 transition-colors"
                      title="Move right"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>

                {/* Image Number */}
                <div className="absolute bottom-2 right-2 px-2 py-1 bg-bmr-ink/80 text-surface-2 text-xs rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>

          {/* Helper Text */}
          <p className="text-xs text-bmr-muted">
            💡 Tip: The first image will be used as the main product image. Use the arrow buttons to reorder.
          </p>
        </div>
      )}

      {/* Empty State */}
      {value.length === 0 && !uploading && (
        <div className="text-center py-8 border border-dashed border-line rounded-lg">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 text-bmr-muted opacity-50" />
          <p className="text-sm text-bmr-muted">No images uploaded yet</p>
          <p className="text-xs text-bmr-muted mt-1">Upload one or more images to get started</p>
        </div>
      )}
    </div>
  );
}


