import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export default function OfflineBadge() {
  const [online, setOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    if (typeof window !== 'undefined') {
      window.addEventListener('online', on);
      window.addEventListener('offline', off);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', on);
        window.removeEventListener('offline', off);
      }
    };
  }, []);

  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        online
          ? 'bg-forest-100 text-forest-700'
          : 'bg-warn-100 text-warn-700 animate-pulse-slow'
      }`}
    >
      {online ? (
        <>
          <Wifi className="w-3 h-3" />
          <span>在线·本地库 v1.0</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3" />
          <span>🟢 离线模式·本地库 v1.0</span>
        </>
      )}
    </div>
  );
}
