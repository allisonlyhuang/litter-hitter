import React, { useState } from 'react';
import Map, { Marker } from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';


const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export default function LocationPicker({ initialLat, initialLng, onLocationSet }) {
  const [marker, setMarker] = useState(
    initialLat && initialLng ? { latitude: initialLat, longitude: initialLng } : null
  );

  const handleMapClick = (event) => {
    const { lng, lat } = event.lngLat;
    setMarker({ latitude: lat, longitude: lng });
    onLocationSet(lat, lng);
  };

  const defaultViewport = {
    latitude: marker?.latitude || 37.7749, // Default to San Francisco
    longitude: marker?.longitude || -122.4194,
    zoom: 11
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
            // Mock SF coordinates with a slight random spread
            const mockLat = 37.7749 + (Math.random() - 0.5) * 0.05;
            const mockLng = -122.4194 + (Math.random() - 0.5) * 0.05;
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
      >
        {marker && (
          <Marker latitude={marker.latitude} longitude={marker.longitude} anchor="bottom">
            <div className="text-3xl filter drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)] animate-bounce">📍</div>
          </Marker>
        )}
      </Map>
      <div className="absolute bottom-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 text-[11px] px-2.5 py-1.5 rounded-lg text-slate-300 pointer-events-none">
        {marker 
          ? `Lat: ${marker.latitude.toFixed(4)}, Lng: ${marker.longitude.toFixed(4)}` 
          : '🖱️ Click anywhere on map to drop your pin'}
      </div>
    </div>
  );
}
