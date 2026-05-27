import { useState } from 'react';

const STEPS = [
  {
    id: 'welcome',
    emoji: '🌿',
    title: 'Welcome to Litter Hitter!',
    body: "You're a real-life street cleaner — but make it brainrot. Snap litter, let AI verify it, and earn points on a global leaderboard.",
    highlight: null,
    tip: null,
  },
  {
    id: 'camera',
    emoji: '📸',
    title: 'Snap Your Litter',
    body: 'The camera opens automatically. Point it at any piece of trash — plastic bottles, cans, wrappers, cardboard — then hit the big white button to snap a photo.',
    highlight: 'Camera',
    tip: 'No camera? Hit "Or upload from files instead" to pick a photo from your gallery.',
  },
  {
    id: 'ai',
    emoji: '🔍',
    title: 'AI Verifies It',
    body: 'After you snap, hit "Analyze & Log". Gemini AI inspects your photo to confirm it shows real litter. No trash, no points — keep it honest!',
    highlight: 'Analyze & Log button',
    tip: 'Make sure the item fills the frame — blurry or ambiguous shots may fail verification.',
  },
  {
    id: 'points',
    emoji: '⭐',
    title: 'Earn Points & Level Up',
    body: 'Every verified litter item earns you +10 points. Watch your Score Total rise on the left panel. Your level goes up every 100 points.',
    highlight: 'Score panel',
    tip: 'Click any past submission card to see a full detail view — including an Eco Tip for that item type!',
  },
  {
    id: 'map',
    emoji: '🗺️',
    title: 'Global Cleanup Map',
    body: 'Tap "Global Map" in the header to see every player\'s pin on the world map. Your character icon shows exactly where you clean up.',
    highlight: 'Global Map button',
    tip: 'Click any pin on the map to see that player\'s username and total score.',
  },
  {
    id: 'character',
    emoji: '🐸',
    title: 'Choose Your Character',
    body: 'Hit the ⚙️ gear icon in the top-right to open Settings. Pick from 8 legendary brainrot characters — Tung Tung Tung Sahur, Ballerina Cappuccina, and more.',
    highlight: 'Settings gear',
    tip: null,
  },
  {
    id: 'done',
    emoji: '🏆',
    title: "You're Ready!",
    body: "Go find some litter and clean up your streets. Every piece counts. The planet (and your score) will thank you.",
    highlight: null,
    tip: null,
  },
];

export default function Tutorial({ onClose }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'Enter') {
      if (isLast) onClose();
      else setStep(s => s + 1);
    }
    if (e.key === 'ArrowLeft' && !isFirst) setStep(s => s - 1);
    if (e.key === 'Escape') onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
        style={{
          backgroundColor: '#0a130c',
          border: '1px solid rgba(17,124,72,0.45)',
          backgroundImage: 'linear-gradient(160deg, rgba(17,124,72,0.07) 0%, rgba(10,19,12,0) 60%)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Step progress bar */}
        <div className="flex gap-1 px-6 pt-5">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStep(i)}
              className="flex-1 h-1 rounded-full transition-all duration-300 cursor-pointer"
              style={{
                backgroundColor: i <= step ? '#117c48' : 'rgba(17,124,72,0.2)',
              }}
            />
          ))}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center font-bold transition cursor-pointer border"
          style={{
            backgroundColor: 'rgba(10,19,12,0.8)',
            borderColor: 'rgba(105,80,50,0.3)',
            color: '#695032',
          }}
          title="Skip tutorial"
        >
          ✕
        </button>

        {/* Content */}
        <div className="px-6 pt-6 pb-4">
          {/* Emoji circle */}
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5 text-4xl shadow-inner"
            style={{
              backgroundColor: 'rgba(17,124,72,0.12)',
              border: '1px solid rgba(17,124,72,0.25)',
            }}
          >
            {current.emoji}
          </div>

          {/* Step counter */}
          <p className="text-center text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: '#695032' }}>
            Step {step + 1} of {STEPS.length}
          </p>

          {/* Title */}
          <h2 className="text-xl font-extrabold text-white text-center tracking-tight leading-snug mb-3">
            {current.title}
          </h2>

          {/* Body */}
          <p className="text-sm text-center leading-relaxed" style={{ color: '#9ecfa0' }}>
            {current.body}
          </p>

          {/* Tip box */}
          {current.tip && (
            <div
              className="mt-4 p-3 rounded-2xl text-[11px] leading-relaxed text-center"
              style={{
                backgroundColor: 'rgba(216,157,87,0.07)',
                border: '1px solid rgba(216,157,87,0.2)',
                color: '#d89d57',
              }}
            >
              💡 <strong>Pro tip:</strong> {current.tip}
            </div>
          )}

          {/* Highlight badge */}
          {current.highlight && (
            <div className="flex justify-center mt-3">
              <span
                className="text-[10px] font-bold px-3 py-1 rounded-full border uppercase tracking-wider"
                style={{
                  backgroundColor: 'rgba(187,255,186,0.07)',
                  borderColor: 'rgba(187,255,186,0.2)',
                  color: '#bbffba',
                }}
              >
                👆 Look for the {current.highlight}
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-6 pb-6 flex gap-3 mt-2">
          {!isFirst && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition cursor-pointer border"
              style={{
                backgroundColor: 'rgba(10,19,12,0.6)',
                borderColor: 'rgba(17,124,72,0.25)',
                color: '#695032',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(17,124,72,0.5)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(17,124,72,0.25)'}
            >
              ← Back
            </button>
          )}
          <button
            onClick={() => { if (isLast) onClose(); else setStep(s => s + 1); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold transition cursor-pointer shadow-lg"
            style={{
              background: isLast
                ? 'linear-gradient(135deg, #117c48, #bbffba)'
                : 'rgba(17,124,72,0.18)',
              border: '1px solid rgba(17,124,72,0.45)',
              color: isLast ? '#0a130c' : '#bbffba',
              boxShadow: isLast ? '0 4px 20px rgba(17,124,72,0.25)' : 'none',
            }}
            onMouseEnter={e => { if (!isLast) e.currentTarget.style.backgroundColor = 'rgba(17,124,72,0.28)'; }}
            onMouseLeave={e => { if (!isLast) e.currentTarget.style.backgroundColor = 'rgba(17,124,72,0.18)'; }}
          >
            {isLast ? "Let's Go! 🌿" : 'Next →'}
          </button>
        </div>

        {/* Skip link */}
        {!isLast && (
          <div className="pb-4 text-center">
            <button
              onClick={onClose}
              className="text-[10px] font-semibold underline underline-offset-4 transition cursor-pointer"
              style={{ color: '#695032', textDecorationColor: 'rgba(105,80,50,0.4)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#d89d57'}
              onMouseLeave={e => e.currentTarget.style.color = '#695032'}
            >
              Skip tutorial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
