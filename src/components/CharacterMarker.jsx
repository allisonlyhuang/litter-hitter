import React from 'react';
import { Marker } from 'react-map-gl/mapbox';
import { CHARACTERS } from '../characters';

export default function CharacterMarker({ player, isCurrentUser, onClick }) {
  const character = CHARACTERS[player.character] || CHARACTERS.frog;

  // Size grows with points: min 32px, max 80px
  const size = Math.min(32 + (player.points || 0) / 2, 80);

  return (
    <Marker latitude={player.lat} longitude={player.lng} anchor="center">
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(player);
        }}
        style={{ width: `${size + 12}px`, height: `${size + 12}px` }}
        className="flex items-center justify-center cursor-pointer transition-all duration-300 transform hover:scale-125 relative select-none group"
      >
        {/* Glowing aura */}
        <div
          className="absolute inset-0 rounded-full blur-md opacity-30 transition-opacity duration-300 group-hover:opacity-60"
          style={{ backgroundColor: character.color }}
        />

        {/* Pulsing ring for current user */}
        {isCurrentUser && (
          <span
            className="absolute -inset-1 rounded-full border animate-ping opacity-60 pointer-events-none"
            style={{ borderColor: '#bbffba' }}
          />
        )}

        {/* Avatar image */}
        <img
          src={character.img}
          alt={character.name}
          style={{ width: `${size}px`, height: `${size}px` }}
          className="relative object-contain drop-shadow-lg"
        />

        {/* Hover tooltip */}
        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
          <div
            className="backdrop-blur text-[10px] text-white px-2 py-0.5 rounded shadow-md whitespace-nowrap border"
            style={{ backgroundColor: 'rgba(10,19,12,0.9)', borderColor: 'rgba(17,124,72,0.4)' }}
          >
            <span className="font-semibold">{player.username}</span>
            <span className="ml-1.5 font-bold" style={{ color: '#bbffba' }}>{player.points} pts</span>
          </div>
        </div>
      </div>
    </Marker>
  );
}
