import React from 'react';
import { CHARACTERS } from '../characters';

export default function Leaderboard({ profiles = [], currentUserId, onPlayerClick }) {
  // Sort profiles by points descending
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
      case 0: return 'text-amber-400 font-bold';
      case 1: return 'text-slate-300 font-semibold';
      case 2: return 'text-amber-600 font-semibold';
      default: return 'text-slate-500 text-xs';
    }
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📊</span>
          <h2 className="text-base font-bold tracking-wide font-display text-white">Leaderboard</h2>
        </div>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-medium">
          Global
        </span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[400px]">
        {sortedProfiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center text-slate-500 text-sm">
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
                className={`flex items-center justify-between p-3 rounded-xl transition duration-200 cursor-pointer ${
                  isSelf
                    ? 'bg-emerald-500/10 border border-emerald-500/30 shadow-[inset_0_0_12px_rgba(16,185,129,0.05)]'
                    : 'bg-slate-900/40 border border-slate-800/40 hover:border-slate-700/60 hover:bg-slate-850/40'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <div className={`w-8 text-center flex items-center justify-center ${getRankStyle(index)}`}>
                    {getRankBadge(index)}
                  </div>
                  
                  {/* Character Emoji */}
                  <span className="text-2xl filter drop-shadow-sm">{char.emoji}</span>
                  
                  {/* Username */}
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${isSelf ? 'text-emerald-400 font-semibold' : 'text-slate-200'}`}>
                      {player.username}
                      {isSelf && <span className="text-[10px] ml-1.5 text-emerald-400 bg-emerald-400/10 px-1 py-0.2 rounded font-normal">You</span>}
                    </span>
                    <span className="text-[10px] text-slate-500 tracking-wider">
                      {char.name}
                    </span>
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-white tracking-tight">{player.points || 0}</span>
                  <span className="text-[10px] text-slate-500 font-medium">pts</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
