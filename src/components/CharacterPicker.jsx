import React from 'react';
import { CHARACTER_LIST } from '../characters';

export default function CharacterPicker({ selectedId, onSelect }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {CHARACTER_LIST.map((char) => {
        const isSelected = selectedId === char.id;
        return (
          <button
            key={char.id}
            type="button"
            onClick={() => onSelect(char.id)}
            className="flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer"
            style={{
              borderColor: isSelected ? '#117c48' : 'rgba(17,124,72,0.2)',
              backgroundColor: isSelected ? 'rgba(17,124,72,0.15)' : 'rgba(10,19,12,0.5)',
              transform: isSelected ? 'scale(1.05)' : 'scale(1)',
              boxShadow: isSelected ? '0 0 18px rgba(17,124,72,0.25)' : 'none',
            }}
          >
            <img
              src={char.img}
              alt={char.name}
              className="w-12 h-12 object-contain mb-2"
            />
            <span className="text-xs font-medium text-center leading-tight" style={{ color: isSelected ? '#bbffba' : '#695032' }}>
              {char.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
