import React from 'react';
import { CHARACTERS } from '../characters';

export default function Leaderboard({ profiles = [], currentUserId, onPlayerClick }) {
  const sortedProfiles = [...profiles].sort((a, b) => (b.points || 0) - (a.points || 0));

  const getRankBadge = (index) => {
    switch (index) {
      case 0: return '🏆';
      case 1: return '🥈';
      case 2: return '🥉';
      default: return `#${index + 1}`;
    }
  };

  const getRankStyle = (index) => {
    switch (index) {
      case 0: return { color: '#d89d57', fontWeight: '700' };
      case 1: return { color: '#bbffba', fontWeight: '600' };
      case 2: return { color: '#695032', fontWeight: '600' };
      default: return { color: '#4b5563', fontSize: '0.75rem' };
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden shadow-2xl" style={{ borderColor: 'rgba(17,124,72,0.25)' }}>
      {/* Header */}
      <div
        className="p-5 border-b flex items-center justify-between"
        style={{ borderColor: 'rgba(17,124,72,0.2)', backgroundColor: 'rgba(10,19,12,0.5)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h2 className="text-base font-bold tracking-wide font-display text-white">Leaderboard</h2>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full border font-medium"
          style={{ backgroundColor: 'rgba(17,124,72,0.12)', color: '#bbffba', borderColor: 'rgba(17,124,72,0.35)' }}
        >
          Global
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
        {sortedProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-sm" style={{ color: '#695032' }}>
            <span>📭</span>
            <p className="mt-2">No players yet. Be the first!</p>
          </div>
        ) : (
          sortedProfiles.map((player, index) => {
            const isSelf = player.id === currentUserId;
            const char = CHARACTERS[player.character] || CHARACTERS.frog;

            return (
              <div
                key={player.id}
                onClick={() => onPlayerClick?.(player)}
                className="flex items-center justify-between p-3 rounded-xl transition duration-200 cursor-pointer border"
                style={{
                  backgroundColor: isSelf ? 'rgba(17,124,72,0.12)' : 'rgba(10,19,12,0.4)',
                  borderColor: isSelf ? 'rgba(17,124,72,0.4)' : 'rgba(17,124,72,0.1)',
                }}
                onMouseEnter={e => { if (!isSelf) e.currentTarget.style.borderColor = 'rgba(17,124,72,0.25)'; }}
                onMouseLeave={e => { if (!isSelf) e.currentTarget.style.borderColor = 'rgba(17,124,72,0.1)'; }}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className="w-8 text-center flex items-center justify-center" style={getRankStyle(index)}>
                    {getRankBadge(index)}
                  </div>

                  {/* Avatar image */}
                  <img src={char.img} alt={char.name} className="w-8 h-8 object-contain" />

                  {/* Username */}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium" style={{ color: isSelf ? '#bbffba' : '#e2e8f0', fontWeight: isSelf ? '600' : '400' }}>
                      {player.username}
                      {isSelf && (
                        <span className="text-[10px] ml-1.5 px-1 rounded font-normal" style={{ color: '#bbffba', backgroundColor: 'rgba(17,124,72,0.2)' }}>
                          You
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] tracking-wider" style={{ color: '#695032' }}>{char.name}</span>
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white tracking-tight">{player.points || 0}</span>
                  <span className="text-[10px] font-medium" style={{ color: '#695032' }}>pts</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
