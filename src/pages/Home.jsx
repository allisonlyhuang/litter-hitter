import React, { useState, useEffect } from 'react';
import SubmitPhoto from '../components/SubmitPhoto';
import Logo from '../components/Logo';
import Tutorial from '../components/Tutorial';
import { supabase } from '../lib/supabase';
import { CHARACTERS } from '../characters';
const getEcoTip = (itemName = '') => {
  const name = itemName.toLowerCase();
  if (name.includes('plastic') || name.includes('bottle')) {
    return 'Plastic bottles take up to 450 years to decompose! Recycling one saves enough energy to power a light bulb for 3 hours.';
  }
  if (name.includes('paper') || name.includes('cardboard') || name.includes('box')) {
    return 'Recycling 1 ton of cardboard saves 46 gallons of oil, 9 cubic yards of landfill space, and 17 trees!';
  }
  if (name.includes('can') || name.includes('aluminum') || name.includes('metal')) {
    return 'Aluminum cans are 100% recyclable and can be recycled indefinitely! A recycled can is back on the shelf in as little as 60 days.';
  }
  if (name.includes('glass')) {
    return 'Glass is 100% recyclable and never loses its quality or purity. Recycling glass reduces air pollution by 20% compared to new glass.';
  }
  return 'Properly disposing of litter protects local wildlife, prevents microplastics from entering waterways, and keeps our green spaces beautiful!';
};

