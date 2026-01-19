/**
 * Delete All Reviews - HTTP API Approach
 * 
 * This script calls your existing API endpoint to delete all reviews.
 * This approach works better as it uses your server-side setup.
 * 
 * Prerequisites:
 * 1. Your Next.js dev server must be running (npm run dev)
 * 2. Run this script: node scripts/delete-all-reviews-api.js
 */

async function deleteAllReviews() {
  console.log('🗑️  Starting review deletion via API...\n');

  try {
    // First, let's check how many reviews exist
    console.log('📊 Checking for existing reviews...');
    
    // Get all reviews from the API (you'll need to implement a proper admin endpoint)
    // For now, let's use a different approach with direct Firestore access
    
    const response = await fetch('http://localhost:3000/api/reviews?limit=1000');
    
    if (!response.ok) {
      console.log('⚠️  Could not fetch reviews. Server might not be running.');
      console.log('   Make sure your Next.js server is running: npm run dev\n');
      return;
    }

    const data = await response.json();
    console.log(`   Found ${data.reviews?.length || 0} reviews\n`);

    if (!data.reviews || data.reviews.length === 0) {
      console.log('✅ No reviews found in the database.');
      return;
    }

    // Delete each review one by one
    console.log('🗑️  Deleting reviews...');
    let deletedCount = 0;

    for (const review of data.reviews) {
      try {
        const deleteResponse = await fetch(`http://localhost:3000/api/reviews?id=${review.id}`, {
          method: 'DELETE',
        });

        if (deleteResponse.ok) {
          deletedCount++;
          if (deletedCount % 10 === 0) {
            console.log(`   Deleted ${deletedCount}/${data.reviews.length} reviews...`);
          }
        }
      } catch (error) {
        console.error(`   Error deleting review ${review.id}:`, error.message);
      }
    }

    console.log(`\n✅ Successfully deleted ${deletedCount} reviews\n`);
    console.log('🎉 Review cleanup complete! Your website is fresh and ready.\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Tips:');
    console.log('   - Make sure your Next.js dev server is running: npm run dev');
    console.log('   - Check that your API endpoint is accessible at http://localhost:3000/api/reviews\n');
  }
}

// Run the script
deleteAllReviews()
  .then(() => {
    console.log('✨ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Script failed:', error);
    process.exit(1);
  });
