import React, { useState, useEffect } from 'react';
import Setup from './pages/Setup';
import Home from './pages/Home';
import MapView from './pages/MapView';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('loading');
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Retrieve registered session from localStorage
    const savedUserId = localStorage.getItem('recyclerumble_user_id');
    const savedProfile = localStorage.getItem('recyclerumble_user_profile');

    if (savedUserId && savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setUserProfile(profile);
        setCurrentPage('home');
      } catch (err) {
        console.error("Error parsing user profile from localStorage:", err);
        setCurrentPage('setup');
      }
    } else {
      setCurrentPage('setup');
    }
  }, []);

  const handleProfileCreated = (profile) => {
    setUserProfile(profile);
    setCurrentPage('home');
  };

  const handleProfileUpdate = (updatedProfile) => {
    setUserProfile(updatedProfile);
  };

  if (currentPage === 'loading') {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex flex-col items-center justify-center text-slate-400">
        <svg className="animate-spin h-8 w-8 text-emerald-400 mb-3" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-widest animate-pulse">Entering Arena...</span>
      </div>
    );
  }

  if (currentPage === 'setup') {
    return <Setup onProfileCreated={handleProfileCreated} />;
  }

  if (currentPage === 'home') {
    return (
      <Home 
        userProfile={userProfile} 
        onProfileUpdate={handleProfileUpdate} 
        onNavigate={setCurrentPage} 
      />
    );
  }

  if (currentPage === 'map') {
    return (
      <MapView 
        userProfile={userProfile} 
        onProfileUpdate={handleProfileUpdate} 
        onNavigate={setCurrentPage} 
      />
    );
  }

  return null;
}

export default App;
