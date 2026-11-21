const http = require('http');

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== CivicLens Gemini Verification & Integration Test ===\n');

  // Test 1: Initial config check
  const cfg1 = await request({ host: 'localhost', port: 5000, path: '/api/config', method: 'GET' });
  console.log('Test 1: Initial Config:');
  console.log('   aiMode:', cfg1.body.aiMode);
  console.log('   isLiveAiConfigured:', cfg1.body.isLiveAiConfigured);
  console.log('   isVerified:', cfg1.body.isVerified);
  console.log('   Key exposed in response:', cfg1.body.apiKey ? 'FAILED (Key exposed!)' : 'PASSED (Secure, not exposed)');

  // Test 2: Submitting an invalid Gemini key MUST be rejected with HTTP 400 and clear error message
  console.log('\nTest 2: Submitting invalid Gemini key (should be rejected):');
  const invalidKeyRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/config/gemini-key',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { apiKey: 'AIzaSy_fake_test_key_for_verification_test_999' }
  );
  console.log('   Status Code:', invalidKeyRes.status, invalidKeyRes.status === 400 ? '(PASSED: Rejected)' : '(FAILED: Did not reject)');
  console.log('   Error Message:', invalidKeyRes.body?.error || invalidKeyRes.body);
  console.log('   Did it falsely claim success?:', invalidKeyRes.body?.success === false ? 'NO (PASSED)' : 'YES (FAILED)');

  // Test 3: Check config after failed attempt (MUST remain Demo Mode)
  const cfg2 = await request({ host: 'localhost', port: 5000, path: '/api/config', method: 'GET' });
  console.log('\nTest 3: Config after invalid attempt (must remain Demo Mode):');
  console.log('   aiMode:', cfg2.body.aiMode, cfg2.body.aiMode === 'Demo Mode (NLP Engine)' ? '(PASSED)' : '(FAILED)');
  console.log('   isVerified:', cfg2.body.isVerified, cfg2.body.isVerified === false ? '(PASSED)' : '(FAILED)');

  // Test 4: Switching back to Demo Mode cleanly
  console.log('\nTest 4: Switch to Demo Mode explicitly:');
  const demoRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/config/gemini-key',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    { apiKey: '' }
  );
  console.log('   Status:', demoRes.status === 200 ? 'PASSED' : 'FAILED');
  console.log('   Message:', demoRes.body.message);

  // Test 5: Complaint triage in Demo Mode
  console.log('\nTest 5: Complaint Triage in Demo Mode:');
  const triageRes = await request(
    {
      host: 'localhost',
      port: 5000,
      path: '/api/complaints/analyze',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    {
      text: "There is a huge pothole near the main school gate. Several vehicles are having difficulty passing.",
      location: "Main Gate, St. Jude School",
      imageUrl: "/samples/pothole.svg"
    }
  );
  console.log('   Category:', triageRes.body?.triage?.category);
  console.log('   Severity:', triageRes.body?.triage?.severity);
  console.log('   Department:', triageRes.body?.triage?.department);
  console.log('   AI Engine:', triageRes.body?.triage?.aiEngine);
  console.log('   Demo Mode flag:', triageRes.body?.triage?.demoMode);

  console.log('\n=== Verification Test Suite Completed ===');
}

runTests().catch(console.error);
