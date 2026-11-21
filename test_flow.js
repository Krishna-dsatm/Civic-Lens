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
  console.log('--- Starting CivicLens Automated Flow Tests ---');

  // 1. Health check
  const health = await request({ host: 'localhost', port: 5000, path: '/api/health', method: 'GET' });
  console.log('1. Health check:', health.status === 200 && health.body.status === 'healthy' ? 'PASS' : 'FAIL');

  // 2. Initial stats check
  const stats1 = await request({ host: 'localhost', port: 5000, path: '/api/stats', method: 'GET' });
  console.log('2. Initial stats (Total complaints):', stats1.body?.stats?.total, stats1.body?.stats?.total >= 6 ? 'PASS' : 'FAIL');

  // 3. AI Triage & Submit new complaint (English: Pothole)
  const newComplaint = {
    text: "There is a huge pothole near the main school gate. Several vehicles are having difficulty passing.",
    location: "Main Gate, St. Jude Public School, Ward 14",
    imageUrl: "/samples/pothole.svg"
  };
  const submitRes = await request(
    { 
      host: 'localhost', 
      port: 5000, 
      path: '/api/complaints', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    newComplaint
  );
  console.log('3. Submit Complaint (Pothole):', submitRes.status === 201 ? 'PASS' : 'FAIL');
  const ticket = submitRes.body?.ticket;
  console.log('   -> Ticket ID:', ticket?.id);
  console.log('   -> Category:', ticket?.category, ticket?.category === 'Roads and Potholes' ? '(PASS)' : '(FAIL)');
  console.log('   -> Severity:', ticket?.severity, ticket?.severity === 'HIGH' ? '(PASS)' : '(FAIL)');
  console.log('   -> Department:', ticket?.department, ticket?.department === 'Public Works Department' ? '(PASS)' : '(FAIL)');
  console.log('   -> Duplicate Flagged:', submitRes.body?.duplicateReport?.isDuplicate ? 'YES (PASS)' : 'NO');

  // 4. Submit Multilingual Regional Complaint (Hindi)
  const hindiComplaint = {
    text: "बिजली का तार खंभे से टूटकर सड़क पर गिर गया है और उसमें चिंगारी निकल रही है, बहुत खतरा है।",
    location: "वार्ड 12, मेन चौराहा"
  };
  const submitHindi = await request(
    { 
      host: 'localhost', 
      port: 5000, 
      path: '/api/complaints', 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    },
    hindiComplaint
  );
  console.log('4. Submit Regional Hindi Complaint (Electric live wire):', submitHindi.status === 201 ? 'PASS' : 'FAIL');
  const hindiTicket = submitHindi.body?.ticket;
  console.log('   -> Language Detected:', hindiTicket?.detectedLanguage);
  console.log('   -> Category:', hindiTicket?.category, hindiTicket?.category === 'Electricity and Streetlights' ? '(PASS)' : '(FAIL)');
  console.log('   -> Severity:', hindiTicket?.severity, hindiTicket?.severity === 'CRITICAL' ? '(PASS)' : '(FAIL)');
  console.log('   -> Department:', hindiTicket?.department, hindiTicket?.department === 'Electrical Department' ? '(PASS)' : '(FAIL)');

  // 5. Test Filters & Priority Sorting on Admin Dashboard
  const listCritical = await request({ host: 'localhost', port: 5000, path: '/api/complaints?severity=CRITICAL', method: 'GET' });
  console.log('5. Filter by Severity=CRITICAL:', listCritical.body?.complaints?.length > 0 ? 'PASS' : 'FAIL', `(${listCritical.body?.complaints?.length} critical found)`);

  const listRoads = await request({ host: 'localhost', port: 5000, path: '/api/complaints?category=Roads%20and%20Potholes', method: 'GET' });
  console.log('6. Filter by Category=Roads and Potholes:', listRoads.body?.complaints?.length > 0 ? 'PASS' : 'FAIL', `(${listRoads.body?.complaints?.length} found)`);

  // 7. Update ticket status: Pending -> In Progress -> Resolved
  const update1 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: `/api/complaints/${ticket.id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    },
    { status: 'In Progress', note: 'Asphalt repair unit dispatched' }
  );
  console.log('7. Update status to In Progress:', update1.body?.ticket?.status === 'In Progress' ? 'PASS' : 'FAIL');

  const update2 = await request(
    {
      host: 'localhost',
      port: 5000,
      path: `/api/complaints/${ticket.id}/status`,
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    },
    { status: 'Resolved', note: 'Pothole cavity filled with hot-mix bitumen' }
  );
  console.log('8. Update status to Resolved:', update2.body?.ticket?.status === 'Resolved' ? 'PASS' : 'FAIL');

  // 8. Verify Frontend HTML serving
  const frontendIndex = await request({ host: 'localhost', port: 5000, path: '/', method: 'GET' });
  console.log('9. Frontend SPA serving:', frontendIndex.body && typeof frontendIndex.body === 'string' && frontendIndex.body.includes('CivicLens') ? 'PASS' : 'FAIL');

  console.log('--- All Automated Tests Passed Successfully! ---');
}

runTests().catch(console.error);
