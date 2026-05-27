import React, { useState } from 'react';
import CharacterPicker from '../components/CharacterPicker';
import LocationPicker from '../components/LocationPicker';
import Logo from '../components/Logo';
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
        profileId = crypto.randomUUID();
        profileData = {
          id: profileId,
          username: cleanUsername,
          character: characterId,
          lat: coords.lat,
          lng: coords.lng,
          points: 0
        };
        const savedMockProfiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
        savedMockProfiles.push(profileData);
        localStorage.setItem('mock_profiles', JSON.stringify(savedMockProfiles));
      }

      localStorage.setItem('recyclerumble_user_id', profileId);
      localStorage.setItem('recyclerumble_user_profile', JSON.stringify(profileData));

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
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#0a130c' }}>
      {/* Background radial glow — brand green */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(17,124,72,0.08), transparent 60%)' }}
      />

      <div className="w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 my-8">
        {/* ── Title ── */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size="lg" showTagline />
          </div>
          <p className="text-xs sm:text-sm mt-1 max-w-md mx-auto leading-relaxed" style={{ color: '#695032' }}>
            Create your cleanup avatar, drop a pin on the map, and compete globally to keep your streets clean!
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Username Input */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-wide uppercase" style={{ color: '#d89d57' }}>
              Player Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. LitterBuster42"
              maxLength={20}
              className="rounded-xl px-4 py-3 text-sm text-white font-medium outline-none transition-all"
              style={{
                backgroundColor: 'rgba(10,19,12,0.7)',
                border: '1px solid rgba(17,124,72,0.35)'
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = '#117c48';
                e.currentTarget.style.boxShadow = '0 0 0 2px rgba(17,124,72,0.15)';
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = 'rgba(17,124,72,0.35)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>

          {/* Character Selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold tracking-wide uppercase" style={{ color: '#d89d57' }}>
              Select Character Avatar
            </label>
            <CharacterPicker selectedId={characterId} onSelect={setCharacterId} />
          </div>

          {/* Location Picker */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-baseline">
              <label className="text-xs font-bold tracking-wide uppercase" style={{ color: '#d89d57' }}>
                Drop Your Map Pin
              </label>
              {coords.lat && (
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                  style={{
                    color: '#bbffba',
                    backgroundColor: 'rgba(17,124,72,0.15)',
                    borderColor: 'rgba(17,124,72,0.4)'
                  }}
                >
                  📍 Pinned
                </span>
              )}
            </div>
            <LocationPicker onLocationSet={handleLocationSet} />
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl text-xs font-medium text-center" style={{
              backgroundColor: 'rgba(127,29,29,0.25)',
              border: '1px solid rgba(127,29,29,0.4)',
              color: '#fca5a5'
            }}>
              ⚠️ {errorMsg}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl font-bold tracking-wide text-sm transition-all duration-300 shadow-xl cursor-pointer"
            style={
              isSubmitting
                ? { backgroundColor: '#1a3024', color: '#695032', cursor: 'not-allowed' }
                : {
                    background: 'linear-gradient(135deg, #117c48, #bbffba)',
                    color: '#0a130c',
                    boxShadow: '0 8px 32px rgba(17,124,72,0.25)'
                  }
            }
            onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={e => { e.currentTarget.style.filter = 'none'; }}
          >
            {isSubmitting ? 'Setting up your profile…' : 'Join the Clean-Up 🌿'}
          </button>
        </form>
      </div>
    </div>
  );
}
