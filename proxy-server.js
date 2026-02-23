const http = require('http');

const METRO_PORT = 8081;
const PROXY_PORT = 5000;

const proxy = http.createServer((req, res) => {
  const options = {
    hostname: '127.0.0.1',
    port: METRO_PORT,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: `localhost:${METRO_PORT}` },
  };

  const proxyReq = http.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    headers['cross-origin-opener-policy'] = 'same-origin';
    headers['cross-origin-embedder-policy'] = 'require-corp';
    headers['cache-control'] = 'no-cache, no-store, must-revalidate';
    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('Proxy error:', err.message);
    res.writeHead(502);
    res.end('Bad Gateway - Metro bundler not ready yet');
  });

  req.pipe(proxyReq, { end: true });
});

proxy.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`Proxy server running on http://0.0.0.0:${PROXY_PORT} -> Metro on ${METRO_PORT}`);
});
