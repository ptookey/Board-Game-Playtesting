// Scott's Card Collection
// Extracted from card images in src/assets/ScottCards

export const SCOTT_CARDS = [
  {
    id: 'axel',
    name: 'Axel',
    cost: 5,
    hp: 4,
    class: 'Ascendance',
    image: 'Axel card layout.JPG',
    attacks: [
      { name: 'Desert Eagle', cost: 2, damage: 2 },
      { name: 'Brainwash', cost: 4, damage: 0, special: 'control', description: 'Take control of an enemy card for the duration of this turn, and use a single one of their abilities at no cost. Afterwards, you may use their other moves at their regular cost.' },
      { name: 'Kill Yourself', cost: 5, damage: 0, special: 'self-damage', description: 'Have the targeted enemy card use their highest damage move against themselves.' },
    ],
    attackDirections: ['up', 'down', 'left', 'right'], // Default 4 directions - update if card specifies otherwise
  },
  {
    id: 'manpounds',
    name: 'Manpounds',
    cost: 4,
    hp: 9,
    class: 'Chepperland',
    image: 'Manpounds card layout.JPG',
    attacks: [
      { name: 'Projectile Puke', cost: 2, damage: 1, range: 2, description: 'Deal 1 damage up to two tiles away, in the applicable directions.' },
      { name: "Manpounds' A Man That's Big, Manpounds Will Eat Your Kids!", cost: 4, damage: 0, special: 'execute', description: 'If any enemy card adjacent to Manpounds has 2 health or less, you may eat them, insta killing them.' },
      { name: 'Objects Are Either Eaten Or Defecated', cost: 5, damage: 0, special: 'consume', description: 'Eat targeted enemy card. If they have 7 health or less, they are insta killed. If they have more, they are returned to the board in 1 turn cycle with 2 damage dealt.' },
    ],
    attackDirections: ['up-right', 'down-left'], // Based on corner indicators on card
  },
  {
    id: 'filet-mignon',
    name: 'Filet Mignon',
    cost: 3,
    hp: 4,
    class: 'Chepperland',
    image: 'Filet Mignon card layout.JPG',
    attacks: [
      { name: 'Mousse Au Chocolat', cost: 3, damage: 1, description: 'Deal 1 damage.' },
      { name: 'Time Warp', cost: 4, damage: 0, special: 'displacement', description: 'Send targeted enemy card to a random empty tile on the board by having them roll a D20 that corresponds to a tile number.' },
      { name: 'Prisoner Of Another Dimension', cost: 4, damage: 0, special: 'trap', description: 'Trap a targeted enemy in another dimension. Each turn cycle, they must roll a die. If they roll a 1, 2, 3, or 4, they escape. Otherwise, they remain trapped, unable to use any moves.' },
    ],
    attackDirections: ['down-right'], // Based on corner indicator on card
  },
  {
    id: 'honey-man',
    name: 'Honey Man',
    cost: 3,
    hp: 6,
    class: 'Chepperland',
    image: 'Honey Man card layout.JPG',
    attacks: [
      { name: 'Double Honey Kick', cost: 1, damage: 2, description: 'Deal 2 damage.' },
      { name: 'Honey Slam', cost: 2, damage: 3, description: 'Deal 3 damage.' },
    ],
    attackDirections: ['up', 'down-left'], // Based on corner indicators on card
  },
  // Add more cards below as they are reviewed
];

// Helper to get a card by ID
export const getCardById = (id) => SCOTT_CARDS.find(card => card.id === id);

// Helper to get all cards of a specific class
export const getCardsByClass = (className) => SCOTT_CARDS.filter(card => card.class === className);

// Export count for reference
export const TOTAL_SCOTT_CARDS = SCOTT_CARDS.length;
