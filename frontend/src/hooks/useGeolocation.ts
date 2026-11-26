import { useCallback, useState } from 'react';
import type { LatLng } from '../types';

/** One-shot, on-demand position. Never persisted or sent to our servers. */
export function useGeolocation() {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const request = useCallback(() => {
    if (!('geolocation' in navigator)) { setError('Location is not available on this device.'); return; }
    setLoading(true); setError(null);
    navigator.geolocation.getCurrentPosition(
      (p) => { setPosition({ lat: p.coords.latitude, lng: p.coords.longitude }); setLoading(false); },
      (e) => {
        setLoading(false);
        setError(e.code === e.PERMISSION_DENIED ? 'Location permission was denied. You can choose a place manually.'
          : 'Could not determine your position. GPS is unreliable indoors; choose a place manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }, []);
  return { position, error, loading, request, clear: () => setPosition(null) };
}
