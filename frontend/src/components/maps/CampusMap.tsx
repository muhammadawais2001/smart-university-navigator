import { useEffect, useState } from 'react';
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Link } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import { CAMPUS_CENTER, CAMPUS_ZOOM, TILE_ATTRIBUTION, TILE_URL } from '../../config';
import type { LatLng, Location } from '../../types';
import { hasCoords } from '../../utils/format';

const COLORS: Record<string, string> = {
  academic: '#2b4a7e', administration: '#7c3aed', 'student-services': '#0d9488', library: '#d97706',
  laboratory: '#db2777', 'food-and-cafeteria': '#ea580c', parking: '#475569', transport: '#0284c7',
  'sports-and-recreation': '#16a34a', 'other-facilities': '#64748b',
};
const icon = (slug?: string) =>
  L.divIcon({ className: '', iconSize: [28, 28], iconAnchor: [14, 28], popupAnchor: [0, -26],
    html: `<div class="marker-pin" style="background:${COLORS[slug ?? ''] ?? '#64748b'}"></div>` });

function Controller({ focus, route, fitKey }: { focus: Location | null; route: [number, number][] | null; fitKey: number }) {
  const map = useMap();
  useEffect(() => {
    if (focus && hasCoords(focus)) map.flyTo([focus.latitude, focus.longitude], 18, { duration: 0.6 });
  }, [focus, map]);
  useEffect(() => {
    if (route && route.length > 1) map.fitBounds(L.latLngBounds(route), { padding: [40, 40] });
  }, [route, map]);
  useEffect(() => { if (fitKey) map.setView([CAMPUS_CENTER.lat, CAMPUS_CENTER.lng], CAMPUS_ZOOM); }, [fitKey, map]);
  return null;
}

function TileWatcher({ onError }: { onError: () => void }) {
  const map = useMap();
  useEffect(() => {
    let errors = 0;
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) layer.on('tileerror', () => { if (++errors >= 3) onError(); });
    });
  }, [map, onError]);
  return null;
}

interface Props {
  locations: Location[]; focus?: Location | null; route?: [number, number][] | null; userPosition?: LatLng | null;
  height?: string; onTilesFailed?: () => void; linkMarkers?: boolean;
}
export default function CampusMap({ locations, focus = null, route = null, userPosition = null, height = '100%', onTilesFailed, linkMarkers = true }: Props) {
  const [fitKey, setFitKey] = useState(0);
  const pins = locations.filter(hasCoords);
  return (
    <div className="relative" style={{ height }}>
      <MapContainer center={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]} zoom={CAMPUS_ZOOM} className="h-full w-full rounded-2xl" scrollWheelZoom>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} maxZoom={19} />
        <TileWatcher onError={() => onTilesFailed?.()} />
        <Controller focus={focus} route={route} fitKey={fitKey} />
        {pins.map((l) => (
          <Marker key={l.id} position={[l.latitude, l.longitude]} icon={icon(l.category?.slug)}>
            <Popup>
              <strong>{l.name}</strong><br />{l.category?.name}<br />
              {linkMarkers && <Link to={`/locations/${l.slug}`}>View details</Link>}
            </Popup>
          </Marker>
        ))}
        {route && <Polyline positions={route} pathOptions={{ color: '#0d9488', weight: 5, dashArray: '8 6' }} />}
        {userPosition && <Circle center={[userPosition.lat, userPosition.lng]} radius={12} pathOptions={{ color: '#2563eb', fillOpacity: 0.7 }} />}
      </MapContainer>
      <button type="button" onClick={() => setFitKey((k) => k + 1)} aria-label="Reset map to campus area"
        className="btn-ghost absolute right-3 top-3 z-[1000] !min-h-[40px] shadow"><RotateCcw className="h-4 w-4" /><span className="hidden sm:inline">Reset view</span></button>
    </div>
  );
}
