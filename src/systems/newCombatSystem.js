const DATA_STORED = {
  playerOneEnergy: 5,
  playerTwoEnergy: 6,
  playerOneCharactersOnBoard: [
    {
      characterId: 'char_001',
      position: {
        row: 2,
        col: 3,
      },
      health: 8,
      statusEffects: [
        {
          type: 'damageMultiplier',
          reason: 'vulnerable',
          value: 2,
          duration: 1
        },
        {
          type: 'stun',
          reason: 'paralyzed',
          duration: 1,
          exclusionTags: ['movement']
        }
      ]
    },
    {
      characterId: 'char_002',
      position: {
        row: 4,
        col: 5,
      },
      health: 7,
      statusEffects: []
    },
  ],
  playerTwoCharactersOnBoard: [
    {
      characterId: 'char_003',
      position: {
        row: 5,
        col: 6,
      },
      health: 9,
      statusEffects: []
    },
    {
      characterId: 'char_004',
      position: {
        row: 7,
        col: 8,
      },
      health: 6,
      statusEffects: []
    },
  ],
}


const DIRECTIONS = {
  0: 'up',
  1: 'up-right',
  2: 'right',
  3: 'down-right',
  4: 'down',
  5: 'down-left',
  6: 'left',
  7: 'up-left',
  10: 'anyTileChoice',
  11: 'randomTile',
};

const ACTION_EFFECTS = {
  damageMultiplier: { // e.g. vulnerable / protected
    reason: 'whatever',
    value: 0 - 2,
    duration: 0 - 5, // turns (not rounds so 2 turns is 1 round or 'turn cycle')
  },
  movement: {
    reason: 'whatever',
    direction: [0, 1, 2, 3, 4, 5, 6, 7], // use DIRECTIONS constants
    value: 0 - 3, // tiles
  },
  stun: { // prevent actions
    reason: 'whatever',
    duration: 0 - 3, // turns
    exclusionTags: ['movement'], // e.g. can still move
    inclusionTags: ['movement'], // e.g. only affects movement
  },
  damageOverTime: { // damage at start of player turn (once per 'turn cycle')
    reason: 'whatever',
    value: [1, 5], // damage per turn
    duration: 0 - 5, // turns
  },
  removal: { // a card is removed from play until return condition is met
    reason: 'whatever',
    exclusionTags: ['tower'], // e.g. cannot remove towers
    returnCondition: '', // e.g. 'number of turns', 'rolling a dice', etc.
  },
  damageShift: { // character shifts damage amount up or down
    reason: 'whatever',
    value: -5 - 5, // damage amount shifted
    duration: 0 - 5, // turns
  },
  controlled: { // control another character
    reason: 'whatever',
    duration: 0 - 3, // turns
  },
  energyShift: { // reduce/increase cost of actions
    reason: 'whatever',
    value: -3 - 3, // cost reduction
    duration: 0 - 5, // turns
    durationType: 'turns' | 'actions', // whether duration counts down per turn or per action taken
  },
}

const CONDITIONALS = {
  targetHealth: {
    value: 1 - 10, // health threshold
  },
  cardOnField: {
    cardId: 'whatever',
    friendly: true | false,
    adjacent: true | false,
  },
  cardInHand: {
    cardId: 'whatever',
  },
  effectsApplied: {
    effectType: 'whatever',
  },
  incomingDamage: {
    value: 1 - 10, // damage threshold
  },

}

const REACTION_TYPES = {
  dodge: {
    reason: 'whatever',
    effect: 'negateDamage',
  },
  block: {
    reason: 'whatever',
    effect: 'reduceDamage',
    value: 1 - 5, // damage reduction amount
  },
  damage: {
    reason: 'whatever',
    effect: 'dealDamage',
    value: 1 - 5, // damage amount
  },
}

const REACTION_TRIGGERS = {
  onAttacked: 'when this character is attacked',
  onAllyAttacked: 'when an ally is attacked',
  onAllyAttack: 'when an ally attacks',
  onBoardPlacement: 'when a character is placed on the board',
}


/* 

CombatFlow

1. Start of Turn
   - Apply start-of-turn effects (e.g., damage over time)
   - Refresh energy/resources
   - Draw cards (if applicable)

2a. Player Plays Cards
    - If energy card; resolves
    - If character card
      -Check if opponent has any cards with reactions,
        -If yes, check if they have reaction triggers on board placement
          -If yes, prompt opponent to use reaction
            -If reaction used, resolve reaction (e.g., dodge, block, damage)
            -If reaction is not used, continue
          If no, continue
        If no, continue
    - Place character on board

2b. Player Uses Abilities
    - Select character
      - Check if selected character has a stun status effect
        - If yes, disable relevant actions due to the stun effect
        - If no, continue
      - Choose ability to use
      - Choose target
        - Check if opponent has any cards with reactions,
          - If yes, check if they have reaction triggers on being attacked
            - If yes, prompt opponent to use reaction
              - If reaction used, resolve reaction (e.g., dodge, block, damage)
              - If reaction is not used, continue
            If no, continue
          If no, continue
      - Check if attacker or target has status effects that modify damage (e.g., vulnerable, protected)
      - Calculate final damage
      - Apply damage to target
      - Apply any additional effects (e.g., status effects)

3. End of Turn
   - Decrease duration of status effects
   - Check win/loss conditions
   - Pass turn to next player
      
*/
