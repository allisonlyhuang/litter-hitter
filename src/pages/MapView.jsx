import { useState, useEffect, useRef } from 'react';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../lib/supabase';

import Leaderboard from '../components/Leaderboard';
import CharacterMarker from '../components/CharacterMarker';
import LocationPicker from '../components/LocationPicker';
import Logo from '../components/Logo';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Arena centered on Aldrich Park, UC Irvine
const ARENA_CENTER = { lat: 33.6461, lng: -117.8427 };
const ARENA_RADIUS_MILES = 5;

// Bounding box for the 5-mile radius (~0.09 deg padding)
const ARENA_BOUNDS = [
  [ARENA_CENTER.lng - 0.09, ARENA_CENTER.lat - 0.09], // SW
  [ARENA_CENTER.lng + 0.09, ARENA_CENTER.lat + 0.09]  // NE
];

/** Haversine distance in miles between two lat/lng points */
function distanceMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Mock competitors placed around the UCI / Aldrich Park area
const MOCK_COMPETITORS = [
  { id: 'mock-1', username: 'AntEaterAce', character: 'frog', points: 180, lat: 33.6490, lng: -117.8460 },
  { id: 'mock-2', username: 'RoboBins', character: 'robot', points: 90, lat: 33.6430, lng: -117.8380 },
  { id: 'mock-3', username: 'BambooBear', character: 'panda', points: 120, lat: 33.6510, lng: -117.8500 },
  { id: 'mock-4', username: 'XenoRecycler', character: 'alien', points: 40, lat: 33.6400, lng: -117.8450 },
  { id: 'mock-5', username: 'FungiFriend', character: 'mushroom', points: 70, lat: 33.6470, lng: -117.8350 }
];

