import {
  CHARACTER_CARDS_PER_DECK,
  ENERGY_CARDS_PER_DECK,
  CHARACTER_TEMPLATES,
  ENERGY_CARD_MIN_VALUE,
  ENERGY_CARD_MAX_VALUE,
} from '../config/gameConfig';

/**
 * Generate a deck with character cards and energy cards
 * @returns {Array} Shuffled deck of cards
 */
export const generateDeck = () => {
  const deck = [];
  
  // Add 10 character cards from templates (with unique IDs per deck)
  for (let i = 0; i < CHARACTER_CARDS_PER_DECK; i++) {
    const template = CHARACTER_TEMPLATES[i % CHARACTER_TEMPLATES.length];
    deck.push({
      ...template,
      instanceId: `char-${i}-${Date.now()}`, // Unique ID for each card instance
      // Keep the original template id for card type identification
    });
  }
  
  // Add 10 energy cards
  for (let i = 0; i < ENERGY_CARDS_PER_DECK; i++) {
    const energyValue = Math.floor(Math.random() * (ENERGY_CARD_MAX_VALUE - ENERGY_CARD_MIN_VALUE + 1)) + ENERGY_CARD_MIN_VALUE;
    deck.push({
      id: `energy-${i}-${Date.now()}`,
      type: 'Energy',
      name: `Energy ${i + 1}`,
      value: energyValue,
    });
  }
  
  // Shuffle the deck
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  
  return deck;
};

/**
 * Draw cards from the top of a deck
 * @param {Array} deck - The deck to draw from
 * @param {number} count - Number of cards to draw
 * @returns {{ drawn: Array, remaining: Array }} The drawn cards and remaining deck
 */
export const drawCards = (deck, count) => {
  const drawn = deck.slice(0, count);
  const remaining = deck.slice(count);
  return { drawn, remaining };
};

/**
 * Shuffle an array using Fisher-Yates algorithm
 * @param {Array} array - Array to shuffle
 * @returns {Array} New shuffled array
 */
export const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};
