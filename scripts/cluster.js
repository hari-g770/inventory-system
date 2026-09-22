// scripts/cluster.js
// Launches 3 independent Finefix servers (ports 3001, 3002, 3003)
// and an intelligent reverse-proxy load balancer on port 8080.
// Automatic health checking & failover: if one server dies, traffic routes to the others.

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

const SERVERS = [
  { id: 'server-1', port: 3001, alive: true },
  { id: 'server-2', port: 3002, alive: true },
  { id: 'server-3', port: 3003, alive: true }
];

const LB_PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':  'font/ttf'
};

function createStaticServer(serverId, port) {
  const server = http.createServer((req, res) => {
    // Health check endpoint
    if (req.url === '/_health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok', server: serverId, port }));
      return;
    }

    let reqPath = req.url.split('?')[0];
    if (reqPath === '/') reqPath = '/index.html';

    let filePath = path.join(DIST_DIR, reqPath);

    // SPA fallback: if file does not exist, serve index.html
    if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
      filePath = path.join(DIST_DIR, 'index.html');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Server Error');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentType,
        'X-Served-By': `${serverId}:${port}`,
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      });
      res.end(content);
    });
  });

  server.listen(port, () => {
    console.log(`  🚀 [${serverId}] Running on http://localhost:${port}`);
  });

  return server;
}

// ── Load Balancer ──────────────────────────────────────────
let currentIdx = 0;

function getNextHealthyServer() {
  const healthy = SERVERS.filter(s => s.alive);
  if (healthy.length === 0) return null;
  const chosen = healthy[currentIdx % healthy.length];
  currentIdx = (currentIdx + 1) % healthy.length;
  return chosen;
}

function startLoadBalancer() {
  const lb = http.createServer((req, res) => {
    // LB Status Endpoint
    if (req.url === '/_cluster_status') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        loadBalancer: `http://localhost:${LB_PORT}`,
        strategy: 'round-robin-with-failover',
        nodes: SERVERS
      }, null, 2));
      return;
    }

    const target = getNextHealthyServer();
    if (!target) {
      res.writeHead(503, { 'Content-Type': 'text/plain' });
      res.end('503 Service Unavailable — All 3 cluster nodes are down.');
      return;
    }

    // Proxy request to the selected server
    const options = {
      hostname: '127.0.0.1',
      port: target.port,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        'x-forwarded-host': req.headers.host || '',
        'x-forwarded-for': req.socket.remoteAddress || '',
        'x-forwarded-proto': 'http'
      }
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, {
        ...proxyRes.headers,
        'X-Load-Balanced-By': 'Finefix-Cluster-Proxy',
        'X-Handled-By': `${target.id}:${target.port}`
      });
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on('error', (err) => {
      console.warn(`⚠️ [LB] Node ${target.id}:${target.port} failed. Marking dead and failing over...`);
      target.alive = false;

      // Failover to next server
      const failoverTarget = getNextHealthyServer();
      if (!failoverTarget) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('502 Bad Gateway — Failover exhausted.');
        return;
      }

      const retryOptions = { ...options, port: failoverTarget.port };
      const retryReq = http.request(retryOptions, (retryRes) => {
        res.writeHead(retryRes.statusCode, {
          ...retryRes.headers,
          'X-Handled-By': `${failoverTarget.id}:${failoverTarget.port} (failover)`
        });
        retryRes.pipe(res, { end: true });
      });
      retryReq.on('error', () => {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('502 Bad Gateway');
      });
      req.pipe(retryReq, { end: true });
    });

    req.pipe(proxyReq, { end: true });
  });

  lb.listen(LB_PORT, () => {
    console.log(`\n==========================================================`);
    console.log(`  🌐 LOAD BALANCER ACTIVE ON http://localhost:${LB_PORT}`);
    console.log(`  ⚖️ Distributing traffic across 3 cluster servers:`);
    SERVERS.forEach(s => console.log(`     - ${s.id} -> http://localhost:${s.port}`));
    console.log(`  📊 Cluster Health Status: http://localhost:${LB_PORT}/_cluster_status`);
    console.log(`==========================================================\n`);
  });

  return lb;
}

// ── Health Monitor (Periodic Ping) ─────────────────────────
function startHealthChecker() {
  setInterval(() => {
    SERVERS.forEach(server => {
      const checkReq = http.get(`http://127.0.0.1:${server.port}/_health`, { timeout: 2000 }, (res) => {
        if (res.statusCode === 200) {
          if (!server.alive) {
            console.log(`🟢 [Health Monitor] ${server.id} recovered and added back to pool.`);
          }
          server.alive = true;
        } else {
          server.alive = false;
        }
      });
      checkReq.on('error', () => {
        if (server.alive) {
          console.warn(`🔴 [Health Monitor] ${server.id} on port ${server.port} is unreachable.`);
        }
        server.alive = false;
      });
    });
  }, 5000);
}

// ── Main Launch ────────────────────────────────────────────
console.log('📦 Starting Finefix 3-Node Cluster & Load Balancer...\n');

SERVERS.forEach(s => createStaticServer(s.id, s.port));
startLoadBalancer();
startHealthChecker();
