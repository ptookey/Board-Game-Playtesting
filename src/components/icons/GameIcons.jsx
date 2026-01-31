import React from 'react';
import { SvgIcon } from '@mui/material';

// Energy/Lightning Icon
export function EnergyIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M7 2v11h3v9l7-12h-4l4-8z" fill="currentColor" />
    </SvgIcon>
  );
}

// Heart/HP Icon
export function HeartIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="currentColor" />
    </SvgIcon>
  );
}

// Tower/Castle Icon
export function TowerIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M21 10l-2-8H5L3 10l3 2v10h12V12l3-2zM9 2h2v3H9V2zm4 0h2v3h-2V2zM7.5 10.5L6 11V20h2v-4h8v4h2v-9l-1.5-.5L14 12h-4l-2.5-1.5z" fill="currentColor" />
    </SvgIcon>
  );
}

// Deck/Cards Stack Icon
export function DeckIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" fill="currentColor" />
    </SvgIcon>
  );
}

// Hand/Cards in Hand Icon
export function HandIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M21.66 4.95l-3.89-.97-.97 3.89 3.89.97.97-3.89zM17.7 3.55L13.05 2l-1.11 4.13 4.65 1.55 1.11-4.13zM11.28 6.2L6.53 5.5l-.58 4.19 4.75.7.58-4.19zM2 19h20v2H2v-2zm4-7v5h14v-5l-7-1-7 1z" fill="currentColor" />
    </SvgIcon>
  );
}

// Damage/Explosion Icon
export function DamageIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 2L8 12l-6 1 10 9-3-10 6-1-3-9zm0 4.5l1.5 4.5-3 .5 1.5 5-5-4.5 3-.5L12 6.5z" fill="currentColor" />
    </SvgIcon>
  );
}

// Special/Magic Icon (for abilities with no damage)
export function MagicIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M7.5 5.6L10 7 8.6 4.5 10 2 7.5 3.4 5 2l1.4 2.5L5 7zm12 9.8L17 14l1.4 2.5L17 19l2.5-1.4L22 19l-1.4-2.5L22 14zM22 2l-2.5 1.4L17 2l1.4 2.5L17 7l2.5-1.4L22 7l-1.4-2.5zM14.37 7.29L12 9.66 9.63 7.29 7.29 9.63 9.66 12l-2.37 2.37 2.34 2.34L12 14.34l2.37 2.37 2.34-2.34L14.34 12l2.37-2.37z" fill="currentColor" />
    </SvgIcon>
  );
}

// Sword/Battle Icon
export function BattleIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M6.92 5H5l2 2H2v2h5l-2 2h3.08L22 3 6.92 5zm10.16 14H20l-2-2h5v-2h-5l2-2h-3.08L3 21l14.08-2z" fill="currentColor" />
    </SvgIcon>
  );
}

// Game Controller Icon
export function GameIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 2c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5S18.67 9 19.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" fill="currentColor" />
    </SvgIcon>
  );
}

// Trophy/Victory Icon
export function TrophyIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" fill="currentColor" />
    </SvgIcon>
  );
}

// Warning Icon
export function WarningIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" fill="currentColor" />
    </SvgIcon>
  );
}

// Player 1 Icon (Circle with 1)
export function Player1Icon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">1</text>
    </SvgIcon>
  );
}

// Player 2 Icon (Circle with 2)
export function Player2Icon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="currentColor" />
      <text x="12" y="16" textAnchor="middle" fontSize="10" fontWeight="bold" fill="white">2</text>
    </SvgIcon>
  );
}

// Inline icon wrapper for text
export function InlineIcon({ children, size = 16, color, sx, ...props }) {
  // Clone the child icon with proper styling
  if (React.isValidElement(children)) {
    return React.cloneElement(children, {
      sx: { 
        fontSize: size, 
        verticalAlign: 'middle', 
        color: color,
        ...sx,
        ...children.props?.sx 
      },
      ...props
    });
  }
  return children;
}

// ============================================
// STATUS EFFECT ICONS
// ============================================

// Vulnerable Icon (target/crosshair - takes double damage)
export function VulnerableIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" />
      <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" />
      <line x1="2" y1="12" x2="6" y2="12" stroke="currentColor" strokeWidth="2" />
      <line x1="18" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="2" />
    </SvgIcon>
  );
}

// Poison/Burn Icon (damage over time)
export function PoisonIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 2C9 7 4 9 4 14c0 4.42 3.58 8 8 8s8-3.58 8-8c0-5-5-7-8-12zm0 18c-3.31 0-6-2.69-6-6 0-3.21 2.79-5.12 5-8.21 2.21 3.09 5 5 5 8.21 0 3.31-2.69 6-6 6z" fill="currentColor" />
      <circle cx="10" cy="14" r="1.5" fill="currentColor" />
      <circle cx="14" cy="16" r="1" fill="currentColor" />
    </SvgIcon>
  );
}

// Stunned/Paralyzed Icon (can't act)
export function StunnedIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 8l8 8M16 8l-8 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </SvgIcon>
  );
}

// Shield/Protected Icon (damage reduction)
export function ShieldIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" fill="currentColor" />
    </SvgIcon>
  );
}

// Buff/Power Up Icon (enhanced stats)
export function BuffIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" fill="currentColor" />
    </SvgIcon>
  );
}

// Debuff/Weakened Icon (reduced stats)
export function DebuffIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 22l7.5-18.29-.71-.71L12 6 5.21 3 4.5 3.71z" fill="currentColor" />
    </SvgIcon>
  );
}

// Trapped Icon (can't move or act)
export function TrappedIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <rect x="3" y="3" width="18" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M8 3v18M16 3v18M3 8h18M3 16h18" stroke="currentColor" strokeWidth="1" />
    </SvgIcon>
  );
}

// Marked Icon (targeted for extra damage)
export function MarkedIcon(props) {
  return (
    <SvgIcon {...props} viewBox="0 0 24 24">
      <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z" fill="currentColor" />
      <path d="M12 4l-6 6 1.41 1.41L12 6.83l4.59 4.58L18 10z" fill="currentColor" />
    </SvgIcon>
  );
}

// Status effect color mapping
export const STATUS_EFFECT_COLORS = {
  vulnerable: '#e74c3c',  // Red
  poison: '#27ae60',      // Green
  burn: '#e67e22',        // Orange
  stunned: '#9b59b6',     // Purple
  paralyzed: '#9b59b6',   // Purple
  shielded: '#3498db',    // Blue
  buffed: '#f1c40f',      // Yellow
  debuffed: '#7f8c8d',    // Gray
  trapped: '#8e44ad',     // Dark purple
  marked: '#c0392b',      // Dark red
};

// Get icon component for a status effect
export const getStatusEffectIcon = (effectType) => {
  switch (effectType) {
    case 'vulnerable': return VulnerableIcon;
    case 'poison':
    case 'burn': return PoisonIcon;
    case 'stunned':
    case 'paralyzed': return StunnedIcon;
    case 'shielded': return ShieldIcon;
    case 'buffed': return BuffIcon;
    case 'debuffed': return DebuffIcon;
    case 'trapped': return TrappedIcon;
    case 'marked': return MarkedIcon;
    default: return WarningIcon;
  }
};
