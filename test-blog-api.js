// Test script to verify blog API endpoints
const API_BASE = process.env.VITE_API_URL ? `${process.env.VITE_API_URL}/api` : 'http://localhost:5000/api';

async function testBlogAPI() {
  console.log('🧪 Testing Blog API endpoints...\n');

  try {
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('📊 Database:', healthData.database);
    console.log('');

    // Test blogs endpoint (without auth - should fail)
    console.log('2. Testing blogs endpoint without auth...');
    const blogsResponse = await fetch(`${API_BASE}/blogs`);
    console.log('📝 Status:', blogsResponse.status);
    
    if (blogsResponse.status === 401) {
      console.log('✅ Authentication required (expected)');
    } else {
      console.log('❌ Unexpected response');
    }
    console.log('');

    console.log('🎯 API endpoints are accessible');
    console.log('💡 Next steps:');
    console.log('   1. Make sure the backend server is running on port 5000');
    console.log('   2. Check that you are logged in to the admin panel');
    console.log('   3. Verify your authentication token is valid');
    console.log('   4. Check browser console for any CORS or network errors');

  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    console.log('💡 Make sure the backend server is running on port 5000');
  }
}

testBlogAPI();