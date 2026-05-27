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
            className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 cursor-pointer ${
              isSelected
                ? 'border-emerald-500 bg-emerald-500/10 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                : 'border-slate-800 bg-slate-900/50 hover:border-slate-700 hover:bg-slate-800/50'
            }`}
          >
            <span className="text-4xl mb-2 transition-transform duration-300 hover:scale-120">
              {char.emoji}
            </span>
            <span className="text-xs font-medium text-slate-300 tracking-wide">{char.name}</span>
          </button>
        );
      })}
    </div>
  );
}
