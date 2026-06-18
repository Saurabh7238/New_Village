/**
 * Test script for Raise Query/Grievance Module
 * Tests: Form submission, Rate limiting, PDF generation, Tracking
 */

const baseURL = 'http://localhost:3000';

async function testQueryModule() {
  console.log('\n=== Testing Raise Query/Grievance Module ===\n');

  // Test 1: Check Rate Limit
  console.log('1️⃣ Testing Rate Limit Check...');
  try {
    const rateLimitRes = await fetch(`${baseURL}/api/queries/rate-limit/check?mobile=9876543210`);
    const rateLimitData = await rateLimitRes.json();
    console.log('✅ Rate limit check:', rateLimitData);
    console.log('   Allowed:', rateLimitData.allowed);
    console.log('   Remaining today:', rateLimitData.remaining);
  } catch (error) {
    console.error('❌ Rate limit check failed:', error.message);
  }

  // Test 2: Submit Query
  console.log('\n2️⃣ Testing Query Submission...');
  let queryId = null;
  let queryObjectId = null;
  try {
    const queryRes = await fetch(`${baseURL}/api/queries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Test User',
        mobile: '9876543210',
        ward: 3,
        category: 'Water',
        subject: 'Handpump not working in Ward 3',
        description: 'The handpump near the market has stopped working. Please send a mechanic.',
        address: 'Near Market, Ward 3',
        photo: null
      })
    });

    const queryData = await queryRes.json();
    if (queryRes.ok) {
      queryId = queryData.queryId;
      queryObjectId = queryData._id;
      console.log('✅ Query submitted successfully');
      console.log('   Query ID:', queryId);
      console.log('   MongoDB ID:', queryObjectId);
    } else {
      console.error('❌ Query submission failed:', queryData.message);
      return;
    }
  } catch (error) {
    console.error('❌ Query submission error:', error.message);
    return;
  }

  // Test 3: Fetch Query Details
  console.log('\n3️⃣ Testing Query Retrieval...');
  try {
    const getRes = await fetch(`${baseURL}/api/queries/${queryObjectId}`);
    const getQueryData = await getRes.json();
    if (getRes.ok) {
      console.log('✅ Query retrieved successfully');
      console.log('   Query ID:', getQueryData.queryId);
      console.log('   Status:', getQueryData.status);
      console.log('   Priority:', getQueryData.priority);
      console.log('   Assigned To:', getQueryData.assignedTo);
    } else {
      console.error('❌ Query retrieval failed:', getQueryData.message);
    }
  } catch (error) {
    console.error('❌ Query retrieval error:', error.message);
  }

  // Test 4: Generate Acknowledgment PDF
  console.log('\n4️⃣ Testing PDF Generation (Acknowledgment)...');
  try {
    const pdfRes = await fetch(`${baseURL}/api/queries/${queryObjectId}/pdf?type=acknowledgment`);
    if (pdfRes.ok) {
      const blob = await pdfRes.blob();
      console.log('✅ PDF generated successfully');
      console.log('   File size:', blob.size, 'bytes');
      console.log('   Content type:', pdfRes.headers.get('content-type'));
      console.log('   Is valid PDF:', blob.size > 1000 ? '✅ Yes' : '❌ Might be too small');

      // Save PDF for manual inspection
      const fs = require('fs');
      const buffer = await blob.arrayBuffer();
      fs.writeFileSync(`/tmp/acknowledgment_${queryId}.pdf`, Buffer.from(buffer));
      console.log(`   Saved to: /tmp/acknowledgment_${queryId}.pdf`);
    } else {
      console.error('❌ PDF generation failed:', pdfRes.status);
    }
  } catch (error) {
    console.error('❌ PDF generation error:', error.message);
  }

  // Test 5: Query Tracking
  console.log('\n5️⃣ Testing Query Tracking...');
  try {
    const trackRes = await fetch(`${baseURL}/api/queries?mobile=9876543210`);
    const trackQueries = await trackRes.json();
    const found = trackQueries.find(q => q.queryId === queryId);
    if (found) {
      console.log('✅ Query found in tracking');
      console.log('   Subject:', found.subject);
      console.log('   Category:', found.category);
      console.log('   Created:', new Date(found.createdAt).toLocaleString());
    } else {
      console.log('❌ Query not found in tracking results');
    }
  } catch (error) {
    console.error('❌ Query tracking error:', error.message);
  }

  // Test 6: Update Query Status
  console.log('\n6️⃣ Testing Query Status Update...');
  try {
    const updateRes = await fetch(`${baseURL}/api/queries/${queryObjectId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'Acknowledged',
        priority: 'High',
        adminRemarks: 'Query acknowledged. Will dispatch mechanic tomorrow.',
        auditEntry: {
          action: 'Acknowledged',
          changedBy: 'Test Admin'
        }
      })
    });

    if (updateRes.ok) {
      const updatedQuery = await updateRes.json();
      console.log('✅ Query updated successfully');
      console.log('   New Status:', updatedQuery.status);
      console.log('   Acknowledged At:', updatedQuery.acknowledgedAt);
    } else {
      const errorData = await updateRes.json();
      console.error('❌ Query update failed:', errorData.message);
    }
  } catch (error) {
    console.error('❌ Query update error:', error.message);
  }

  console.log('\n=== Test Summary ===');
  console.log('✅ Module testing completed');
  console.log('📝 Created Query ID:', queryId);
  console.log('\n💡 Next Steps:');
  console.log('1. Visit http://localhost:3000/grievance to test the UI form');
  console.log('2. Visit http://localhost:3000/track to test tracking page');
  console.log('3. Visit http://localhost:3000/admin/queries to test admin panel');
}

// Run tests
testQueryModule().catch(console.error);