export default function Home({ userProfile, onProfileUpdate, onNavigate }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [newCharId, setNewCharId] = useState(userProfile?.character || 'frog');
  const [showAllSubmissions, setShowAllSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [showTutorial, setShowTutorial] = useState(
    () => !localStorage.getItem('recyclerumble_tutorial_seen')
  );

  const handleTutorialClose = () => {
    localStorage.setItem('recyclerumble_tutorial_seen', '1');
    setShowTutorial(false);
  };

  const charInfo = CHARACTERS[userProfile?.character] || CHARACTERS.frog;

  useEffect(() => {
    fetchSubmissions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile]);

  async function fetchSubmissions() {
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
              onClick={() => setShowTutorial(true)}
              className="p-2 rounded-xl transition cursor-pointer border font-bold text-sm"
              style={{
                backgroundColor: 'rgba(17,124,72,0.08)',
                borderColor: 'rgba(17,124,72,0.3)',
                color: '#bbffba'
              }}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(17,124,72,0.2)'}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(17,124,72,0.08)'}
              title="How to play"
            >
              ?
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
                {(showAllSubmissions ? submissions : submissions.slice(0, 8)).map((sub) => (
                  <div
                    key={sub.id}
                    onClick={() => setSelectedSubmission(sub)}
                    className="rounded-2xl p-3 flex items-center gap-3.5 transition duration-200 border cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                    style={{
                      backgroundColor: 'rgba(10,19,12,0.5)',
                      borderColor: 'rgba(17,124,72,0.2)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'rgba(187,255,186,0.35)';
                      e.currentTarget.style.backgroundColor = 'rgba(10,19,12,0.7)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(17,124,72,0.2)';
                      e.currentTarget.style.backgroundColor = 'rgba(10,19,12,0.5)';
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

            {submissions.length > 8 && (
              <div className="flex justify-center pt-2">
                <button
                  onClick={() => setShowAllSubmissions(!showAllSubmissions)}
                  className="text-[12px] font-bold px-5 py-2.5 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 flex items-center gap-1.5 shadow-md hover:brightness-110"
                  style={{
                    backgroundColor: 'rgba(216,157,87,0.08)',
                    borderColor: 'rgba(216,157,87,0.25)',
                    color: '#d89d57'
                  }}
                >
                  {showAllSubmissions ? (
                    <span>▲ Show Less</span>
                  ) : (
                    <span>
                      + See more ({Math.ceil((submissions.length - 8) / 2)} more row{Math.ceil((submissions.length - 8) / 2) > 1 ? 's' : ''})
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ── Tutorial Overlay ── */}
      {showTutorial && <Tutorial onClose={handleTutorialClose} />}

      {/* ── Submission Detail Popup Modal ── */}
      {selectedSubmission && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={() => setSelectedSubmission(null)}
        >
          <div 
            className="w-full max-w-sm glass-panel rounded-3xl overflow-hidden shadow-2xl border p-6 relative animate-scale-up"
            style={{ 
              borderColor: 'rgba(17,124,72,0.4)', 
              backgroundColor: 'rgba(10,19,12,0.95)',
              backgroundImage: 'linear-gradient(to bottom, rgba(17,124,72,0.05), rgba(10,19,12,0))'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedSubmission(null)}
              className="absolute top-4 right-4 bg-slate-900/80 hover:bg-red-500/20 hover:text-red-400 text-slate-400 border border-slate-800 rounded-full p-2 transition cursor-pointer shadow-md flex items-center justify-center w-8 h-8 font-bold"
              title="Close Details"
            >
              ✕
            </button>

            {/* Modal Title */}
            <h3 className="text-lg font-bold text-white tracking-tight mb-4 flex items-center gap-2">
              📦 Submission Details
            </h3>

            {/* Submission Image */}
            <div className="w-full h-48 rounded-2xl overflow-hidden border border-slate-800 relative bg-slate-950 mb-5">
              <img 
                src={selectedSubmission.image_url || 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=200'} 
                alt={selectedSubmission.item_name} 
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=200';
                }}
              />
              <div className="absolute top-3 left-3 bg-slate-950/85 backdrop-blur px-2.5 py-1 rounded-full flex items-center gap-1.5 border border-emerald-500/20">
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                <span className="w-2 h-2 bg-emerald-500 rounded-full absolute" />
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider font-mono ml-3">
                  {selectedSubmission.verified ? 'Verified Log' : 'Unverified Log'}
                </span>
              </div>
            </div>

            {/* Info Fields */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#695032' }}>Item Category / Name</span>
                <h4 className="text-xl font-extrabold text-white capitalize mt-0.5 tracking-tight">
                  {selectedSubmission.item_name || 'Litter Item'}
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-b py-4" style={{ borderColor: 'rgba(17,124,72,0.2)' }}>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#695032' }}>Points Awarded</span>
                  <span className="block text-lg font-extrabold mt-0.5" style={{ color: '#bbffba' }}>
                    +10 pts
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#695032' }}>Status</span>
                  <span className="block text-sm font-bold mt-1 text-emerald-400 flex items-center gap-1">
                    🟢 Completed
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#695032' }}>Logged At</span>
                <p className="text-xs text-slate-300 mt-0.5 font-medium">
                  {new Date(selectedSubmission.created_at).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-xs text-slate-450 font-mono mt-0.5">
                  {new Date(selectedSubmission.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>

              {selectedSubmission.id && (
                <div className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 text-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider font-mono" style={{ color: '#695032' }}>Submission Reference ID</span>
                  <code className="block text-[9px] text-slate-500 font-mono mt-0.5 select-all truncate">
                    {selectedSubmission.id}
                  </code>
                </div>
              )}

              {/* Dynamic Environmental Tip based on item type */}
              <div className="p-3.5 rounded-2xl border" style={{ backgroundColor: 'rgba(216,157,87,0.06)', borderColor: 'rgba(216,157,87,0.2)' }}>
                <h5 className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: '#d89d57' }}>💡 Eco Tip</h5>
                <p className="text-[11px] leading-relaxed text-slate-300 font-medium">
                  {getEcoTip(selectedSubmission.item_name)}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6">
              <button
                onClick={() => setSelectedSubmission(null)}
                className="w-full bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-300 font-bold py-2.5 px-4 rounded-xl transition duration-200 cursor-pointer text-sm text-center"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
