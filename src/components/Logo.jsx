import React from 'react';
import logoSrc from '../assets/logo.png';

/**
 * Litter Hitter brand logo — image only.
 * Source: src/assets/logo.png
 *
 * size prop: 'sm' | 'md' | 'lg'
 */
export default function Logo({ size = 'md' }) {
  const imgClass = {
    sm: 'h-32 w-32',
    md: 'h-44 w-44',
    lg: 'h-64 w-64',
  }[size] ?? 'h-44 w-44';

  return (
    <img
      src={logoSrc}
      alt="Litter Hitter logo"
      className={`${imgClass} object-contain`}
      draggable={false}
    />
  );
}
