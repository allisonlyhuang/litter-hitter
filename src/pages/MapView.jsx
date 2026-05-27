import React, { useState, useEffect, useRef } from 'react';
import Map from 'react-map-gl/mapbox';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '../lib/supabase';

import Leaderboard from '../components/Leaderboard';
import CharacterMarker from '../components/CharacterMarker';
import LocationPicker from '../components/LocationPicker';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Arena centered on Winvale, Irvine, CA 92612
const ARENA_CENTER = { lat: 33.6856, lng: -117.8230 };
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

// Mock competitors placed around the Irvine/Winvale area
const MOCK_COMPETITORS = [
  { id: 'mock-1', username: 'IrvineGreen', character: 'frog', points: 180, lat: 33.6920, lng: -117.8310 },
  { id: 'mock-2', username: 'RoboBins', character: 'robot', points: 90, lat: 33.6780, lng: -117.8140 },
  { id: 'mock-3', username: 'BambooBear', character: 'panda', points: 120, lat: 33.6810, lng: -117.8380 },
  { id: 'mock-4', username: 'XenoRecycler', character: 'alien', points: 40, lat: 33.6900, lng: -117.8100 },
  { id: 'mock-5', username: 'FungiFriend', character: 'mushroom', points: 70, lat: 33.6730, lng: -117.8270 }
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
    fetchPlayers();
  }, [userProfile]);

  const fetchPlayers = async () => {
    setLoading(true);
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-url');

    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*');

        if (error) throw error;
        
        // Filter out active user to avoid duplicate key issues if listed twice
        const supabasePlayers = (data || []).filter(p => p.id !== userProfile?.id);
        
        // Merge in active user profile
        if (userProfile) {
          setPlayers([userProfile, ...supabasePlayers]);
        } else {
          setPlayers(supabasePlayers);
        }
      } catch (err) {
        console.error("Error fetching map players:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Local/mock storage retrieval
      const localProfiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
      
      // Filter unique items
      const uniqueLocal = localProfiles.filter(p => p.id !== userProfile?.id);

      // Merge current user, local mock creations, and standard default competitors
      const allMockPlayers = [
        ...(userProfile ? [userProfile] : []),
        ...uniqueLocal,
        ...MOCK_COMPETITORS.filter(comp => !uniqueLocal.some(l => l.username === comp.username))
      ];

      setPlayers(allMockPlayers);
      setLoading(false);
    }
  };

  const handlePlayerClick = (player) => {
    // Fly camera view to clicked player's coordinates
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
    const updatedProfile = {
      ...userProfile,
      lat: tempCoords.lat,
      lng: tempCoords.lng
    };

    try {
      const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-url');
      if (isSupabaseConfigured) {
        await supabase
          .from('profiles')
          .update({
            lat: tempCoords.lat,
            lng: tempCoords.lng
          })
          .eq('id', userProfile.id);
      } else {
        const globalMockProfiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
        const updatedGlobalList = globalMockProfiles.map(p => p.id === userProfile.id ? updatedProfile : p);
        localStorage.setItem('mock_profiles', JSON.stringify(updatedGlobalList));
      }

      localStorage.setItem('recyclerumble_user_profile', JSON.stringify(updatedProfile));
      onProfileUpdate(updatedProfile);
      
      // Pan camera to new position
      setViewState(prev => ({
        ...prev,
        latitude: tempCoords.lat,
        longitude: tempCoords.lng,
        zoom: 12
      }));

      setShowMovePin(false);
    } catch (err) {
      console.error("Error saving new coordinates:", err);
    } finally {
      setSavingLocation(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur z-40">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🗺️</span>
            <div className="flex flex-col">
              <h1 className="text-lg font-extrabold tracking-tight font-display bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Global Arena Map
              </h1>
              <span className="text-[9px] text-slate-500 font-semibold tracking-wider uppercase">Active Arena</span>
            </div>
          </div>

          <button
            onClick={() => onNavigate('home')}
            className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-semibold py-2 px-4 rounded-xl transition duration-200 cursor-pointer flex items-center gap-1.5 shadow"
          >
            🏠 Back to Dashboard
          </button>
        </div>
      </header>

      {/* Split Grid Screen */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 relative">
        
        {/* Left Side: Sidebar Stats + Leaderboard */}
        <div className="w-full md:w-80 bg-slate-950/40 md:border-r border-slate-980 p-4 flex flex-col gap-4 overflow-y-auto z-10 shrink-0">
          
          {/* Quick Actions Card */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-4 space-y-3 shrink-0">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-450">Map Actions</h3>
            
            <button
              onClick={() => {
                if (userProfile) {
                  handlePlayerClick(userProfile);
                }
              }}
              className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-semibold py-2 px-3 rounded-xl transition duration-250 cursor-pointer flex items-center justify-between"
            >
              <span>🔍 Center on My Avatar</span>
              <span className="text-base">🎯</span>
            </button>

            <button
              onClick={() => setShowMovePin(true)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold py-2.5 px-3 rounded-xl transition duration-200 cursor-pointer flex items-center justify-between shadow-lg shadow-emerald-500/10"
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

        {/* Right Side: Large Fullscreen Map */}
        <div className="flex-1 h-full min-h-0 relative bg-[#06080d]">
          {loading && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm z-30 flex items-center justify-center">
              <div className="flex flex-col items-center">
                <svg className="animate-spin h-8 w-8 text-emerald-400 mb-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider animate-pulse">Loading Arena Map...</p>
              </div>
            </div>
          )}

          {!MAPBOX_TOKEN ? (
            <div className="absolute inset-0 z-20 flex items-center justify-center p-8 bg-slate-950/40 text-center">
              <div className="w-full max-w-md glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl relative">
                <span className="text-5xl">🗺️</span>
                <h3 className="text-lg font-bold tracking-tight text-white mt-3">Interactive Arena Map Mapbox Not Set</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  The Mapbox Token is missing from the environment. To view the active rendering map complete with characters, please add <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-400 text-[10px]">VITE_MAPBOX_TOKEN</code> to your <code className="bg-slate-900 px-1 py-0.5 rounded text-emerald-400 text-[10px]">.env</code> file.
                </p>
                <div className="mt-5 border-t border-slate-850 pt-4 text-left">
                  <h4 className="text-xs font-bold text-slate-350 mb-2">Simulated Arena Rankings (Mock Mode):</h4>
                  <div className="space-y-1.5">
                    {players.slice(0, 4).map((p, i) => (
                      <div key={p.id} className="flex justify-between items-center text-xs bg-slate-900/40 p-2 rounded-lg border border-slate-850">
                        <span className="text-slate-300 font-medium">#{i+1} {p.username}</span>
                        <span className="text-emerald-400 font-semibold">{p.points || 0} pts</span>
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

      {/* Move Pin Modal Overlay */}
      {showMovePin && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-xl glass-panel p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-white font-display">📍 Set New Pin Coordinates</h3>
              <button 
                onClick={() => setShowMovePin(false)}
                className="text-slate-500 hover:text-slate-200 text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <p className="text-xs text-slate-400">
              Click anywhere within <span className="text-emerald-400 font-semibold">5 miles of Winvale, Irvine</span> to place your pin.
            </p>
            {pinError && (
              <p className="text-xs text-red-400 bg-red-950/40 border border-red-900/50 rounded-xl px-3 py-2">{pinError}</p>
            )}

            <LocationPicker 
              initialLat={userProfile?.lat} 
              initialLng={userProfile?.lng}
              onLocationSet={(lat, lng) => setTempCoords({ lat, lng })}
            />

            <div className="flex gap-3 mt-4 pt-2 border-t border-slate-850">
              <button
                type="button"
                onClick={() => setShowMovePin(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-slate-350 border border-slate-800 text-xs font-semibold py-2.5 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleLocationSave}
                disabled={savingLocation || !tempCoords.lat}
                className={`flex-1 text-xs font-bold py-2.5 rounded-xl transition cursor-pointer ${
                  !tempCoords.lat || savingLocation
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-950 shadow-lg shadow-emerald-500/10'
                }`}
              >
                {savingLocation ? 'Updating...' : 'Save New Pin location'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
