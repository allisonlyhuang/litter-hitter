import React, { useState } from 'react';
import CharacterPicker from '../components/CharacterPicker';
import LocationPicker from '../components/LocationPicker';
import { supabase } from '../lib/supabase';

export default function Setup({ onProfileCreated }) {
  const [username, setUsername] = useState('');
  const [characterId, setCharacterId] = useState('frog');
  const [coords, setCoords] = useState({ lat: null, lng: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLocationSet = (lat, lng) => {
    setCoords({ lat, lng });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username.trim()) {
      setErrorMsg('Please enter a username.');
      return;
    }
    if (!coords.lat || !coords.lng) {
      setErrorMsg('Please place your location pin on the map.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const cleanUsername = username.trim();
      const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-url');
      let profileId = '';
      let profileData = null;

      if (isSupabaseConfigured) {
        // Create user profile in Supabase
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            username: cleanUsername,
            character: characterId,
            lat: coords.lat,
            lng: coords.lng,
            points: 0
          })
          .select()
          .single();

        if (error) {
          if (error.code === '23505') {
            throw new Error('Username already taken. Please choose another one!');
          }
          throw error;
        }
        profileData = data;
        profileId = data.id;
      } else {
        // Fallback local simulation
        profileId = crypto.randomUUID();
        profileData = {
          id: profileId,
          username: cleanUsername,
          character: characterId,
          lat: coords.lat,
          lng: coords.lng,
          points: 0
        };
        // Save mock profiles locally to simulate other players
        const savedMockProfiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
        savedMockProfiles.push(profileData);
        localStorage.setItem('mock_profiles', JSON.stringify(savedMockProfiles));
      }

      // Save user session to localStorage
      localStorage.setItem('recyclerumble_user_id', profileId);
      localStorage.setItem('recyclerumble_user_profile', JSON.stringify(profileData));

      // Callback to app router
      if (onProfileCreated) {
        onProfileCreated(profileData);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create profile. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(16,185,129,0.06),transparent_60%)] pointer-events-none" />

      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-8">
        {/* Title */}
        <div className="text-center mb-6">
          <span className="text-5xl">♻️</span>
          <h1 className="text-3xl font-extrabold tracking-tight font-display bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mt-3">
            RecycleRumble
          </h1>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-md mx-auto leading-relaxed">
            Create your recycling avatar, drop a pin on the map, and compete globally to save the planet!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-wide uppercase text-slate-400">
              Player Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. EcoWarrior42"
              maxLength={20}
              className="bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/20 transition-all font-medium"
            />
          </div>

          {/* Character Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-wide uppercase text-slate-400">
              Select Character Avatar
            </label>
            <CharacterPicker selectedId={characterId} onSelect={setCharacterId} />
          </div>

          {/* Location Picker Map */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-bold tracking-wide uppercase text-slate-400">
                Drop Your Map Pin
              </label>
              {coords.lat && (
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  📍 Pinned
                </span>
              )}
            </div>
            <LocationPicker onLocationSet={handleLocationSet} />
          </div>

          {errorMsg && (
            <div className="p-3.5 bg-red-950/30 border border-red-900/40 rounded-xl text-xs text-red-400 font-medium text-center animate-shake">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full py-3.5 rounded-xl font-bold tracking-wide text-sm transition-all duration-300 shadow-xl cursor-pointer ${
              isSubmitting
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 hover:brightness-110 active:scale-98 shadow-emerald-500/10'
            }`}
          >
            {isSubmitting ? 'Entering Arena...' : 'Join the Arena 🚀'}
          </button>
        </form>
      </div>
    </div>
  );
}
