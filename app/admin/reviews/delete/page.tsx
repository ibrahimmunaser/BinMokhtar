'use client';

import { useState } from 'react';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DeleteReviewsPage() {
  const [isDeleting, setIsDeleting] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleDeleteAll = async () => {
    if (!confirm('⚠️ Are you sure you want to DELETE ALL REVIEWS? This action cannot be undone!')) {
      return;
    }

    if (!confirm('🚨 FINAL WARNING: This will permanently delete ALL reviews from your database. Continue?')) {
      return;
    }

    setIsDeleting(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/reviews/delete-all', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setResult({
          success: true,
          message: `✅ Successfully deleted ${data.deletedCount} reviews and updated ${data.productsUpdated} products!`,
        });
      } else {
        setResult({
          success: false,
          message: `❌ Error: ${data.error || 'Failed to delete reviews'}`,
        });
      }
    } catch (error: any) {
      setResult({
        success: false,
        message: `❌ Error: ${error.message || 'Failed to delete reviews'}`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="mb-6">
          <Link 
            href="/admin" 
            className="text-blue-600 hover:text-blue-800 text-sm mb-2 inline-block"
          >
            ← Back to Admin
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Delete All Reviews</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <AlertTriangle className="w-6 h-6 text-red-500 mt-1 flex-shrink-0" />
            <div>
              <h2 className="text-xl font-semibold text-red-600 mb-2">Danger Zone</h2>
              <p className="text-gray-600 mb-4">
                This action will permanently delete ALL reviews from your database and reset the review
                counts on all products. This is useful for cleaning up test data before launching your
                website.
              </p>
              <p className="text-sm text-gray-500">
                ⚠️ This action cannot be undone. Make sure you want to proceed before clicking the button below.
              </p>
            </div>
          </div>

          <button
            onClick={handleDeleteAll}
            disabled={isDeleting}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 disabled:cursor-not-allowed text-white font-semibold py-3 px-6 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="w-5 h-5" />
            {isDeleting ? 'Deleting All Reviews...' : 'Delete All Reviews'}
          </button>
        </div>

        {result && (
          <div className={`rounded-lg shadow-sm border p-6 ${
            result.success 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start gap-4">
              {result.success ? (
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0" />
              )}
              <div>
                <h3 className={`font-semibold mb-2 ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.success ? 'Success!' : 'Error'}
                </h3>
                <p className={result.success ? 'text-green-700' : 'text-red-700'}>
                  {result.message}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">What this will do:</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Delete all reviews from the Firestore 'reviews' collection</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Reset review counts (reviewCount and ratingAvg) on all products to 0</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-500 mt-0.5">•</span>
              <span>Give your website a fresh start with no test reviews</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
