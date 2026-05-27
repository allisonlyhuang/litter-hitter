import React, { useState, useEffect } from 'react';
import SubmitPhoto from '../components/SubmitPhoto';
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
      // Local/mock storage retrieval
      const mockSubmissions = JSON.parse(localStorage.getItem(`submissions_${userProfile?.id}`) || '[]');
      setSubmissions(mockSubmissions);
      setLoading(false);
    }
  };

  const handleSubmissionSuccess = (itemName, pointsEarned) => {
    // 1. Update points locally in profile
    const updatedProfile = {
      ...userProfile,
      points: (userProfile.points || 0) + pointsEarned
    };
    
    // Save locally
    localStorage.setItem('recyclerumble_user_profile', JSON.stringify(updatedProfile));
    
    // If not using Supabase, mock-save the submission locally as well
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && !import.meta.env.VITE_SUPABASE_URL.includes('placeholder-url');
    if (!isSupabaseConfigured) {
      const mockSubList = JSON.parse(localStorage.getItem(`submissions_${userProfile.id}`) || '[]');
      const newSub = {
        id: crypto.randomUUID(),
        user_id: userProfile.id,
        image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=200', // standard generic recycling image placeholder
        item_name: itemName,
        verified: true,
        created_at: new Date().toISOString()
      };
      mockSubList.unshift(newSub);
      localStorage.setItem(`submissions_${userProfile.id}`, JSON.stringify(mockSubList));
      setSubmissions(mockSubList);

      // Also update this profile inside the global mock profile list for the map
      const globalMockProfiles = JSON.parse(localStorage.getItem('mock_profiles') || '[]');
      const updatedGlobalList = globalMockProfiles.map(p => p.id === userProfile.id ? updatedProfile : p);
      localStorage.setItem('mock_profiles', JSON.stringify(updatedGlobalList));
    } else {
      // Re-fetch submissions from Supabase to include the latest entry
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
    <div className="min-h-screen bg-[#0b0f19] flex flex-col pb-12">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-950/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-3xl">♻️</span>
            <div className="flex flex-col">
              <h1 className="text-xl font-extrabold tracking-tight font-display bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                RecycleRumble
              </h1>
              <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">Hackathon Edition</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onNavigate('map')}
              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs sm:text-sm font-semibold py-2 px-4 rounded-xl transition duration-200 cursor-pointer flex items-center gap-1.5"
            >
              🗺️ Global Map
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 p-2 rounded-xl transition cursor-pointer"
              title="Settings"
            >
              ⚙️
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-6xl mx-auto w-full px-4 flex-1 mt-6 grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        
        {/* Left Side: Stats + Settings Panel */}
        <div className="md:col-span-1 space-y-6">
          
          {/* Profile Stats Card */}
          <div className="glass-panel rounded-3xl border border-slate-800/80 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.1),transparent_70%)] pointer-events-none" />
            
            <div className="flex items-center gap-4">
              <div 
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-slate-800"
                style={{ backgroundColor: `${charInfo.color}15` }}
              >
                {charInfo.emoji}
              </div>
              <div className="flex flex-col">
                <h3 className="text-lg font-bold text-white tracking-tight">{userProfile?.username}</h3>
                <span className="text-xs text-slate-500 font-medium">{charInfo.name} character</span>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Score Total</span>
                <span className="text-3xl font-extrabold text-emerald-400 tracking-tight font-display mt-0.5">
                  {userProfile?.points || 0} <span className="text-sm font-semibold text-slate-450">pts</span>
                </span>
              </div>
              
              <div className="bg-emerald-500/10 text-emerald-400 text-xs px-2.5 py-1 rounded-full border border-emerald-500/20 font-bold tracking-wide">
                Level {Math.floor((userProfile?.points || 0) / 100) + 1}
              </div>
            </div>
          </div>

          {/* Simple Settings Modal/Panel when active */}
          {showSettings && (
            <div className="glass-panel rounded-3xl border border-rose-500/20 p-5 shadow-xl bg-slate-950/80 space-y-4">
              <h4 className="text-sm font-bold text-white">⚙️ Account Settings</h4>
              
              <div className="space-y-3">
                {/* Character Swap */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-slate-400 font-semibold">Change Character</span>
                  <div className="flex gap-2">
                    {Object.values(CHARACTERS).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => handleCharacterChange(c.id)}
                        className={`text-xl p-1.5 rounded-lg border transition ${
                          userProfile?.character === c.id 
                            ? 'border-emerald-500 bg-emerald-500/10' 
                            : 'border-slate-850 bg-slate-900/40'
                        }`}
                      >
                        {c.emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-850 pt-3 flex gap-2">
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

          {/* Submitting items guidelines */}
          <div className="glass-panel rounded-3xl border border-slate-800/80 p-5 text-xs text-slate-400 leading-relaxed space-y-2.5 bg-slate-950/20">
            <h4 className="text-white font-bold uppercase tracking-wider text-[10px]">🌿 Recycling Guide</h4>
            <p>Every recyclable item you upload awards you <strong className="text-emerald-400">10 points</strong>.</p>
            <ul className="list-disc pl-4 space-y-1 text-slate-500">
              <li>Cardboard packaging & paper</li>
              <li>Aluminum beverage cans</li>
              <li>Glass bottles and jars</li>
              <li>Clean plastic bottles & containers</li>
            </ul>
          </div>
        </div>

        {/* Right Side (2 cols): Submission Action + Recent Activity */}
        <div className="md:col-span-2 space-y-6">
          {/* Submit Photo Section */}
          <SubmitPhoto userProfile={userProfile} onSubmissionSuccess={handleSubmissionSuccess} />

          {/* Recent Submissions Feed */}
          <div className="glass-panel rounded-3xl border border-slate-800/80 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold font-display text-white">
                📦 Your Recent Submissions
              </h2>
              <span className="text-xs text-slate-500 font-semibold">{submissions.length} Total</span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-500">
                <svg className="animate-spin h-6 w-6 text-slate-700 mx-auto" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-850 rounded-2xl bg-slate-950/10">
                <span className="text-4xl">📸</span>
                <p className="text-sm text-slate-500 mt-2">You haven't logged any items yet.</p>
                <p className="text-xs text-slate-600 mt-1">Upload your first photo above to get started!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {submissions.map((sub) => (
                  <div 
                    key={sub.id} 
                    className="bg-slate-950/40 border border-slate-850 rounded-2xl p-3 flex items-center gap-3.5 hover:border-slate-800 transition duration-200"
                  >
                    <img 
                      src={sub.image_url} 
                      alt={sub.item_name} 
                      className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-800"
                      onError={(e) => {
                        // Fallback image if unsplash fails to load offline
                        e.target.src = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=200';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate capitalize leading-tight">
                        {sub.item_name || 'Recyclable Item'}
                      </h4>
                      <span className="text-[10px] text-emerald-400 font-semibold mt-0.5 inline-block">
                        ✓ Verified +10 pts
                      </span>
                      <p className="text-[9px] text-slate-500 mt-1">
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
