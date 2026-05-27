import React, { useState } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Arena center: Aldrich Park, UC Irvine
const ARENA_CENTER = { lat: 33.6461, lng: -117.8427 };
const ARENA_RADIUS_MILES = 5;
const ARENA_BOUNDS = [
  [ARENA_CENTER.lng - 0.09, ARENA_CENTER.lat - 0.09],
  [ARENA_CENTER.lng + 0.09, ARENA_CENTER.lat + 0.09]
];

function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function LocationPicker({ initialLat, initialLng, onLocationSet }) {
  const [marker, setMarker] = useState(
    initialLat && initialLng ? { latitude: initialLat, longitude: initialLng } : null
  );
  const [outOfBounds, setOutOfBounds] = useState(false);

  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    const dist = distanceMiles(lat, lng, ARENA_CENTER.lat, ARENA_CENTER.lng);
    if (dist > ARENA_RADIUS_MILES) {
      setOutOfBounds(true);
      return;
    }
    setOutOfBounds(false);
    setMarker({ latitude: lat, longitude: lng });
    onLocationSet(lat, lng);
  };

  const defaultViewport = {
    latitude: marker?.latitude || ARENA_CENTER.lat,
    longitude: marker?.longitude || ARENA_CENTER.lng,
    zoom: 13
  };

  if (!MAPBOX_TOKEN) {
    return (
      <div className="flex flex-col items-center justify-center p-8 rounded-2xl border border-dashed border-slate-800 bg-slate-950/40 text-center glass-panel">
        <span className="text-4xl mb-3">🗺️</span>
        <h3 className="text-lg font-semibold text-slate-200">Mapbox Token Not Configured</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
          Please add <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 text-[11px]">VITE_MAPBOX_TOKEN</code> to your <code className="bg-slate-900 px-1.5 py-0.5 rounded text-emerald-400 text-[11px] font-mono">.env</code> file.
        </p>
        <button
          type="button"
          onClick={() => {
            // Mock Irvine-area coordinates with slight random spread
            const mockLat = ARENA_CENTER.lat + (Math.random() - 0.5) * 0.04;
            const mockLng = ARENA_CENTER.lng + (Math.random() - 0.5) * 0.04;
            setMarker({ latitude: mockLat, longitude: mockLng });
            onLocationSet(mockLat, mockLng);
          }}
          className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-sm py-2 px-5 rounded-xl transition duration-200 cursor-pointer shadow-lg shadow-emerald-500/20"
        >
          🎲 Mock Location Pin
        </button>
      </div>
    );
  }

  return (
    <div className="w-full h-80 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
      <Map
        initialViewState={defaultViewport}
        mapStyle="mapbox://styles/mapbox/dark-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
        onClick={handleMapClick}
        cursor="pointer"
        maxBounds={ARENA_BOUNDS}
        minZoom={11}
      >
        {marker && (
          <Marker latitude={marker.latitude} longitude={marker.longitude} anchor="bottom">
            <div className="text-3xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] animate-bounce">📍</div>
          </Marker>
        )}
      </Map>
      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 text-[11px] px-2.5 py-1.5 rounded-lg text-slate-300 pointer-events-none">
        {outOfBounds
          ? '⛔ Outside the 5-mile arena — pick a closer spot'
          : marker
          ? `Lat: ${marker.latitude.toFixed(4)}, Lng: ${marker.longitude.toFixed(4)}`
          : '🖱️ Click within Irvine arena to drop your pin'}
      </div>
    </div>
  );
}
