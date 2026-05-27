import React from 'react';
import { Marker } from 'react-map-gl/mapbox';
import { CHARACTERS } from '../characters';


export default function CharacterMarker({ player, isCurrentUser, onClick }) {
  const character = CHARACTERS[player.character] || CHARACTERS.frog;
  
  // Calculate emoji font size: minimum 24px, growing by 0.5px per point, maxing out at 80px
  const size = Math.min(24 + (player.points || 0) / 2, 80);

  return (
    <Marker latitude={player.lat} longitude={player.lng} anchor="center">
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(player);
        }}
        style={{ 
          width: `${size + 12}px`, 
          height: `${size + 12}px` 
        }}
        className="flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-120 relative select-none group"
      >
        {/* Glowing aura based on character theme color */}
        <div 
          className="absolute inset-0 rounded-full blur-md opacity-30 transition-opacity duration-300 group-hover:opacity-60"
          style={{ backgroundColor: character.color }}
        />

        {/* Pulsing ring for current user */}
        {isCurrentUser && (
          <span className="absolute -inset-1 rounded-full border border-emerald-400/60 animate-ping opacity-60 pointer-events-none" />
        )}
        
        {/* The character emoji */}
        <span 
          style={{ fontSize: `${size}px` }}
          className="relative filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] transform active:scale-95 transition-transform"
        >
          {character.emoji}
        </span>

        {/* Floating mini-tooltip on hover */}
        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div className="bg-slate-950/90 backdrop-blur border border-slate-800 text-[10px] text-white px-2 py-0.5 rounded shadow-md whitespace-nowrap">
            <span className="font-semibold">{player.username}</span>
            <span className="text-emerald-400 ml-1.5">{player.points} pts</span>
          </div>
        </div>
      </div>
    </Marker>
  );
}
