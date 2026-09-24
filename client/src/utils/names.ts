const AVATAR_COLORS = [
  { bg: 'bg-emerald-100 text-emerald-800 border-emerald-300', dot: 'bg-emerald-500' },
  { bg: 'bg-blue-100 text-blue-800 border-blue-300', dot: 'bg-blue-500' },
  { bg: 'bg-amber-100 text-amber-800 border-amber-300', dot: 'bg-amber-500' },
  { bg: 'bg-violet-100 text-violet-800 border-violet-300', dot: 'bg-violet-500' },
  { bg: 'bg-rose-100 text-rose-800 border-rose-300', dot: 'bg-rose-500' },
  { bg: 'bg-cyan-100 text-cyan-800 border-cyan-300', dot: 'bg-cyan-500' },
  { bg: 'bg-indigo-100 text-indigo-800 border-indigo-300', dot: 'bg-indigo-500' },
  { bg: 'bg-teal-100 text-teal-800 border-teal-300', dot: 'bg-teal-500' },
];

export function detectRealDeviceName(): { name: string; type: 'desktop' | 'mobile' | 'tablet' } {
  const ua = navigator.userAgent;

  let os = 'Device';
  let type: 'desktop' | 'mobile' | 'tablet' = 'desktop';

  if (/iPhone/i.test(ua)) {
    os = 'iPhone';
    type = 'mobile';
  } else if (/iPad/i.test(ua)) {
    os = 'iPad';
    type = 'tablet';
  } else if (/Android/i.test(ua)) {
    if (/tablet/i.test(ua)) {
      os = 'Android Tablet';
      type = 'tablet';
    } else {
      os = 'Android Phone';
      type = 'mobile';
    }
  } else if (/Macintosh|Mac OS X/i.test(ua)) {
    os = 'MacBook';
    type = 'desktop';
  } else if (/Windows/i.test(ua)) {
    os = 'Windows PC';
    type = 'desktop';
  } else if (/Linux/i.test(ua)) {
    os = 'Linux PC';
    type = 'desktop';
  } else if (/CrOS/i.test(ua)) {
    os = 'Chromebook';
    type = 'desktop';
  }

  // Detect Browser
  let browser = '';
  if (/Edg\//i.test(ua)) {
    browser = 'Edge';
  } else if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) {
    browser = 'Chrome';
  } else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) {
    browser = 'Safari';
  } else if (/Firefox\//i.test(ua)) {
    browser = 'Firefox';
  }

  // Generate clean name like "Windows PC (Chrome)" or "iPhone (Safari)"
  const randNum = Math.floor(100 + Math.random() * 900);
  const fullName = browser ? `${os} [${browser}] (${randNum})` : `${os} (${randNum})`;

  return { name: fullName, type };
}

export function getDeviceIdentity(): { id: string; name: string; type: 'desktop' | 'mobile' | 'tablet' } {
  let id = localStorage.getItem('lan_courier_peer_id');
  let name = localStorage.getItem('lan_courier_peer_name');

  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : 'peer-' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('lan_courier_peer_id', id);
  }

  const detected = detectRealDeviceName();

  // If name was missing or was an old animal moniker, migrate to real device name
  const isOldAnimalName = name && /(Otter|Falcon|Fox|Badger|Dolphin|Lynx|Panda|Eagle|Beaver|Gazelle|Koala|Leopard|Robin|Tiger|Wolf|Owl)/i.test(name);

  if (!name || isOldAnimalName) {
    name = detected.name;
    localStorage.setItem('lan_courier_peer_name', name);
  }

  return { id, name, type: detected.type };
}

export function getPeerTheme(peerId: string) {
  let hash = 0;
  for (let i = 0; i < peerId.length; i++) {
    hash = peerId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
}

export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  if (seconds < 1) return '< 1s';
  if (seconds < 60) return `${Math.ceil(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  return `${mins}m ${secs}s`;
}