export default function MapView({ userProfile, onProfileUpdate, onNavigate }) {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewState, setViewState] = useState({
    latitude: ARENA_CENTER.lat,
    longitude: ARENA_CENTER.lng,
    zoom: 13
  });
  const [pinError, setPinError] = useState('');
  const [showMovePin, setShowMovePin] = useState(false);
  const [tempCoords, setTempCoords] = useState({ lat: null, lng: null });
  const [savingLocation, setSavingLocation] = useState(false);

  const mapRef = useRef(null);

  useEffect(() => {
    async function fetchPlayers() {
      setLoading(true);
      const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-url');

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.from('profiles').select('*');
          if (error) throw error;
          const supabasePlayers = (data || []).filter(p => p.id !== userProfile?.id);
          setPlayers(userProfile ? [userProfile, ...supabasePlayers] : supabasePlayers);
        } catch (err) {
          console.error("Error fetching map players:", err);
        } finally {
          setLoading(false);
        }
      } else {
        const localProfiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
        const uniqueLocal = localProfiles.filter(p => p.id !== userProfile?.id);
        setPlayers([
          ...(userProfile ? [userProfile] : []),
          ...uniqueLocal,
          ...MOCK_COMPETITORS.filter(comp => !uniqueLocal.some(l => l.username === comp.username))
        ]);
        setLoading(false);
      }
    }
    fetchPlayers();
  }, [userProfile]);

  const handlePlayerClick = (player) => {
    setViewState(prev => ({
      ...prev,
      latitude: player.lat,
      longitude: player.lng,
      zoom: 13,
      transitionDuration: 1200
    }));
  };

  const handleLocationSave = async () => {
    if (!tempCoords.lat || !tempCoords.lng) return;

    const dist = distanceMiles(tempCoords.lat, tempCoords.lng, ARENA_CENTER.lat, ARENA_CENTER.lng);
    if (dist > ARENA_RADIUS_MILES) {
      setPinError(`📍 That spot is ${dist.toFixed(1)} mi away — pins must be within ${ARENA_RADIUS_MILES} miles of Winvale, Irvine.`);
      return;
    }
    setPinError('');
    setSavingLocation(true);
    const updatedProfile = { ...userProfile, lat: tempCoords.lat, lng: tempCoords.lng };

    try {
      const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-url');
      if (isSupabaseConfigured) {
        await supabase
          .from('profiles')
          .update({ lat: tempCoords.lat, lng: tempCoords.lng })
          .eq('id', userProfile.id);
      } else {
        const globalMockProfiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
        localStorage.setItem('mock_profiles', JSON.stringify(
          globalMockProfiles.map(p => p.id === userProfile.id ? updatedProfile : p)
        ));
      }

      localStorage.setItem('recyclerumble_user_profile', JSON.stringify(updatedProfile));
      onProfileUpdate(updatedProfile);

      setViewState(prev => ({ ...prev, latitude: tempCoords.lat, longitude: tempCoords.lng, zoom: 12 }));
      setShowMovePin(false);
    } catch (err) {
      console.error("Error saving new coordinates:", err);
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col h-screen overflow-hidden" style={{ backgroundColor: '#0a130c' }}>
      {/* ── Top Header ── */}
      <header
        className="border-b backdrop-blur z-40"
        style={{ borderColor: 'rgba(17,124,72,0.3)', backgroundColor: 'rgba(10,19,12,0.8)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size="sm" showTagline={false} />
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight font-display" style={{ color: '#bbffba' }}>
                Global Arena Map
              </span>
              <span className="text-[9px] font-semibold tracking-wider uppercase" style={{ color: '#695032' }}>
                Active Arena
              </span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="border text-xs font-semibold py-2 px-4 rounded-xl transition duration-200 cursor-pointer flex items-center gap-1.5 shadow"
            style={{
              backgroundColor: 'rgba(17,124,72,0.12)',
              borderColor: 'rgba(17,124,72,0.35)',
              color: '#bbffba'
            }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(17,124,72,0.25)'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(17,124,72,0.12)'}
          >
            🏠 Back to Dashboard
          </button>
        </div>
      </header>

      {/* ── Split Grid Screen ── */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">

        {/* Sidebar */}
        <div
          className="w-full md:w-80 md:border-r p-4 flex flex-col gap-4 overflow-y-auto z-10 shrink-0"
          style={{
            backgroundColor: 'rgba(10,19,12,0.5)',
            borderColor: 'rgba(17,124,72,0.2)'
          }}
        >
          {/* Quick Actions */}
          <div className="glass-panel rounded-2xl p-4 space-y-3 shrink-0">
            <h3 className="text-xs font-extrabold uppercase tracking-widest" style={{ color: '#d89d57' }}>
              Map Actions
            </h3>

            <button
              onClick={() => { if (userProfile) handlePlayerClick(userProfile); }}
              className="w-full border text-xs font-semibold py-2 px-3 rounded-xl transition duration-200 cursor-pointer flex items-center justify-between"
              style={{
                backgroundColor: 'rgba(10,19,12,0.6)',
                borderColor: 'rgba(17,124,72,0.3)',
                color: '#bbffba'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(17,124,72,0.15)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(10,19,12,0.6)'}
            >
              <span>🔍 Center on My Avatar</span>
              <span className="text-base">🎯</span>
            </button>

            <button
              onClick={() => setShowMovePin(true)}
              className="w-full text-xs font-bold py-2.5 px-3 rounded-xl transition duration-200 cursor-pointer flex items-center justify-between shadow-lg"
              style={{
                background: 'linear-gradient(135deg, #117c48, #1aad64)',
                color: '#0a130c',
                boxShadow: '0 4px 16px rgba(17,124,72,0.25)'
              }}
              onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
              onMouseLeave={e => e.currentTarget.style.filter = 'none'}
            >
              <span>📍 Move My Pin Location</span>
              <span className="text-sm font-bold">✎</span>
            </button>
          </div>

          {/* Leaderboard */}
          <div className="flex-1 min-h-[300px]">
            <Leaderboard
              profiles={players}
              currentUserId={userProfile?.id}
              onPlayerClick={handlePlayerClick}
            />
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 h-full min-h-0 relative" style={{ backgroundColor: '#06080d' }}>
          {loading && (
            <div className="absolute inset-0 backdrop-blur-sm z-30 flex items-center justify-center" style={{ backgroundColor: 'rgba(10,19,12,0.8)' }}>
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 mb-3" style={{ color: '#117c48' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs font-semibold uppercase tracking-wider animate-pulse" style={{ color: '#bbffba' }}>
                  Loading Arena Map…
                </p>
              </div>
            </div>
          )}

          {!MAPBOX_TOKEN ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-8 text-center" style={{ backgroundColor: 'rgba(10,19,12,0.5)' }}>
              <div className="w-full max-w-md glass-panel p-6 rounded-3xl shadow-2xl relative">
                <span className="text-5xl">🗺️</span>
                <h3 className="text-lg font-bold tracking-tight text-white mt-3">Mapbox Token Not Set</h3>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: '#695032' }}>
                  Add <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(17,124,72,0.2)', color: '#bbffba' }}>VITE_MAPBOX_TOKEN</code> to your <code className="px-1 py-0.5 rounded text-[10px]" style={{ backgroundColor: 'rgba(17,124,72,0.2)', color: '#bbffba' }}>.env</code> file to enable the interactive map.
                </p>
                <div className="mt-5 border-t pt-4 text-left" style={{ borderColor: 'rgba(17,124,72,0.2)' }}>
                  <h4 className="text-xs font-bold mb-2" style={{ color: '#d89d57' }}>Simulated Arena Rankings (Mock Mode):</h4>
                  <div className="space-y-1.5">
                    {players.slice(0, 4).map((p, i) => (
                      <div
                        key={p.id}
                        className="flex justify-between items-center text-xs p-2 rounded-lg border"
                        style={{ backgroundColor: 'rgba(10,19,12,0.5)', borderColor: 'rgba(17,124,72,0.2)' }}
                      >
                        <span className="text-white font-medium">#{i + 1} {p.username}</span>
                        <span className="font-semibold" style={{ color: '#bbffba' }}>{p.points || 0} pts</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <Map
              {...viewState}
              ref={mapRef}
              onMove={evt => setViewState(evt.viewState)}
              mapStyle="mapbox://styles/mapbox/dark-v11"
              mapboxAccessToken={MAPBOX_TOKEN}
              style={{ width: '100%', height: '100%' }}
              maxBounds={ARENA_BOUNDS}
              minZoom={11}
            >
              {players.map((player) => (
                <CharacterMarker
                  key={player.id}
                  player={player}
                  isCurrentUser={player.id === userProfile?.id}
                  onClick={handlePlayerClick}
                />
              ))}
            </Map>
          )}
        </div>
      </div>

      {/* ── Move Pin Modal ── */}
      {showMovePin && (
        <div className="fixed inset-0 z-50 backdrop-blur-sm flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(10,19,12,0.85)' }}>
          <div className="w-full max-w-xl glass-panel p-6 rounded-3xl shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white font-display">📍 Set New Pin Coordinates</h3>
              <button
                onClick={() => setShowMovePin(false)}
                className="text-sm cursor-pointer transition"
                style={{ color: '#695032' }}
                onMouseEnter={e => e.currentTarget.style.color = '#bbffba'}
                onMouseLeave={e => e.currentTarget.style.color = '#695032'}
              >
                ✕
              </button>
            </div>

            <p className="text-xs" style={{ color: '#695032' }}>
              Click anywhere within{' '}
              <span className="font-semibold" style={{ color: '#bbffba' }}>5 miles of Winvale, Irvine</span>{' '}
              to place your pin.
            </p>
            {pinError && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-3 py-2">{pinError}</p>
            )}

            <LocationPicker
              initialLat={userProfile?.lat}
              initialLng={userProfile?.lng}
              onLocationSet={(lat, lng) => setTempCoords({ lat, lng })}
            />

            <div className="flex gap-3 mt-4 pt-2 border-t" style={{ borderColor: 'rgba(17,124,72,0.2)' }}>
              <button
                type="button"
                onClick={() => setShowMovePin(false)}
                className="flex-1 border text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer"
                style={{
                  backgroundColor: 'rgba(10,19,12,0.5)',
                  borderColor: 'rgba(17,124,72,0.25)',
                  color: '#695032'
                }}
                onMouseEnter={e => e.currentTarget.style.color = '#bbffba'}
                onMouseLeave={e => e.currentTarget.style.color = '#695032'}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLocationSave}
                disabled={savingLocation || !tempCoords.lat}
                className="flex-1 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer"
                style={
                  !tempCoords.lat || savingLocation
                    ? { backgroundColor: '#1a3024', color: '#695032', cursor: 'not-allowed' }
                    : {
                        background: 'linear-gradient(135deg, #117c48, #1aad64)',
                        color: '#0a130c',
                        boxShadow: '0 4px 16px rgba(17,124,72,0.25)'
                      }
                }
              >
                {savingLocation ? 'Updating…' : 'Save New Pin Location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
