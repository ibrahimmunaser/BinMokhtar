'use client';

import { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface ImageUploadProps {
  label: string;
  name: string;
  required?: boolean;
  error?: string;
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ label, name, required = false, error, value, onChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success && data.url) {
        onChange(data.url);
      } else {
        setUploadError(data.error || 'Upload failed');
      }
    } catch (err: any) {
      console.error('Upload error:', err);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange('');
    setUploadError('');
  };

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-medium">
        {label}
        {required && <span className="text-bmr-acc-red ml-1">*</span>}
      </label>

      {!value ? (
        <div>
          <label
            htmlFor={name}
            className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              error
                ? 'border-bmr-acc-red bg-bmr-acc-red/5 hover:bg-bmr-acc-red/10'
                : 'border-line bg-surface-3 hover:bg-surface-3/80'
            }`}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {uploading ? (
                <>
                  <Loader2 className="w-10 h-10 mb-3 text-bmr-muted animate-spin" />
                  <p className="text-sm text-bmr-muted">Uploading...</p>
                </>
              ) : (
                <>
                  <Upload className="w-10 h-10 mb-3 text-bmr-muted" />
                  <p className="mb-2 text-sm text-bmr-muted">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-bmr-muted">PNG, JPG, GIF up to 5MB</p>
                </>
              )}
            </div>
            <input
              id={name}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative aspect-[3/4] max-w-xs bg-surface-3 rounded-lg overflow-hidden border border-line">
            <img
              src={value}
              alt="Product preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-2 bg-bmr-acc-red text-surface-2 rounded-full hover:bg-bmr-acc-red/90 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-sm text-bmr-acc-red hover:underline"
          >
            Remove image
          </button>
        </div>
      )}

      {(error || uploadError) && (
        <p className="text-sm text-bmr-acc-red">{error || uploadError}</p>
      )}
    </div>
  );
}


