/**
 * Game Configuration
 * All game rules and constants in one place for easy playtesting adjustments
 */

import { SCOTT_CARDS } from '../data/scottCards';

// =============================================================================
// BOARD SETTINGS
// =============================================================================

export const GRID_SIZE = 5;

// =============================================================================
// DECK & HAND SETTINGS
// =============================================================================

export const STARTING_HAND_SIZE = 5;
export const CHARACTER_CARDS_PER_DECK = 10;
export const ENERGY_CARDS_PER_DECK = 10;

// =============================================================================
// ENERGY SETTINGS
// =============================================================================

export const BASE_ENERGY_REGEN = 5; // Energy restored to at turn start (minimum)

// =============================================================================
// TOWER SETTINGS
// =============================================================================

export const TOWER_HP = 10;

// =============================================================================
// PLAYER CONFIGURATION
// =============================================================================

// Turn 1 (P1): 1 tower, no draw/play cards
// Turn 2 (P2): 2 towers, no draw/play cards
// Turn 3 (P1): 1 tower (final), CAN draw/play cards
// Turn 4 (P2): 0 towers, CAN draw/play cards
export const PLAYER_CONFIG = {
  1: { 
    towersPerTurn: [1, 1], // turn 1: 1 tower, turn 2: 1 tower (final)
    canPlayCardsFromTurn: 2, // Can play cards starting from their turn 2 (game turn 3)
    startingEnergy: 5,
  },
  2: { 
    towersPerTurn: [2], // turn 1: 2 towers
    canPlayCardsFromTurn: 2, // Can play cards starting from their turn 2 (game turn 4)
    startingEnergy: 6,
  },
};

// =============================================================================
// DIRECTION SETTINGS
// =============================================================================

export const DIRECTIONS = {
  UP: 'up',
  DOWN: 'down',
  LEFT: 'left',
  RIGHT: 'right',
  UP_LEFT: 'up-left',
  UP_RIGHT: 'up-right',
  DOWN_LEFT: 'down-left',
  DOWN_RIGHT: 'down-right',
};

export const DIRECTION_OFFSETS = {
  'up': { row: -1, col: 0 },
  'down': { row: 1, col: 0 },
  'left': { row: 0, col: -1 },
  'right': { row: 0, col: 1 },
  'up-left': { row: -1, col: -1 },
  'up-right': { row: -1, col: 1 },
  'down-left': { row: 1, col: -1 },
  'down-right': { row: 1, col: 1 },
};

export const DIRECTION_SYMBOLS = {
  [DIRECTIONS.UP]: '↑',
  [DIRECTIONS.DOWN]: '↓',
  [DIRECTIONS.LEFT]: '←',
  [DIRECTIONS.RIGHT]: '→',
  [DIRECTIONS.UP_LEFT]: '↖',
  [DIRECTIONS.UP_RIGHT]: '↗',
  [DIRECTIONS.DOWN_LEFT]: '↙',
  [DIRECTIONS.DOWN_RIGHT]: '↘',
};

// =============================================================================
// ATTACK TEMPLATES
// =============================================================================

export const ATTACK_TEMPLATES = {
  slash: { name: 'Slash', cost: 1, damage: 2 },
  stab: { name: 'Stab', cost: 1, damage: 3 },
  heavyStrike: { name: 'Heavy Strike', cost: 2, damage: 4 },
  quickJab: { name: 'Quick Jab', cost: 0, damage: 1 },
  fireball: { name: 'Fireball', cost: 3, damage: 5 },
  shield: { name: 'Shield Bash', cost: 1, damage: 1 },
  heal: { name: 'Heal', cost: 2, damage: 0 }, // Could heal instead
  sweep: { name: 'Sweep', cost: 2, damage: 2 }, // Hits multiple
};

// =============================================================================
// CHARACTER TEMPLATES
// =============================================================================

// Helper to create a character card data object from Scott cards
const createCharacterFromScottCard = (card) => ({
  id: card.id,
  type: 'Character',
  name: card.name,
  hp: card.hp,
  cost: card.cost,
  attacks: card.attacks,
  attackDirections: card.attackDirections,
  class: card.class,
  image: card.image,
});

// Use Scott's card collection as the character templates
export const CHARACTER_TEMPLATES = SCOTT_CARDS.map(createCharacterFromScottCard);

// =============================================================================
// ENERGY CARD SETTINGS
// =============================================================================

export const ENERGY_CARD_MIN_VALUE = 1;
export const ENERGY_CARD_MAX_VALUE = 3;
