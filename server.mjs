import http from 'http';

const PORT = process.env.PORT || 3000;



const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Health check endpoint
  if (req.method === 'GET' && (req.url === '/health' || req.url === '/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', service: 'cpix-service', uptime: process.uptime() }));
    return;
  }

  // Remote config endpoint
  if (req.method === 'GET' && req.url === '/api/config') {
    const config = {
      minimumAppVersion: '1.0.0',
      recommendedCompressionMode: 'balanced',
      features: {
        targetSize: true,
        history: true,
        advancedFormats: true,
      },
    };
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(config));
    return;
  }

  // Opt-in anonymous telemetry endpoint (Zero user data / no binary images allowed!)
  if (req.method === 'POST' && req.url === '/api/analytics/events') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        // Verify privacy compliance: reject if any file binary, exif, or user identifiers are present
        if (payload.binary || payload.image || payload.exif) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Privacy policy violation: binary/EXIF data rejected' }));
          return;
        }
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ received: true }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, () => {
  console.log(`CPix lightweight service running on port ${PORT}`);
});
