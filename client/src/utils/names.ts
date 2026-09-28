const AVATAR_COLORS = [
  { bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' },
  { bg: 'bg-blue-500/15 text-blue-300 border-blue-500/30', dot: 'bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]' },
  { bg: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]' },
  { bg: 'bg-purple-500/15 text-purple-300 border-purple-500/30', dot: 'bg-purple-400 shadow-[0_0_8px_rgba(192,132,252,0.6)]' },
  { bg: 'bg-rose-500/15 text-rose-300 border-rose-500/30', dot: 'bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.6)]' },
  { bg: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30', dot: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]' },
  { bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30', dot: 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.6)]' },
  { bg: 'bg-teal-500/15 text-teal-300 border-teal-500/30', dot: 'bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]' },
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
