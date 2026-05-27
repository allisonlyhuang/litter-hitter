import React, { useState, useEffect } from 'react';
import SubmitPhoto from '../components/SubmitPhoto';
import Logo from '../components/Logo';
import { supabase } from '../lib/supabase';
import { CHARACTERS } from '../characters';

export default function Home({ userProfile, onProfileUpdate, onNavigate }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [newCharId, setNewCharId] = useState(userProfile?.character || 'frog');

  const charInfo = CHARACTERS[userProfile?.character] || CHARACTERS.frog;

  useEffect(() => {
    fetchSubmissions();
  }, [userProfile]);

  const fetchSubmissions = async () => {
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-url');

    if (isSupabaseConfigured && userProfile?.id) {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('*')
          .eq('user_id', userProfile.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSubmissions(data || []);
      } catch (err) {
        console.error("Error fetching submissions:", err);
      } finally {
        setLoading(false);
      }
    } else {
      const mockSubmissions = JSON.parse(localStorage.getItem(`submissions_${userProfile?.id}`) || '[]');
      setSubmissions(mockSubmissions);
      setLoading(false);
    }
  };

  const handleSubmissionSuccess = (itemName, pointsEarned) => {
    const updatedProfile = {
      ...userProfile,
      points: (userProfile.points || 0) + pointsEarned
    };

    localStorage.setItem('recyclerumble_user_profile', JSON.stringify(updatedProfile));

    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-url');
    if (!isSupabaseConfigured) {
      const mockSubList = JSON.parse(localStorage.getItem(`submissions_${userProfile.id}`) || '[]');
      const newSub = {
        id: crypto.randomUUID(),
        user_id: userProfile.id,
        image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=200',
        item_name: itemName,
        verified: true,
        created_at: new Date().toISOString()
      };
      mockSubList.unshift(newSub);
      localStorage.setItem(`submissions_${userProfile.id}`, JSON.stringify(mockSubList));
      setSubmissions(mockSubList);

      const globalMockProfiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
      const updatedGlobalList = globalMockProfiles.map(p => p.id === userProfile.id ? updatedProfile : p);
      localStorage.setItem('mock_profiles', JSON.stringify(updatedGlobalList));
    } else {
      fetchSubmissions();
    }

    onProfileUpdate(updatedProfile);
  };

  const handleCharacterChange = async (newId) => {
    setNewCharId(newId);
    const updatedProfile = {
      ...userProfile,
      character: newId
    };

    try {
      const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-url');
      if (isSupabaseConfigured) {
        await supabase
          .from('profiles')
          .update({ character: newId })
          .eq('id', userProfile.id);
      } else {
        const globalMockProfiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
        const updatedGlobalList = globalMockProfiles.map(p => p.id === userProfile.id ? updatedProfile : p);
        localStorage.setItem('mock_profiles', JSON.stringify(updatedGlobalList));
      }

      localStorage.setItem('recyclerumble_user_profile', JSON.stringify(updatedProfile));
      onProfileUpdate(updatedProfile);
      setShowSettings(false);
    } catch (err) {
      console.error("Error updating avatar:", err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('recyclerumble_user_id');
    localStorage.removeItem('recyclerumble_user_profile');
    onNavigate('setup');
  };

  return (
    <div className="min-h-screen flex flex-col pb-12" style={{ backgroundColor: '#0a130c' }}>
      {/* ── Top Navigation Bar ── */}
      <header
        className="border-b backdrop-blur sticky top-0 z-40"
        style={{ borderColor: 'rgba(17,124,72,0.3)', backgroundColor: 'rgba(10,19,12,0.75)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('map')}
              className="border text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl transition duration-200 cursor-pointer flex items-center gap-1.5"
              style={{
                backgroundColor: 'rgba(17,124,72,0.12)',
                borderColor: 'rgba(17,124,72,0.4)',
                color: '#bbffba'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(17,124,72,0.25)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(17,124,72,0.12)'}
            >
              🗺️ Global Map
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-xl transition cursor-pointer border"
              style={{
                backgroundColor: 'rgba(17,124,72,0.08)',
                borderColor: 'rgba(17,124,72,0.3)',
                color: '#d89d57'
              }}
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Grid Content ── */}
      <main className="max-w-6xl mx-auto w-full px-4 flex-1 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative">

        {/* ── Left Side: Stats + Settings ── */}
        <div className="md:col-span-1 space-y-6">

          {/* Profile Stats Card */}
          <div className="glass-panel rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div
              className="absolute top-0 right-0 w-28 h-28 pointer-events-none"
              style={{ background: 'radial-gradient(circle at center, rgba(187,255,186,0.08), transparent 70%)' }}
            />

            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner border overflow-hidden"
                style={{
                  backgroundColor: `${charInfo.color}15`,
                  borderColor: 'rgba(17,124,72,0.3)'
                }}
              >
                <img src={charInfo.img} alt={charInfo.name} className="w-12 h-12 object-contain" />
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-white tracking-tight">{userProfile?.username}</h3>
                <span className="text-xs font-medium" style={{ color: '#d89d57' }}>{charInfo.name} character</span>
              </div>
            </div>

            <div
              className="mt-6 pt-6 border-t flex items-center justify-between"
              style={{ borderColor: 'rgba(17,124,72,0.25)' }}
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#695032' }}>Score Total</span>
                <span className="text-3xl font-extrabold tracking-tight font-display mt-0.5" style={{ color: '#bbffba' }}>
                  {userProfile?.points || 0}{' '}
                  <span className="text-sm font-semibold" style={{ color: '#d89d57' }}>pts</span>
                </span>
              </div>

              <div
                className="text-xs px-2.5 py-1 rounded-full border font-bold tracking-wide"
                style={{
                  backgroundColor: 'rgba(17,124,72,0.15)',
                  borderColor: 'rgba(17,124,72,0.4)',
                  color: '#bbffba'
                }}
              >
                Level {Math.floor((userProfile?.points || 0) / 100) + 1}
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="glass-panel rounded-3xl p-5 shadow-xl space-y-4" style={{ borderColor: 'rgba(216,157,87,0.2)' }}>
              <h4 className="text-sm font-bold text-white">⚙️ Account Settings</h4>

              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-semibold" style={{ color: '#d89d57' }}>Change Character</span>
                  <div className="flex gap-2">
                    {Object.values(CHARACTERS).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleCharacterChange(c.id)}
                        className="p-1.5 rounded-lg border transition"
                        style={{
                          borderColor: userProfile?.character === c.id ? '#117c48' : 'rgba(105,80,50,0.3)',
                          backgroundColor: userProfile?.character === c.id ? 'rgba(17,124,72,0.15)' : 'rgba(105,80,50,0.08)'
                        }}
                      >
                        <img src={c.img} alt={c.name} className="w-7 h-7 object-contain" />
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t pt-3 flex gap-2" style={{ borderColor: 'rgba(105,80,50,0.2)' }}>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-950/30 hover:bg-red-900/30 text-red-400 border border-red-900/20 text-xs font-semibold py-2 px-3 rounded-lg transition cursor-pointer"
                  >
                    Logout / Reset Session
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Recycling Guide */}
          <div className="glass-panel rounded-3xl p-5 text-xs leading-relaxed space-y-2.5">
            <h4 className="font-bold uppercase tracking-wider text-[10px]" style={{ color: '#d89d57' }}>🌿 Litter Guide</h4>
            <p style={{ color: '#bbffba' }}>
              Every piece of litter you log earns you <strong>10 points</strong>.
            </p>
            <ul className="list-disc pl-4 space-y-1" style={{ color: '#695032' }}>
              <li>Cardboard packaging &amp; paper</li>
              <li>Aluminum beverage cans</li>
              <li>Glass bottles and jars</li>
              <li>Clean plastic bottles &amp; containers</li>
            </ul>
          </div>
        </div>

        {/* ── Right Side: Submission + Feed ── */}
        <div className="md:col-span-2 space-y-6">
          <SubmitPhoto userProfile={userProfile} onSubmissionSuccess={handleSubmissionSuccess} />

          {/* Recent Submissions Feed */}
          <div className="glass-panel rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-white">
                📦 Your Recent Submissions
              </h2>
              <span className="text-xs font-semibold" style={{ color: '#695032' }}>{submissions.length} Total</span>
            </div>

            {loading ? (
              <div className="py-12 text-center">
                <svg className="animate-spin h-6 w-6 mx-auto" style={{ color: '#117c48' }} fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : submissions.length === 0 ? (
              <div
                className="text-center py-12 border border-dashed rounded-2xl"
                style={{ borderColor: 'rgba(105,80,50,0.3)', backgroundColor: 'rgba(10,19,12,0.3)' }}
              >
                <span className="text-4xl">📸</span>
                <p className="text-sm mt-2" style={{ color: '#695032' }}>You haven't logged any litter yet.</p>
                <p className="text-xs mt-1" style={{ color: '#695032' }}>Upload your first photo above to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {submissions.map((sub) => (
                  <div
                    key={sub.id}
                    className="rounded-2xl p-3 flex items-center gap-3.5 transition duration-200 border"
                    style={{
                      backgroundColor: 'rgba(10,19,12,0.5)',
                      borderColor: 'rgba(17,124,72,0.2)'
                    }}
                  >
                    <img
                      src={sub.image_url || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=200'}
                      alt={sub.item_name}
                      className="w-14 h-14 rounded-xl object-cover border"
                      style={{ borderColor: 'rgba(17,124,72,0.3)', backgroundColor: '#0a130c' }}
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=200';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate capitalize leading-tight">
                        {sub.item_name || 'Litter Item'}
                      </h4>
                      <span className="text-[10px] font-semibold mt-0.5 inline-block" style={{ color: '#bbffba' }}>
                        ✓ Verified +10 pts
                      </span>
                      <p className="text-[9px] mt-1" style={{ color: '#695032' }}>
                        {new Date(sub.created_at).toLocaleDateString()} at {new Date(sub.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
