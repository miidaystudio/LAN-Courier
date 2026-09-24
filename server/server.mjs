import http from 'http';
import crypto from 'crypto';
import { WebSocketServer, WebSocket } from 'ws';

const PORT = process.env.PORT || 5000;

import os from 'os';

function getPrimaryLANIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if ('IPv4' === iface.family && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

function getSubnetHash(ip) {
  let cleanIp = (ip || '127.0.0.1').replace(/^.*:/, '');
  if (cleanIp === '127.0.0.1' || cleanIp === 'localhost' || cleanIp === '1') {
    cleanIp = getPrimaryLANIP();
  }
  const parts = cleanIp.split('.');
  const subnet = parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}.0/24` : '192.168.1.0/24';
  const hash = crypto.createHash('sha256').update('lan-courier-subnet:' + subnet).digest('hex');
  return { subnet, hash: hash.slice(0, 8) };
}

const rooms = new Map(); // roomCode -> Map<peerId, client>
const clients = new Map(); // peerId -> client

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/transfers') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        console.log(`[Audit Log] '${payload.fileName}' (${payload.fileSizeBytes} B) ${payload.senderDevice} -> ${payload.receiverDevice} (${payload.durationMs}ms)`);
        res.writeHead(201, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'recorded', message: 'Logged to ledger' }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
    return;
  }

  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', activeClients: clients.size }));
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

const wss = new WebSocketServer({ noServer: true });

server.on('upgrade', (req, socket, head) => {
  if (req.url.startsWith('/ws')) {
    wss.handleUpgrade(req, socket, head, (ws) => {
      wss.emit('connection', ws, req);
    });
  } else {
    socket.destroy();
  }
});

function broadcastPeerList(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const peerList = Array.from(room.values()).map((p) => ({
    id: p.id,
    deviceName: p.deviceName,
    deviceType: p.deviceType,
    ipAddress: p.ip,
    ip: p.ip,
  }));

  const msg = JSON.stringify({
    type: 'peer-list',
    from: 'server',
    roomCode,
    payload: { roomCode, peers: peerList },
  });

  for (const client of room.values()) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msg);
    }
  }
}

wss.on('connection', (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const clientIp = req.headers['x-real-ip'] || req.headers['x-forwarded-for']?.split(',')[0] || req.socket.remoteAddress || '127.0.0.1';
  const { subnet, hash } = getSubnetHash(clientIp);

  const peerId = url.searchParams.get('peerId') || crypto.randomUUID();
  const deviceName = url.searchParams.get('deviceName') || 'Anonymous Device';
  const deviceType = url.searchParams.get('deviceType') || 'desktop';
  let roomCode = url.searchParams.get('roomCode') || hash;

  const client = { id: peerId, deviceName, deviceType, ip: clientIp, roomCode, ws };
  clients.set(peerId, client);

  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, new Map());
  }
  rooms.get(roomCode).set(peerId, client);
  console.log(`[Hub] Connected: ${deviceName} (${peerId}) in room [${roomCode}]`);

  broadcastPeerList(roomCode);

  ws.on('message', (data) => {
    try {
      const env = JSON.parse(data.toString());
      env.from = peerId;

      if (env.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', from: 'server', to: peerId }));
        return;
      }

      if (env.type === 'join-custom-room') {
        const newRoom = env.payload?.roomCode;
        if (newRoom && newRoom !== client.roomCode) {
          const oldRoom = client.roomCode;
          rooms.get(oldRoom)?.delete(peerId);
          if (rooms.get(oldRoom)?.size === 0) rooms.delete(oldRoom);

          client.roomCode = newRoom;
          if (!rooms.has(newRoom)) rooms.set(newRoom, new Map());
          rooms.get(newRoom).set(peerId, client);

          console.log(`[Hub] Peer ${deviceName} moved to room [${newRoom}]`);
          broadcastPeerList(oldRoom);
          broadcastPeerList(newRoom);
        }
        return;
      }

      if (env.to) {
        const target = clients.get(env.to);
        if (target && target.ws.readyState === WebSocket.OPEN) {
          target.ws.send(JSON.stringify(env));
        }
      } else if (env.roomCode) {
        const room = rooms.get(env.roomCode);
        if (room) {
          const raw = JSON.stringify(env);
          for (const [id, c] of room.entries()) {
            if (id !== peerId && c.ws.readyState === WebSocket.OPEN) {
              c.ws.send(raw);
            }
          }
        }
      }
    } catch (e) {
      console.error('[Hub] Message parse error:', e);
    }
  });

  ws.on('close', () => {
    console.log(`[Hub] Disconnected: ${deviceName} (${peerId})`);
    clients.delete(peerId);
    const room = rooms.get(client.roomCode);
    if (room) {
      room.delete(peerId);
      if (room.size === 0) rooms.delete(client.roomCode);
      broadcastPeerList(client.roomCode);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 LAN Courier Signaling Server listening on http://0.0.0.0:${PORT}`);
});
