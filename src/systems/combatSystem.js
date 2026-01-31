/**
 * Combat System
 * Handles the complete flow of attacks and abilities including:
 * - Target validation
 * - Reaction checks and prompts
 * - Status effect application
 * - Damage calculation
 * - Conditional checking for special abilities
 */

import { GRID_SIZE, DIRECTION_OFFSETS } from '../config/gameConfig';
import { SPECIAL_TYPES, REACTION_TRIGGERS, CONDITIONAL_TYPES } from '../data/scottCards';

// ============================================
// STATUS EFFECT DEFINITIONS
// ============================================

export const STATUS_EFFECTS = {
  vulnerable: {
    id: 'vulnerable',
    name: 'Vulnerable',
    description: 'Takes double damage from all attacks',
    defaultDuration: 4, // 2 turn cycles = 4 individual turns
    damageMultiplier: 2,
  },
  shielded: {
    id: 'shielded',
    name: 'Shielded',
    description: 'Reduces incoming damage',
    defaultDuration: 2,
    damageReduction: 1,
  },
  poisoned: {
    id: 'poisoned',
    name: 'Poisoned',
    description: 'Takes damage at the start of each turn',
    defaultDuration: 3,
    dotDamage: 1,
  },
  burned: {
    id: 'burned',
    name: 'Burned',
    description: 'Takes escalating damage each turn',
    defaultDuration: 999, // Until death
    dotDamage: 1, // Increases each turn
  },
  stunned: {
    id: 'stunned',
    name: 'Stunned',
    description: 'Cannot use abilities this turn',
    defaultDuration: 2,
    preventsActions: true,
  },
  paralyzed: {
    id: 'paralyzed',
    name: 'Paralyzed',
    description: 'Cannot use any moves',
    defaultDuration: 2,
    preventsActions: true,
    preventsMovement: true,
  },
  marked: {
    id: 'marked',
    name: 'Marked',
    description: 'Takes extra damage from specific attacker',
    defaultDuration: 999, // Usually permanent
    bonusDamage: 3,
    markedBy: null, // Card ID that marked this target
  },
  trapped: {
    id: 'trapped',
    name: 'Trapped',
    description: 'Cannot act, must roll to escape',
    defaultDuration: 999,
    preventsActions: true,
    escapeChance: 0.2, // 1-4 on d20
  },
  'damage-buffed': {
    id: 'damage-buffed',
    name: 'Damage Buffed',
    description: 'Deals extra damage with attacks',
    defaultDuration: 2,
    bonusDamage: 1,
  },
  'damage-debuffed': {
    id: 'damage-debuffed',
    name: 'Damage Debuffed',
    description: 'Deals less damage with attacks',
    defaultDuration: 999,
    damageReduction: 1,
  },
  immobilized: {
    id: 'immobilized',
    name: 'Immobilized',
    description: 'Cannot move',
    defaultDuration: 2,
    preventsMovement: true,
  },
  controlled: {
    id: 'controlled',
    name: 'Controlled',
    description: 'Under enemy control',
    defaultDuration: 2,
    controlledBy: null, // Player ID that controls this card
  },
};

// ============================================
// REACTION DEFINITIONS
// ============================================

export const REACTION_TYPES = {
  dodge: {
    id: 'dodge',
    name: 'Dodge',
    description: 'Completely avoid an incoming attack',
    effect: 'negate',
  },
  block: {
    id: 'block',
    name: 'Block',
    description: 'Reduce or prevent damage from an attack',
    effect: 'reduce',
    maxDamageBlocked: 3,
  },
  counter: {
    id: 'counter',
    name: 'Counter',
    description: 'Negate attack and deal damage back',
    effect: 'counter',
    counterDamage: 1,
  },
  counterKill: {
    id: 'counter-kill',
    name: 'Counter Kill',
    description: 'Instantly kill the attacker',
    effect: 'instakill',
  },
  intercept: {
    id: 'intercept',
    name: 'Intercept',
    description: 'Another ally takes the hit instead',
    effect: 'redirect',
  },
  bribe: {
    id: 'bribe',
    name: 'Bribe',
    description: 'Prevent a killing blow',
    effect: 'prevent-death',
  },
  'cancel-attack': {
    id: 'cancel-attack',
    name: 'Cancel Attack',
    description: 'Negate an incoming attack',
    effect: 'negate',
  },
};

// ============================================
// CONDITIONAL CHECKING FUNCTIONS
// ============================================

/**
 * Check if a specific card is on the board
 */
export function isCardOnField(board, cardId) {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = board[row][col];
      if (cell && cell.id === cardId) {
        return { found: true, row, col, card: cell };
      }
    }
  }
  return { found: false };
}

/**
 * Check if any of the specified cards are on the board
 */
export function areAnyCardsOnField(board, cardIds) {
  for (const cardId of cardIds) {
    const result = isCardOnField(board, cardId);
    if (result.found) return { found: true, cardId, ...result };
  }
  return { found: false };
}

/**
 * Check if all of the specified cards are on the board
 */
export function areAllCardsOnField(board, cardIds) {
  const foundCards = [];
  for (const cardId of cardIds) {
    const result = isCardOnField(board, cardId);
    if (!result.found) return { found: false, missing: cardId };
    foundCards.push({ cardId, ...result });
  }
  return { found: true, cards: foundCards };
}

/**
 * Check if a specific card is in a player's hand
 */
export function isCardInHand(hand, cardId) {
  return hand.some(card => card.id === cardId);
}

/**
 * Check if any of the specified cards are in a player's hand
 */
export function areAnyCardsInHand(hand, cardIds) {
  for (const cardId of cardIds) {
    if (isCardInHand(hand, cardId)) {
      return { found: true, cardId };
    }
  }
  return { found: false };
}

/**
 * Check if a card is adjacent to the attacker
 */
export function isCardAdjacent(board, attackerRow, attackerCol, cardId) {
  for (const direction of Object.keys(DIRECTION_OFFSETS)) {
    const offset = DIRECTION_OFFSETS[direction];
    const checkRow = attackerRow + offset.row;
    const checkCol = attackerCol + offset.col;
    
    if (checkRow >= 0 && checkRow < GRID_SIZE && checkCol >= 0 && checkCol < GRID_SIZE) {
      const cell = board[checkRow][checkCol];
      if (cell && cell.id === cardId) {
        return { found: true, row: checkRow, col: checkCol, direction, card: cell };
      }
    }
  }
  return { found: false };
}

/**
 * Check if any of the specified cards are adjacent
 */
export function areAnyCardsAdjacent(board, attackerRow, attackerCol, cardIds) {
  for (const cardId of cardIds) {
    const result = isCardAdjacent(board, attackerRow, attackerCol, cardId);
    if (result.found) return { found: true, cardId, ...result };
  }
  return { found: false };
}

/**
 * Check a single conditional
 */
export function checkConditional(conditional, context) {
  const { 
    board, 
    attacker, 
    target, 
    playerHand, 
    opponentHand,
    incomingDamage,
    gameState
  } = context;
  
  switch (conditional.type) {
    case 'cardOnField': {
      if (conditional.cardIds) {
        if (conditional.requireAll) {
          return areAllCardsOnField(board, conditional.cardIds).found;
        }
        return areAnyCardsOnField(board, conditional.cardIds).found;
      }
      return isCardOnField(board, conditional.cardId).found;
    }
    
    case 'targetHealthBelow': {
      if (!target) return false;
      return target.character.hp <= conditional.value;
    }
    
    case 'targetHealthAbove': {
      if (!target) return false;
      return target.character.hp > conditional.value;
    }
    
    case 'attackDamageBelow': {
      if (incomingDamage === undefined) return true; // Allow if not checking damage
      return incomingDamage <= conditional.value;
    }
    
    case 'attackDamageAbove': {
      if (incomingDamage === undefined) return true;
      return incomingDamage > conditional.value;
    }
    
    case 'cardInHand': {
      if (!playerHand) return false;
      if (conditional.cardIds) {
        return areAnyCardsInHand(playerHand, conditional.cardIds).found;
      }
      return isCardInHand(playerHand, conditional.cardId);
    }
    
    case 'cardAdjacent': {
      if (!attacker) return false;
      if (conditional.cardIds) {
        return areAnyCardsAdjacent(board, attacker.row, attacker.col, conditional.cardIds).found;
      }
      return isCardAdjacent(board, attacker.row, attacker.col, conditional.cardId).found;
    }
    
    case 'oncePerGame': {
      if (!gameState || !gameState.usedOncePerGame) return true;
      const key = `${attacker?.character?.id}-${conditional.abilityId || 'default'}`;
      return !gameState.usedOncePerGame.includes(key);
    }
    
    case 'oncePerTarget': {
      if (!gameState || !gameState.usedOncePerTarget || !target) return true;
      const key = `${attacker?.character?.id}-${target?.character?.id}`;
      return !gameState.usedOncePerTarget.includes(key);
    }
    
    case 'allyDealtDamage': {
      // Check if a specific ally dealt damage this turn
      if (!gameState || !gameState.damageDealtThisTurn) return false;
      return gameState.damageDealtThisTurn.some(d => d.attackerId === conditional.cardId);
    }
    
    case 'targetTileEmpty': {
      // Check if a specific relative tile is empty
      if (!attacker) return false;
      const targetOffset = DIRECTION_OFFSETS[conditional.direction || 'up'];
      if (!targetOffset) return false;
      const checkRow = attacker.row + targetOffset.row;
      const checkCol = attacker.col + targetOffset.col;
      if (checkRow < 0 || checkRow >= GRID_SIZE || checkCol < 0 || checkCol >= GRID_SIZE) {
        return false;
      }
      return board[checkRow][checkCol] === null;
    }
    
    case 'triggerCondition': {
      // Custom trigger conditions need to be checked by the game logic
      // This is a placeholder that returns true - actual check happens elsewhere
      return true;
    }
    
    case 'minimumCharactersOnBoard': {
      // Check if there are minimum number of friendly and enemy characters on board
      if (!board || !attacker) return false;
      const attackerPlayer = attacker.character.player;
      let friendlyCount = 0;
      let enemyCount = 0;
      
      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const cell = board[row][col];
          if (cell && cell.type === 'character') {
            if (cell.player === attackerPlayer) {
              friendlyCount++;
            } else {
              enemyCount++;
            }
          }
        }
      }
      
      const requiredFriendly = conditional.friendly || 0;
      const requiredEnemy = conditional.enemy || 0;
      return friendlyCount >= requiredFriendly && enemyCount >= requiredEnemy;
    }
    
    default:
      console.warn(`Unknown conditional type: ${conditional.type}`);
      return true; // Allow by default for unknown types
  }
}

/**
 * Check all conditionals for an attack
 * Returns { canUse: boolean, failedConditions: [], passedConditions: [] }
 * 
 * Note: Conditionals with an 'effect' property are treated as mutually exclusive
 * branches - only ONE needs to pass. Other conditionals (like oncePerGame) must all pass.
 */
export function checkAllConditionals(attack, context) {
  if (!attack.conditionals || attack.conditionals.length === 0) {
    return { canUse: true, failedConditions: [], passedConditions: [] };
  }
  
  const failedConditions = [];
  const passedConditions = [];
  
  // Separate conditionals into effect-based (branches) and required (must all pass)
  const effectConditionals = attack.conditionals.filter(c => c.effect);
  const requiredConditionals = attack.conditionals.filter(c => !c.effect);
  
  // Check required conditionals - all must pass
  for (const conditional of requiredConditionals) {
    const passed = checkConditional(conditional, context);
    if (passed) {
      passedConditions.push(conditional);
    } else {
      failedConditions.push(conditional);
    }
  }
  
  // If there are effect-based conditionals, at least ONE must pass
  if (effectConditionals.length > 0) {
    let anyEffectPassed = false;
    for (const conditional of effectConditionals) {
      const passed = checkConditional(conditional, context);
      if (passed) {
        passedConditions.push(conditional);
        anyEffectPassed = true;
      } else {
        // Don't add effect conditionals to failed list - they're alternatives
      }
    }
    // If no effect conditional passed, add them all to failed (for error message)
    if (!anyEffectPassed) {
      failedConditions.push(...effectConditionals);
    }
  }
  
  return {
    canUse: failedConditions.length === 0,
    failedConditions,
    passedConditions,
  };
}

/**
 * Get a human-readable message for why a conditional failed
 */
export function getConditionalFailureMessage(conditional) {
  switch (conditional.type) {
    case 'cardOnField':
      if (conditional.cardIds) {
        if (conditional.requireAll) {
          return `Requires all of these cards on the field: ${conditional.cardIds.join(', ')}`;
        }
        return `Requires one of these cards on the field: ${conditional.cardIds.join(', ')}`;
      }
      return `Requires ${conditional.cardId} to be on the field`;
    
    case 'targetHealthBelow':
      return `Target must have ${conditional.value} HP or less`;
    
    case 'targetHealthAbove':
      return `Target must have more than ${conditional.value} HP`;
    
    case 'attackDamageBelow':
      return `Incoming attack must deal ${conditional.value} damage or less`;
    
    case 'attackDamageAbove':
      return `Incoming attack must deal more than ${conditional.value} damage`;
    
    case 'cardInHand':
      if (conditional.cardIds) {
        return `Requires one of these cards in hand: ${conditional.cardIds.join(', ')}`;
      }
      return `Requires ${conditional.cardId} in hand`;
    
    case 'cardAdjacent':
      if (conditional.cardIds) {
        return `Requires one of these cards to be adjacent: ${conditional.cardIds.join(', ')}`;
      }
      return `Requires ${conditional.cardId} to be adjacent`;
    
    case 'oncePerGame':
      return 'This ability can only be used once per game';
    
    case 'oncePerTarget':
      return 'This ability can only be used once per target';
    
    case 'allyDealtDamage':
      return `Requires ${conditional.cardId} to have dealt damage this turn`;
    
    case 'targetTileEmpty':
      return 'Target tile must be empty';
    
    case 'minimumCharactersOnBoard':
      return `Requires at least ${conditional.friendly || 0} friendly and ${conditional.enemy || 0} enemy character(s) on the board`;
    
    default:
      return `Condition not met: ${conditional.type}`;
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Check if an attack has a specific special type
 */
export function hasSpecialType(attack, specialType) {
  if (!attack.specialTypes) return false;
  return attack.specialTypes.includes(specialType);
}

/**
 * Check if an attack has any of the specified special types
 */
export function hasAnySpecialType(attack, specialTypes) {
  if (!attack.specialTypes) return false;
  return specialTypes.some(type => attack.specialTypes.includes(type));
}

/**
 * Check if a character has a reaction ability that can be used for a specific trigger
 */
export function getAvailableReactions(character, trigger = 'target-of-attack', context = {}) {
  if (!character || !character.attacks) return [];
  
  const reactionAbilities = character.attacks.filter(attack => {
    // Check new reaction format first
    if (attack.reaction) {
      // Must match the trigger
      if (attack.reaction.trigger !== trigger) return false;
      
      // Check direction restrictions if applicable
      if (attack.reaction.directions && context.attackDirection) {
        if (!attack.reaction.directions.includes(context.attackDirection)) return false;
      }
      
      // Check conditionals if any
      if (attack.conditionals && context.board) {
        const conditionalCheck = checkAllConditionals(attack, {
          board: context.board,
          attacker: context.attacker,
          target: { row: context.targetRow, col: context.targetCol, character },
          incomingDamage: context.incomingDamage,
          gameState: context.gameState,
        });
        if (!conditionalCheck.canUse) return false;
      }
      
      return true;
    }
    
    // Legacy support: check specialTypes for reaction abilities
    // Only 'cancel-attack' is a true reaction type in specialTypes
    if (attack.specialTypes) {
      const isReaction = hasAnySpecialType(attack, [
        'cancel-attack',
      ]);
      
      // Also check if it's a reaction-style ability
      if (isReaction && trigger === 'target-of-attack') {
        return true;
      }
    }
    
    // Legacy support: check old special field
    const special = attack.special?.toLowerCase();
    return (
      special === 'dodge' ||
      special === 'block' ||
      special === 'counter' ||
      special === 'counter-kill' ||
      special === 'intercept' ||
      special === 'bribe'
    );
  });
  
  return reactionAbilities.map((attack, index) => ({
    ...attack,
    attackIndex: character.attacks.indexOf(attack),
  }));
}

/**
 * Get all reaction triggers for a character
 */
export function getCharacterReactionTriggers(character) {
  if (!character) return [];
  
  // Check if character has top-level reactions defined
  if (character.reactions && character.reactions.length > 0) {
    // Merge with attack info to get the 'automatic' flag
    return character.reactions.map(reaction => {
      const attack = character.attacks?.find(a => a.name === reaction.abilityName);
      return {
        ...reaction,
        automatic: attack?.reaction?.automatic || false,
        conditionals: reaction.conditionals || attack?.conditionals,
      };
    });
  }
  
  // Otherwise, extract from attacks
  const triggers = [];
  if (character.attacks) {
    character.attacks.forEach((attack, index) => {
      if (attack.reaction) {
        triggers.push({
          trigger: attack.reaction.trigger,
          abilityName: attack.name,
          attackIndex: index,
          directions: attack.reaction.directions,
          automatic: attack.reaction.automatic,
          conditionals: attack.conditionals,
          protectedCardId: attack.reaction.protectedCardId,
        });
      }
    });
  }
  
  return triggers;
}

/**
 * Check if a reaction has already been used this turn
 */
export function isReactionUsed(character, attackIndex) {
  return character.usedAttacks?.includes(attackIndex) || false;
}

/**
 * Check if player has enough energy for a reaction
 */
export function canAffordReaction(playerEnergy, reactionCost) {
  return playerEnergy >= reactionCost;
}

/**
 * Calculate target position from attacker position and direction
 */
export function getTargetPosition(attackerRow, attackerCol, direction) {
  const offset = DIRECTION_OFFSETS[direction];
  if (!offset) return null;
  
  const targetRow = attackerRow + offset.row;
  const targetCol = attackerCol + offset.col;
  
  // Check bounds
  if (targetRow < 0 || targetRow >= GRID_SIZE || targetCol < 0 || targetCol >= GRID_SIZE) {
    return null;
  }
  
  return { row: targetRow, col: targetCol };
}

/**
 * Get target at a specific position
 */
export function getTargetAtPosition(board, row, col) {
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) {
    return null;
  }
  return board[row][col];
}

/**
 * Get all empty tiles on the board
 * Returns array of { row, col, tileNumber } for each empty tile
 */
export function getEmptyTiles(board) {
  const emptyTiles = [];
  let tileNumber = 1;
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col] === null) {
        emptyTiles.push({ row, col, tileNumber });
        tileNumber++;
      }
    }
  }
  
  return emptyTiles;
}

/**
 * Get all occupied tiles on the board
 * Returns array of { row, col, character } for each occupied tile
 */
export function getOccupiedTiles(board) {
  const occupiedTiles = [];
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (board[row][col] !== null) {
        occupiedTiles.push({ row, col, character: board[row][col] });
      }
    }
  }
  
  return occupiedTiles;
}

/**
 * Get all tiles at a specific range from a position
 */
export function getTilesAtRange(board, centerRow, centerCol, range) {
  const tiles = [];
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol);
      if (distance === range) {
        tiles.push({ 
          row, 
          col, 
          isEmpty: board[row][col] === null,
          character: board[row][col] 
        });
      }
    }
  }
  
  return tiles;
}

// ============================================
// STATUS EFFECT FUNCTIONS
// ============================================

/**
 * Add a status effect to a target
 */
export function addStatusEffect(board, row, col, effectType, turnsRemaining, extraData = {}) {
  const newBoard = board.map(r => [...r]);
  const target = newBoard[row][col];
  
  if (!target) return { board: newBoard, success: false };
  
  const existingEffects = target.statusEffects || [];
  
  // Check if effect already exists - refresh duration if so
  const existingIndex = existingEffects.findIndex(e => e.type === effectType);
  if (existingIndex >= 0) {
    existingEffects[existingIndex] = {
      ...existingEffects[existingIndex],
      turnsRemaining: Math.max(existingEffects[existingIndex].turnsRemaining, turnsRemaining),
      ...extraData,
    };
  } else {
    existingEffects.push({
      type: effectType,
      turnsRemaining,
      appliedTurn: extraData.appliedTurn || 0,
      ...extraData,
    });
  }
  
  newBoard[row][col] = {
    ...target,
    statusEffects: existingEffects,
  };
  
  return { board: newBoard, success: true };
}

/**
 * Remove a specific status effect from a target
 */
export function removeStatusEffect(board, row, col, effectType) {
  const newBoard = board.map(r => [...r]);
  const target = newBoard[row][col];
  
  if (!target || !target.statusEffects) return newBoard;
  
  newBoard[row][col] = {
    ...target,
    statusEffects: target.statusEffects.filter(e => e.type !== effectType),
  };
  
  return newBoard;
}

/**
 * Process status effect expiration for all cards on the board
 * Called at the START of each player's turn
 */
export function tickStatusEffects(board) {
  const newBoard = board.map(r => [...r]);
  const expiredEffects = [];
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = newBoard[row][col];
      if (cell && cell.statusEffects && cell.statusEffects.length > 0) {
        // Decrease turns remaining and filter out expired effects
        const updatedEffects = [];
        cell.statusEffects.forEach(effect => {
          const newTurns = effect.turnsRemaining - 1;
          if (newTurns > 0) {
            updatedEffects.push({
              ...effect,
              turnsRemaining: newTurns,
            });
          } else {
            expiredEffects.push({
              row,
              col,
              cardName: cell.name,
              effectType: effect.type,
            });
          }
        });
        
        newBoard[row][col] = {
          ...cell,
          statusEffects: updatedEffects.length > 0 ? updatedEffects : undefined,
        };
      }
    }
  }
  
  return { board: newBoard, expiredEffects };
}

/**
 * Check if a character has a specific status effect
 */
export function hasStatusEffect(character, effectType) {
  return character?.statusEffects?.some(e => e.type === effectType) || false;
}

/**
 * Get a specific status effect from a character
 */
export function getStatusEffect(character, effectType) {
  return character?.statusEffects?.find(e => e.type === effectType) || null;
}

// ============================================
// DAMAGE CALCULATION
// ============================================

/**
 * Calculate actual damage considering all status effects
 */
export function calculateDamage(baseDamage, target, attacker = null) {
  let finalDamage = baseDamage;
  const modifiers = [];
  
  // Apply attacker's damage buffs
  if (attacker?.statusEffects) {
    const damageBuff = attacker.statusEffects.find(e => e.type === 'damage-buffed');
    if (damageBuff) {
      const bonus = damageBuff.bonusDamage || STATUS_EFFECTS['damage-buffed'].bonusDamage;
      finalDamage += bonus;
      modifiers.push({ type: 'damage-buffed', bonusDamage: bonus });
    }
    
    const damageDebuff = attacker.statusEffects.find(e => e.type === 'damage-debuffed');
    if (damageDebuff) {
      const reduction = damageDebuff.damageReduction || STATUS_EFFECTS['damage-debuffed'].damageReduction;
      finalDamage = Math.max(0, finalDamage - reduction);
      modifiers.push({ type: 'damage-debuffed', reduction });
    }
  }
  
  if (target.statusEffects) {
    // Vulnerability - double damage
    const vulnerable = target.statusEffects.find(e => e.type === 'vulnerable');
    if (vulnerable) {
      const multiplier = vulnerable.multiplier || STATUS_EFFECTS.vulnerable.damageMultiplier;
      finalDamage *= multiplier;
      modifiers.push({ type: 'vulnerable', multiplier });
    }
    
    // Shielded - reduce damage
    const shielded = target.statusEffects.find(e => e.type === 'shielded');
    if (shielded) {
      const reduction = shielded.reduction || STATUS_EFFECTS.shielded.damageReduction;
      finalDamage = Math.max(0, finalDamage - reduction);
      modifiers.push({ type: 'shielded', reduction });
    }
    
    // Marked - extra damage from specific attacker
    const marked = target.statusEffects.find(e => e.type === 'marked');
    if (marked && attacker && marked.markedBy === attacker.id) {
      const bonus = marked.bonusDamage || STATUS_EFFECTS.marked.bonusDamage;
      finalDamage += bonus;
      modifiers.push({ type: 'marked', bonusDamage: bonus });
    }
  }
  
  return { 
    finalDamage: Math.floor(finalDamage), 
    baseDamage, 
    modifiers,
    wasModified: modifiers.length > 0,
  };
}

/**
 * Generate a human-readable damage message
 */
export function formatDamageMessage(damageResult) {
  const { finalDamage, baseDamage, modifiers, wasModified } = damageResult;
  
  if (!wasModified) {
    return `${finalDamage}`;
  }
  
  const modifierStrings = modifiers.map(mod => {
    switch (mod.type) {
      case 'vulnerable':
        return `x${mod.multiplier} VULNERABLE`;
      case 'shielded':
        return `-${mod.reduction} SHIELDED`;
      case 'marked':
        return `+${mod.bonusDamage} MARKED`;
      case 'damage-buffed':
        return `+${mod.bonusDamage} BUFFED`;
      case 'damage-debuffed':
        return `-${mod.reduction} DEBUFFED`;
      default:
        return mod.type.toUpperCase();
    }
  });
  
  return `${finalDamage} (${modifierStrings.join(', ')})`;
}

// ============================================
// ABILITY FLOW SYSTEM
// ============================================

/**
 * Ability flow state machine states
 */
export const ABILITY_FLOW_STATES = {
  IDLE: 'idle',
  SELECTING_ABILITY: 'selecting_ability',
  SELECTING_TARGET: 'selecting_target',
  AWAITING_REACTION: 'awaiting_reaction',
  SELECTING_REACTION_DISPLACEMENT: 'selecting_reaction_displacement',
  EXECUTING: 'executing',
  COMPLETE: 'complete',
  CANCELLED: 'cancelled',
};

/**
 * Create initial ability flow state
 */
export function createAbilityFlowState() {
  return {
    state: ABILITY_FLOW_STATES.IDLE,
    attacker: null,          // { row, col, character }
    attack: null,            // The selected attack/ability
    attackIndex: null,       // Index of the attack in the character's attacks array
    target: null,            // { row, col, character }
    direction: null,         // Direction of attack
    availableReactions: [],  // Reactions the target can use
    pendingReaction: null,   // The reaction being considered
    reactionDecision: null,  // 'use' | 'decline' | null
    pendingDisplacement: null, // { cardToDisplace, validTargets } for displacement selection
    result: null,            // Result of the ability execution
  };
}

/**
 * Initiate the ability flow
 * Step 1: Select attacker and ability
 * @param {number} controlledBy - If set, this character is being controlled by another player (brainwash)
 */
export function initiateAbilityFlow(board, attackerRow, attackerCol, attack, attackIndex, controlledBy = null) {
  const attacker = board[attackerRow][attackerCol];
  
  if (!attacker) {
    return {
      success: false,
      error: 'No character at attacker position',
      flowState: createAbilityFlowState(),
    };
  }
  
  // Check if ability has already been used
  if (attacker.usedAttacks?.includes(attackIndex)) {
    return {
      success: false,
      error: `${attack.name} has already been used this turn`,
      flowState: createAbilityFlowState(),
    };
  }
  
  return {
    success: true,
    flowState: {
      state: ABILITY_FLOW_STATES.SELECTING_TARGET,
      attacker: { row: attackerRow, col: attackerCol, character: attacker },
      attack,
      attackIndex,
      attackerRow,
      attackerCol,
      controlledBy, // Track who is controlling this character (for brainwash)
      target: null,
      direction: null,
      availableReactions: [],
      pendingReaction: null,
      reactionDecision: null,
      result: null,
    },
  };
}

/**
 * Select target for the ability
 * Step 2: Choose direction/target
 */
export function selectTarget(flowState, board, direction, targetPlayerEnergy, context = {}) {
  if (flowState.state !== ABILITY_FLOW_STATES.SELECTING_TARGET) {
    return {
      success: false,
      error: 'Invalid flow state for selecting target',
      flowState,
    };
  }
  
  const { attacker, attack } = flowState;
  
  // Handle board-wide targeting
  if (attack.range === 'board' || attack.targetType === 'any-tile-with-enemy' || attack.targetType === 'any-empty-tile') {
    // For board-wide attacks, direction might be a position object { row, col }
    const targetPos = typeof direction === 'object' ? direction : getTargetPosition(attacker.row, attacker.col, direction);
    
    if (!targetPos) {
      return {
        success: false,
        error: 'Invalid target position',
        flowState,
      };
    }
    
    const target = getTargetAtPosition(board, targetPos.row, targetPos.col);
    
    // Validate based on target type
    if (attack.targetType === 'any-empty-tile' && target !== null) {
      return {
        success: false,
        error: 'Target tile must be empty',
        flowState,
      };
    }
    
    if (attack.targetType === 'any-tile-with-enemy' && (!target || target.player === attacker.character.player)) {
      return {
        success: false,
        error: 'Target must be an enemy',
        flowState,
      };
    }
    
    return processTargetSelection(flowState, board, targetPos, target, direction, targetPlayerEnergy, context);
  }
  
  // Handle no-target abilities (e.g., deck reveal, self-buffs that don't need selection)
  if (attack.targetType === 'none') {
    return processTargetSelection(
      flowState, 
      board, 
      { row: attacker.row, col: attacker.col }, 
      null, // No target
      null, 
      targetPlayerEnergy,
      context
    );
  }
  
  // Handle all-attack-directions (attacks all of character's attack directions simultaneously)
  if (attack.targetType === 'all-attack-directions') {
    // Get all targets in the character's attack directions
    const attackDirections = attacker.character.attackDirections || [];
    const targets = [];
    
    for (const dir of attackDirections) {
      const offset = DIRECTION_OFFSETS[dir];
      if (!offset) continue;
      
      // Check each tile in range for this direction
      const range = attack.range || 1;
      for (let i = 1; i <= range; i++) {
        const targetRow = attacker.row + (offset.row * i);
        const targetCol = attacker.col + (offset.col * i);
        
        // Check bounds
        if (targetRow < 0 || targetRow >= GRID_SIZE || targetCol < 0 || targetCol >= GRID_SIZE) {
          break; // Out of bounds, stop checking this direction
        }
        
        const cell = board[targetRow][targetCol];
        if (cell) {
          // Found a character, add to targets if enemy
          if (cell.player !== attacker.character.player) {
            targets.push({
              row: targetRow,
              col: targetCol,
              character: cell,
              direction: dir,
            });
          }
          break; // Stop at first character in this direction
        }
      }
    }
    
    // Store targets for multi-target processing
    return processTargetSelection(
      flowState, 
      board, 
      { row: attacker.row, col: attacker.col }, 
      null, // Individual targets handled via multiTargets
      null, 
      targetPlayerEnergy,
      { ...context, multiTargets: targets, isMultiTarget: true }
    );
  }
  
  // Handle horizontal direction selection (for horizontal movement abilities)
  if (attack.targetType === 'horizontal-direction') {
    // Direction should be 'left' or 'right'
    if (direction !== 'left' && direction !== 'right') {
      return {
        success: false,
        error: 'Please select left or right direction',
        flowState,
      };
    }
    const offset = direction === 'left' ? { row: 0, col: -1 } : { row: 0, col: 1 };
    const moveDistance = attack.moveDistance || 1;
    const targetRow = attacker.row;
    const targetCol = attacker.col + (offset.col * moveDistance);
    
    // Check bounds
    if (targetCol < 0 || targetCol >= board[0].length) {
      return {
        success: false,
        error: 'Cannot move out of bounds',
        flowState,
      };
    }
    
    // Check if target tile is empty
    if (board[targetRow][targetCol] !== null) {
      return {
        success: false,
        error: 'Target tile is not empty',
        flowState,
      };
    }
    
    return processTargetSelection(
      flowState, 
      board, 
      { row: targetRow, col: targetCol }, 
      null, // Movement to empty tile
      direction, 
      targetPlayerEnergy,
      context
    );
  }
  
  // Handle self-targeting
  if (attack.targetType === 'self') {
    return processTargetSelection(
      flowState, 
      board, 
      { row: attacker.row, col: attacker.col }, 
      attacker.character, 
      null, 
      targetPlayerEnergy,
      context
    );
  }
  
  // Handle adjacent targeting or direction-based targeting
  const targetPos = getTargetPosition(attacker.row, attacker.col, direction);
  
  if (!targetPos) {
    return {
      success: false,
      error: 'Invalid target direction',
      flowState,
    };
  }
  
  // Handle range attacks
  if (attack.range && typeof attack.range === 'number' && attack.range > 1) {
    // For ranged attacks, find target within range in that direction
    const rangeResult = findTargetInRange(board, attacker.row, attacker.col, direction, attack.range);
    if (rangeResult.target) {
      return processTargetSelection(flowState, board, rangeResult.position, rangeResult.target, direction, targetPlayerEnergy, context);
    }
    return {
      success: false,
      error: `No target within ${attack.range} tiles in that direction`,
      flowState,
    };
  }
  
  const target = getTargetAtPosition(board, targetPos.row, targetPos.col);
  
  if (!target && !attack.targetType?.includes('tile')) {
    return {
      success: false,
      error: 'No target in that direction',
      flowState,
    };
  }
  
  return processTargetSelection(flowState, board, targetPos, target, direction, targetPlayerEnergy, context);
}

/**
 * Find a target within a specified range in a direction
 */
function findTargetInRange(board, startRow, startCol, direction, maxRange) {
  const offset = DIRECTION_OFFSETS[direction];
  if (!offset) return { target: null, position: null };
  
  for (let distance = 1; distance <= maxRange; distance++) {
    const checkRow = startRow + (offset.row * distance);
    const checkCol = startCol + (offset.col * distance);
    
    if (checkRow < 0 || checkRow >= GRID_SIZE || checkCol < 0 || checkCol >= GRID_SIZE) {
      break; // Out of bounds
    }
    
    const target = board[checkRow][checkCol];
    if (target) {
      return { target, position: { row: checkRow, col: checkCol }, distance };
    }
  }
  
  return { target: null, position: null };
}

/**
 * Process the target selection and determine reactions
 */
function processTargetSelection(flowState, board, targetPos, target, direction, targetPlayerEnergy, context = {}) {
  const { attacker, attack, controlledBy } = flowState;
  
  // For targeting purposes, use the controlling player if brainwashed
  // Otherwise use the character's original player
  const effectiveAttackerPlayer = controlledBy || attacker.character.player;
  
  // Check if target is friendly (from the perspective of who is controlling)
  const isFriendlyTarget = target && target.player === effectiveAttackerPlayer;
  
  // Determine if this is a friendly-targeting ability
  const isFriendlyAbility = 
    hasSpecialType(attack, 'heal') || 
    hasSpecialType(attack, 'damage-buff') ||
    attack.targetType === 'self' ||
    attack.targetType === 'self-or-adjacent-ally' ||
    attack.targetType === 'adjacent-to-ally';
  
  if (target && isFriendlyTarget && !isFriendlyAbility) {
    return {
      success: false,
      error: "You can't target your own units with this ability",
      flowState,
    };
  }
  
  if (target && !isFriendlyTarget && isFriendlyAbility && attack.targetType !== 'self') {
    return {
      success: false,
      error: "You can only target friendly units with this ability",
      flowState,
    };
  }
  
  // Check attack conditionals
  if (attack.conditionals && attack.conditionals.length > 0) {
    const conditionalContext = {
      board,
      attacker,
      target: target ? { row: targetPos.row, col: targetPos.col, character: target } : null,
      playerHand: context.playerHand,
      opponentHand: context.opponentHand,
      gameState: context.gameState,
    };
    
    const conditionalCheck = checkAllConditionals(attack, conditionalContext);
    if (!conditionalCheck.canUse) {
      const failureMessage = conditionalCheck.failedConditions
        .map(c => getConditionalFailureMessage(c))
        .join('; ');
      return {
        success: false,
        error: `Cannot use ability: ${failureMessage}`,
        flowState,
        failedConditions: conditionalCheck.failedConditions,
      };
    }
  }
  
  // Get available reactions from the target (if enemy)
  // Control abilities (brainwash, kill yourself, etc.) don't trigger reactions
  // because they're not direct attacks - they're mind control effects
  // Abilities with ignore-reaction special type bypass all reactions
  const isControlAbility = attack.specialTypes?.includes('control');
  const ignoresReactions = attack.specialTypes?.includes('ignore-reaction');
  
  let availableReactions = [];
  let allyProtectionReactions = [];
  
  if (target && !isFriendlyTarget && !isControlAbility && !ignoresReactions) {
    const reactionContext = {
      board,
      attacker,
      targetRow: targetPos.row,
      targetCol: targetPos.col,
      attackDirection: direction,
      incomingDamage: attack.damage,
      gameState: context.gameState,
    };
    
    // Get target's own reactions
    availableReactions = getAvailableReactions(target, 'target-of-attack', reactionContext).filter(reaction => {
      // Filter out already used reactions
      if (isReactionUsed(target, reaction.attackIndex)) return false;
      // Filter out reactions the target can't afford
      if (!canAffordReaction(targetPlayerEnergy, reaction.cost)) return false;
      return true;
    });
    
    // Get ally protection reactions (e.g., Luther's "Get Over Here")
    const allyReactions = checkAllyProtectionReactions(
      board, 
      targetPos.row, 
      targetPos.col, 
      target, 
      attack.damage, 
      attacker
    );
    
    // Format ally protection reactions to match the standard reaction format
    for (const allyReaction of allyReactions) {
      const ability = allyReaction.protectingCard.attacks?.find(a => a.name === allyReaction.reaction.abilityName);
      if (ability) {
        const abilityIndex = allyReaction.protectingCard.attacks.findIndex(a => a.name === allyReaction.reaction.abilityName);
        // Check if already used
        if (allyReaction.protectingCard.usedAttacks?.includes(abilityIndex)) continue;
        // Check if can afford
        if (!canAffordReaction(targetPlayerEnergy, ability.cost)) continue;
        
        allyProtectionReactions.push({
          ...ability,
          attackIndex: abilityIndex,
          isAllyProtection: true,
          protectingCard: allyReaction.protectingCard,
          protectingPosition: allyReaction.protectingPosition,
          direction: allyReaction.direction,
        });
      }
    }
  }
  
  // Combine target reactions and ally protection reactions
  const allReactions = [...availableReactions, ...allyProtectionReactions];
  
  // Determine next state based on available reactions
  const hasReactions = allReactions.length > 0 && !isFriendlyTarget;
  
  return {
    success: true,
    flowState: {
      ...flowState,
      state: hasReactions ? ABILITY_FLOW_STATES.AWAITING_REACTION : ABILITY_FLOW_STATES.EXECUTING,
      target: target ? { row: targetPos.row, col: targetPos.col, character: target } : { row: targetPos.row, col: targetPos.col, character: null },
      direction,
      availableReactions: allReactions,
      // Store multi-target info for all-attack-directions type abilities
      multiTargets: context.multiTargets,
      isMultiTarget: context.isMultiTarget,
    },
    hasReaction: hasReactions,
    reactions: allReactions,
  };
}

/**
 * Handle reaction decision from defending player
 * Step 3: React or decline
 */
export function handleReactionDecision(flowState, decision, selectedReaction = null, board = null) {
  if (flowState.state !== ABILITY_FLOW_STATES.AWAITING_REACTION) {
    return {
      success: false,
      error: 'Not awaiting reaction decision',
      flowState,
    };
  }
  
  if (decision === 'use' && !selectedReaction) {
    return {
      success: false,
      error: 'Must select a reaction to use',
      flowState,
    };
  }
  
  // Check if this is an ally protection reaction with displacement that requires target selection
  if (decision === 'use' && selectedReaction?.isAllyProtection && 
      selectedReaction?.specialTypes?.includes('displacement') && board) {
    // Find valid displacement targets (empty tiles adjacent to the attacker)
    const validTargets = getValidDisplacementTargets(board, flowState.attacker);
    
    if (validTargets.length > 0) {
      return {
        success: true,
        flowState: {
          ...flowState,
          state: ABILITY_FLOW_STATES.SELECTING_REACTION_DISPLACEMENT,
          reactionDecision: decision,
          pendingReaction: selectedReaction,
          pendingDisplacement: {
            cardToDisplace: flowState.attacker,
            validTargets,
          },
        },
      };
    }
    // If no valid targets, proceed to execution (it will handle the "no tile available" case)
  }
  
  return {
    success: true,
    flowState: {
      ...flowState,
      state: ABILITY_FLOW_STATES.EXECUTING,
      reactionDecision: decision,
      pendingReaction: decision === 'use' ? selectedReaction : null,
    },
  };
}

/**
 * Get valid displacement targets (empty tiles adjacent to a card)
 */
export function getValidDisplacementTargets(board, cardPosition) {
  const targets = [];
  for (const direction of Object.keys(DIRECTION_OFFSETS)) {
    const offset = DIRECTION_OFFSETS[direction];
    const adjRow = cardPosition.row + offset.row;
    const adjCol = cardPosition.col + offset.col;
    
    if (adjRow >= 0 && adjRow < GRID_SIZE && adjCol >= 0 && adjCol < GRID_SIZE) {
      if (board[adjRow][adjCol] === null) {
        targets.push({ row: adjRow, col: adjCol, direction });
      }
    }
  }
  return targets;
}

/**
 * Step 3b: Select displacement target (for ally protection reactions with displacement)
 */
export function processDisplacementSelection(flowState, selectedTarget) {
  if (flowState.state !== ABILITY_FLOW_STATES.SELECTING_REACTION_DISPLACEMENT) {
    return {
      success: false,
      error: 'Not selecting displacement target',
      flowState,
    };
  }
  
  // Validate the selected target is in the valid targets list
  const isValid = flowState.pendingDisplacement?.validTargets?.some(
    t => t.row === selectedTarget.row && t.col === selectedTarget.col
  );
  
  if (!isValid) {
    return {
      success: false,
      error: 'Invalid displacement target',
      flowState,
    };
  }
  
  return {
    success: true,
    flowState: {
      ...flowState,
      state: ABILITY_FLOW_STATES.EXECUTING,
      selectedDisplacementTarget: selectedTarget,
    },
  };
}

/**
 * Execute the ability with all modifiers
 * Step 4: Apply effects and damage
 */
export function executeAbility(flowState, board, attackerEnergy, targetEnergy, context = {}) {
  if (flowState.state !== ABILITY_FLOW_STATES.EXECUTING) {
    return {
      success: false,
      error: 'Invalid flow state for execution',
      flowState,
      board,
    };
  }
  
  const { attacker, attack, attackIndex, target, pendingReaction, reactionDecision } = flowState;
  let newBoard = board.map(r => [...r]);
  let newAttackerEnergy = attackerEnergy - attack.cost;
  let newTargetEnergy = targetEnergy;
  const messages = [];
  let abilityNegated = false;
  let counterDamage = 0;
  let gameStateUpdates = {};
  
  // Process reaction if one was used
  if (reactionDecision === 'use' && pendingReaction) {
    newTargetEnergy -= pendingReaction.cost;
    
    // Check if this is an ally protection reaction (like Luther's "Get Over Here")
    if (pendingReaction.isAllyProtection) {
      // Mark reaction as used on the protecting card
      const protectingPos = pendingReaction.protectingPosition;
      const protectingCell = newBoard[protectingPos.row][protectingPos.col];
      if (protectingCell) {
        newBoard[protectingPos.row][protectingPos.col] = {
          ...protectingCell,
          usedAttacks: [...(protectingCell.usedAttacks || []), pendingReaction.attackIndex],
        };
      }
      
      // Handle displacement of attacker to adjacent tile
      if (pendingReaction.specialTypes?.includes('displacement')) {
        // Use the player-selected displacement target if available, otherwise fallback to auto-pick
        let displacedTo = flowState.selectedDisplacementTarget || null;
        
        if (!displacedTo) {
          // Fallback: Find an empty adjacent tile to the attacker
          for (const dir of Object.keys(DIRECTION_OFFSETS)) {
            const offset = DIRECTION_OFFSETS[dir];
            const adjRow = attacker.row + offset.row;
            const adjCol = attacker.col + offset.col;
            
            if (adjRow >= 0 && adjRow < GRID_SIZE && adjCol >= 0 && adjCol < GRID_SIZE) {
              if (newBoard[adjRow][adjCol] === null) {
                displacedTo = { row: adjRow, col: adjCol };
                break;
              }
            }
          }
        }
        
        if (displacedTo) {
          // Move attacker to the selected tile
          const attackerCell = newBoard[attacker.row][attacker.col];
          // Mark the attack as used on the attacker BEFORE moving them
          const updatedAttackerCell = {
            ...attackerCell,
            usedAttacks: [...(attackerCell.usedAttacks || []), attackIndex],
          };
          newBoard[attacker.row][attacker.col] = null;
          newBoard[displacedTo.row][displacedTo.col] = updatedAttackerCell;
          messages.push(`${pendingReaction.protectingCard.name} used ${pendingReaction.name} - ${attacker.character.name} was DISPLACED!`);
          
          // Update attacker position for later processing
          gameStateUpdates.attackerDisplaced = {
            from: { row: attacker.row, col: attacker.col },
            to: displacedTo
          };
          // Mark that the attack has already been marked as used
          gameStateUpdates.attackAlreadyMarkedUsed = true;
        } else {
          messages.push(`${pendingReaction.protectingCard.name} used ${pendingReaction.name} but couldn't find a tile to displace the attacker!`);
        }
      }
      
      // Handle cancel-attack effect
      if (pendingReaction.specialTypes?.includes('cancel-attack')) {
        abilityNegated = true;
        if (!pendingReaction.specialTypes?.includes('displacement')) {
          messages.push(`${pendingReaction.protectingCard.name} used ${pendingReaction.name} to protect ${target.character.name}!`);
        }
      }
    } else {
      // Standard target reaction handling
      // Mark reaction as used on target
      const targetCell = newBoard[target.row][target.col];
      newBoard[target.row][target.col] = {
        ...targetCell,
        usedAttacks: [...(targetCell.usedAttacks || []), pendingReaction.attackIndex],
      };
      
      // Determine reaction type from new or legacy format
      const reactionType = getReactionType(pendingReaction);
      
      switch (reactionType) {
        case 'cancel-attack':
        case 'dodge':
          abilityNegated = true;
          // Check if this cancel-attack also deals damage (e.g., "I Am the God of the New World")
          if (pendingReaction.damage > 0) {
            counterDamage = pendingReaction.damage;
            messages.push(`${target.character.name} DODGED the attack using ${pendingReaction.name} and dealt ${counterDamage} damage in return!`);
          } else {
            messages.push(`${target.character.name} DODGED the attack using ${pendingReaction.name}!`);
          }
          break;
          
        case 'block':
          // Block will be handled in damage calculation
          messages.push(`${target.character.name} BLOCKED using ${pendingReaction.name}!`);
          break;
          
        case 'counter':
          abilityNegated = true;
          counterDamage = pendingReaction.damage || 1;
          messages.push(`${target.character.name} COUNTERED with ${pendingReaction.name} for ${counterDamage} damage!`);
          break;
          
        case 'counter-kill':
        case 'removal':
          // Check if this is a counter-kill type reaction
          if (pendingReaction.reaction?.trigger === 'target-of-attack') {
            abilityNegated = true;
            // Kill the attacker
            newBoard[attacker.row][attacker.col] = null;
            messages.push(`${target.character.name} used ${pendingReaction.name} - ${attacker.character.name} was INSTANTLY KILLED!`);
          }
          break;
          
        case 'bribe':
          // Only prevents killing blows - handled in damage application
          messages.push(`${target.character.name} attempted to BRIBE their way out!`);
          break;
          
        default:
          messages.push(`${target.character.name} used ${pendingReaction.name}!`);
      }
    }
  }
  
  // Mark the attack as used on the attacker (if attacker still exists and not already marked)
  if (newBoard[attacker.row][attacker.col] && !gameStateUpdates.attackAlreadyMarkedUsed) {
    const attackerCell = newBoard[attacker.row][attacker.col];
    newBoard[attacker.row][attacker.col] = {
      ...attackerCell,
      usedAttacks: [...(attackerCell.usedAttacks || []), attackIndex],
    };
  }
  
  // Track once-per-game/once-per-target usage
  if (attack.conditionals) {
    for (const conditional of attack.conditionals) {
      if (conditional.type === 'oncePerGame') {
        const key = `${attacker.character.id}-${attack.name}`;
        gameStateUpdates.usedOncePerGame = [...(context.gameState?.usedOncePerGame || []), key];
      }
      if (conditional.type === 'oncePerTarget' && target?.character) {
        const key = `${attacker.character.id}-${target.character.id}`;
        gameStateUpdates.usedOncePerTarget = [...(context.gameState?.usedOncePerTarget || []), key];
      }
    }
  }
  
  // If ability was negated, skip damage/effect application
  if (abilityNegated) {
    // Apply counter damage to attacker if applicable
    if (counterDamage > 0 && newBoard[attacker.row][attacker.col]) {
      const attackerCell = newBoard[attacker.row][attacker.col];
      const newAttackerHp = attackerCell.hp - counterDamage;
      if (newAttackerHp <= 0) {
        newBoard[attacker.row][attacker.col] = null;
        messages.push(`${attacker.character.name} was destroyed by the counter!`);
      } else {
        newBoard[attacker.row][attacker.col] = { ...attackerCell, hp: newAttackerHp };
      }
    }
    
    return {
      success: true,
      flowState: {
        ...flowState,
        state: ABILITY_FLOW_STATES.COMPLETE,
        result: {
          abilityNegated: true,
          messages,
          targetDestroyed: false,
          attackerDestroyed: !newBoard[attacker.row][attacker.col],
        },
      },
      board: newBoard,
      attackerEnergy: newAttackerEnergy,
      targetEnergy: newTargetEnergy,
      messages,
      gameStateUpdates,
    };
  }
  
  // Handle special abilities that don't deal damage
  if (attack.specialTypes && attack.specialTypes.length > 0) {
    // Include direction from flowState in the context for knockback/displacement effects
    const effectContext = {
      ...context,
      direction: flowState.direction,
    };
    const result = applySpecialEffects(
      attack,
      newBoard,
      attacker,
      target,
      messages,
      effectContext
    );
    newBoard = result.board;
    
    if (result.skipDamage) {
      return {
        success: true,
        flowState: {
          ...flowState,
          state: ABILITY_FLOW_STATES.COMPLETE,
          result: {
            abilityNegated: false,
            messages: [...messages, ...result.messages],
            specialEffectApplied: true,
            effectTypes: attack.specialTypes,
          },
        },
        board: newBoard,
        attackerEnergy: newAttackerEnergy,
        targetEnergy: newTargetEnergy,
        messages: [...messages, ...result.messages],
        gameStateUpdates: { ...gameStateUpdates, ...result.gameStateUpdates },
      };
    }
    
    messages.push(...result.messages);
    gameStateUpdates = { ...gameStateUpdates, ...result.gameStateUpdates };
  } else if (attack.special) {
    // Legacy support for old special field
    const result = applySpecialEffect(
      attack,
      newBoard,
      attacker,
      target,
      messages
    );
    newBoard = result.board;
    
    if (result.skipDamage) {
      return {
        success: true,
        flowState: {
          ...flowState,
          state: ABILITY_FLOW_STATES.COMPLETE,
          result: {
            abilityNegated: false,
            messages: [...messages, ...result.messages],
            specialEffectApplied: true,
            effectType: attack.special,
          },
        },
        board: newBoard,
        attackerEnergy: newAttackerEnergy,
        targetEnergy: newTargetEnergy,
        messages: [...messages, ...result.messages],
        gameStateUpdates,
      };
    }
    
    messages.push(...result.messages);
  }
  
  // Handle multi-target damage (for all-attack-directions type abilities)
  // Check flowState for multi-target info (stored there by processTargetSelection)
  const isMultiTarget = flowState.isMultiTarget || context.isMultiTarget;
  const multiTargets = flowState.multiTargets || context.multiTargets;
  
  if (attack.damage > 0 && isMultiTarget && multiTargets?.length > 0) {
    for (const targetInfo of multiTargets) {
      const targetCell = newBoard[targetInfo.row][targetInfo.col];
      if (targetCell) {
        const damageResult = calculateDamage(attack.damage, targetCell, attacker.character);
        const damageMessage = formatDamageMessage(damageResult);
        const newTargetHp = targetCell.hp - damageResult.finalDamage;
        
        if (newTargetHp <= 0) {
          newBoard[targetInfo.row][targetInfo.col] = null;
          messages.push(`${attack.name} dealt ${damageMessage} damage and DESTROYED ${targetCell.name || 'Enemy'}!`);
          
          gameStateUpdates.damageDealtThisTurn = [
            ...(gameStateUpdates.damageDealtThisTurn || []),
            { attackerId: attacker.character.id, targetId: targetCell.id, damage: damageResult.finalDamage, killed: true }
          ];
        } else {
          newBoard[targetInfo.row][targetInfo.col] = { ...targetCell, hp: newTargetHp };
          messages.push(`${attack.name} dealt ${damageMessage} damage to ${targetCell.name || 'Enemy'}! (${newTargetHp} HP remaining)`);
          
          gameStateUpdates.damageDealtThisTurn = [
            ...(gameStateUpdates.damageDealtThisTurn || []),
            { attackerId: attacker.character.id, targetId: targetCell.id, damage: damageResult.finalDamage, killed: false }
          ];
        }
      }
    }
  } else if (attack.damage > 0 && isMultiTarget && (!multiTargets || multiTargets.length === 0)) {
    messages.push(`${attack.name} found no enemies in attack directions.`);
  }
  
  // Calculate and apply damage (single target) - skip if this is a multi-target ability
  if (attack.damage > 0 && target?.character && !isMultiTarget) {
    // Check if target was displaced to a new position
    const targetPos = gameStateUpdates.displacedTargetPosition || { row: target.row, col: target.col };
    const targetCell = newBoard[targetPos.row][targetPos.col];
    if (targetCell) {
      // Include knockback bonus damage if knockback was blocked
      const totalDamage = attack.damage + (gameStateUpdates.knockbackBonusDamage || 0);
      const damageResult = calculateDamage(totalDamage, targetCell, attacker.character);
      const damageMessage = formatDamageMessage(damageResult);
      
      // Check for bribe reaction preventing death
      const hasBribe = getReactionType(pendingReaction) === 'bribe';
      const wouldDie = targetCell.hp - damageResult.finalDamage <= 0;
      
      if (hasBribe && wouldDie) {
        // Bribe prevents the killing blow
        messages.push(`${target.character.name}'s bribe worked! The killing blow was prevented!`);
      } else {
        const newTargetHp = targetCell.hp - damageResult.finalDamage;
        
        if (newTargetHp <= 0) {
          newBoard[targetPos.row][targetPos.col] = null;
          messages.push(`${attack.name} dealt ${damageMessage} damage and DESTROYED ${target.character.name || 'Tower'}!`);
          
          // Track damage dealt for combo abilities
          gameStateUpdates.damageDealtThisTurn = [
            ...(context.gameState?.damageDealtThisTurn || []),
            { attackerId: attacker.character.id, targetId: target.character.id, damage: damageResult.finalDamage, killed: true }
          ];
        } else {
          newBoard[targetPos.row][targetPos.col] = { ...targetCell, hp: newTargetHp };
          messages.push(`${attack.name} dealt ${damageMessage} damage to ${target.character.name || 'Tower'}! (${newTargetHp} HP remaining)`);
          
          // Track damage dealt for combo abilities
          gameStateUpdates.damageDealtThisTurn = [
            ...(context.gameState?.damageDealtThisTurn || []),
            { attackerId: attacker.character.id, targetId: target.character.id, damage: damageResult.finalDamage, killed: false }
          ];
        }
      }
    }
  }
  
  // Determine final target position for destroyed check
  const finalTargetPos = gameStateUpdates.displacedTargetPosition || (target ? { row: target.row, col: target.col } : null);
  
  return {
    success: true,
    flowState: {
      ...flowState,
      state: ABILITY_FLOW_STATES.COMPLETE,
      result: {
        abilityNegated: false,
        messages,
        targetDestroyed: target?.character && finalTargetPos && !newBoard[finalTargetPos.row][finalTargetPos.col],
        attackerDestroyed: !newBoard[attacker.row][attacker.col],
      },
    },
    board: newBoard,
    attackerEnergy: newAttackerEnergy,
    targetEnergy: newTargetEnergy,
    messages,
    gameStateUpdates,
  };
}

/**
 * Get the reaction type from an attack (handles both new and legacy format)
 */
function getReactionType(attack) {
  if (!attack) return null;
  
  // New format: check specialTypes
  if (attack.specialTypes) {
    // Check for counter-kill first (removal + reaction trigger = instant kill the attacker)
    if (attack.specialTypes.includes('removal') && attack.reaction?.trigger === 'target-of-attack') return 'counter-kill';
    // Also check for high damage reactions (999 = instant kill)
    if (attack.specialTypes.includes('cancel-attack') && attack.damage === 999) return 'counter-kill';
    // Regular cancel-attack (dodge)
    if (attack.specialTypes.includes('cancel-attack')) return 'cancel-attack';
  }
  
  // Check for reaction object
  if (attack.reaction) {
    // Infer type from the ability's effect
    if (attack.damage === 999) return 'counter-kill';
    if (attack.damage > 0) return 'counter';
  }
  
  // Legacy format
  return attack.special?.toLowerCase() || null;
}

/**
 * Apply special effects from an ability (new format with specialTypes array)
 */
function applySpecialEffects(attack, board, attacker, target, existingMessages = [], context = {}) {
  const messages = [];
  let newBoard = board;
  let skipDamage = false;
  let gameStateUpdates = {};
  
  for (const specialType of attack.specialTypes) {
    const result = applySingleSpecialEffect(specialType, attack, newBoard, attacker, target, context);
    newBoard = result.board;
    messages.push(...result.messages);
    if (result.skipDamage) skipDamage = true;
    if (result.gameStateUpdates) {
      gameStateUpdates = { ...gameStateUpdates, ...result.gameStateUpdates };
    }
  }
  
  return { board: newBoard, messages, skipDamage, gameStateUpdates };
}

/**
 * Apply a single special effect type
 */
function applySingleSpecialEffect(specialType, attack, board, attacker, target, context = {}) {
  const messages = [];
  let newBoard = board;
  let skipDamage = false;
  let gameStateUpdates = {};
  
  switch (specialType) {
    case 'vulnerability': {
      if (!target?.character) break;
      const duration = attack.duration || STATUS_EFFECTS.vulnerable.defaultDuration;
      const multiplier = attack.vulnerabilityMultiplier || 2;
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        'vulnerable',
        duration * 2, // Convert turn cycles to individual turns
        { multiplier }
      );
      newBoard = result.board;
      messages.push(`${target.character.name} is now VULNERABLE! Takes ${multiplier}x damage for ${duration} turn cycles.`);
      skipDamage = attack.damage === 0;
      break;
    }
    
    case 'heal': {
      const targetCell = target?.character ? board[target.row][target.col] : board[attacker.row][attacker.col];
      const targetPos = target?.character ? target : attacker;
      const healAmount = attack.healAmount || attack.damage || 2;
      const maxHp = targetCell.maxHp || targetCell.hp + healAmount;
      const newHp = Math.min(targetCell.hp + healAmount, maxHp);
      newBoard = board.map(r => [...r]);
      newBoard[targetPos.row][targetPos.col] = { ...targetCell, hp: newHp };
      messages.push(`${targetCell.name} healed for ${newHp - targetCell.hp} HP!`);
      skipDamage = true;
      break;
    }
    
    case 'no-abilities':
    case 'no-movement': {
      if (!target?.character) break;
      const duration = attack.duration || 2;
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        specialType === 'no-abilities' ? 'stunned' : 'paralyzed',
        duration * 2
      );
      newBoard = result.board;
      const effectName = specialType === 'no-abilities' ? 'STUNNED' : 'PARALYZED';
      messages.push(`${target.character.name} is ${effectName} for ${duration} turn cycles!`);
      skipDamage = attack.damage === 0;
      break;
    }
    
    case 'damage-over-time': {
      if (!target?.character) break;
      const duration = attack.dotDuration || 3;
      const dotDamage = attack.dotDamage || 1;
      const dotPattern = attack.dotPattern || null;
      
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        'poisoned',
        typeof duration === 'number' ? duration * 2 : 999,
        { 
          damagePerTurn: dotDamage, 
          pattern: dotPattern,
          patternIndex: 0
        }
      );
      newBoard = result.board;
      messages.push(`${target.character.name} is affected by ${attack.name}!`);
      skipDamage = attack.damage === 0;
      break;
    }
    
    case 'burn': {
      if (!target?.character) break;
      const dotPattern = attack.dotPattern || [1, 2, 2, 2];
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        'burned',
        999,
        { 
          currentDamage: dotPattern[0],
          pattern: dotPattern,
          patternIndex: 0
        }
      );
      newBoard = result.board;
      messages.push(`${target.character.name} is BURNING! Will take escalating damage each turn.`);
      skipDamage = attack.damage === 0;
      break;
    }
    
    case 'mark': {
      if (!target?.character) break;
      const bonusDamage = attack.damageBonus || 3;
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        'marked',
        999,
        { markedBy: attacker.character.id, bonusDamage }
      );
      newBoard = result.board;
      messages.push(`${target.character.name} is MARKED! ${attacker.character.name} deals +${bonusDamage} damage to them.`);
      skipDamage = true;
      break;
    }
    
    case 'damage-buff': {
      // Apply damage buff to self and/or allies
      const damageBonus = attack.damageBonus || 1;
      const duration = attack.duration || 1;
      
      if (attack.targetType === 'self-and-adjacent-allies') {
        // Buff self
        const selfResult = addStatusEffect(
          board,
          attacker.row,
          attacker.col,
          'damage-buffed',
          duration * 2,
          { bonusDamage: damageBonus }
        );
        newBoard = selfResult.board;
        
        // Buff adjacent allies
        for (const direction of Object.keys(DIRECTION_OFFSETS)) {
          const offset = DIRECTION_OFFSETS[direction];
          const adjRow = attacker.row + offset.row;
          const adjCol = attacker.col + offset.col;
          
          if (adjRow >= 0 && adjRow < GRID_SIZE && adjCol >= 0 && adjCol < GRID_SIZE) {
            const adjCell = newBoard[adjRow][adjCol];
            if (adjCell && adjCell.player === attacker.character.player) {
              const adjResult = addStatusEffect(
                newBoard,
                adjRow,
                adjCol,
                'damage-buffed',
                duration * 2,
                { bonusDamage: damageBonus }
              );
              newBoard = adjResult.board;
            }
          }
        }
        messages.push(`${attacker.character.name} and adjacent allies deal +${damageBonus} damage this turn!`);
      } else {
        // Self-targeting or default: buff the attacker only
        const selfResult = addStatusEffect(
          board,
          attacker.row,
          attacker.col,
          'damage-buffed',
          duration * 2,
          { bonusDamage: damageBonus }
        );
        newBoard = selfResult.board;
        messages.push(`${attacker.character.name} deals +${damageBonus} damage this turn!`);
      }
      skipDamage = true;
      break;
    }
    
    case 'damage-debuff': {
      if (!target?.character) break;
      const reduction = attack.damageReduction || 1;
      const duration = attack.duration === 'permanent' ? 999 : (attack.duration || 2) * 2;
      
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        'damage-debuffed',
        duration,
        { damageReduction: reduction }
      );
      newBoard = result.board;
      const durationText = attack.duration === 'permanent' ? 'permanently' : `for ${attack.duration} turn cycles`;
      messages.push(`${target.character.name}'s attacks deal ${reduction} less damage ${durationText}!`);
      skipDamage = attack.damage === 0;
      break;
    }
    
    case 'displacement': {
      if (!target?.character) break;
      
      newBoard = board.map(r => [...r]);
      
      // Handle different displacement target types
      if (attack.targetType === 'random-tile') {
        // Find all empty tiles and assign them numbers
        const emptyTiles = getEmptyTiles(newBoard);
        
        if (emptyTiles.length === 0) {
          messages.push(`${target.character.name} couldn't be displaced - no empty tiles!`);
          break;
        }
        
        // Generate the tile mapping for D20 roll display
        const tileMapping = emptyTiles.map((tile, index) => ({
          number: index + 1,
          row: tile.row,
          col: tile.col,
        }));
        
        // Roll for random tile (simulating D20 or using available tiles)
        const dieType = attack.dieType || 'd20';
        const maxRoll = dieType === 'd20' ? 20 : parseInt(dieType.replace('d', '')) || emptyTiles.length;
        const roll = Math.floor(Math.random() * maxRoll) + 1;
        
        // Map roll to available tile (wrap around if roll exceeds available tiles)
        const tileIndex = (roll - 1) % emptyTiles.length;
        const destinationTile = emptyTiles[tileIndex];
        
        // Move the target to the new position
        const targetCell = newBoard[target.row][target.col];
        newBoard[target.row][target.col] = null;
        newBoard[destinationTile.row][destinationTile.col] = targetCell;
        
        messages.push(`${target.character.name} rolled a ${roll}! Displaced to tile ${tileIndex + 1} (row ${destinationTile.row + 1}, col ${destinationTile.col + 1})!`);
        
        // Store the roll result and tile mapping for UI display
        gameStateUpdates.displacementResult = {
          roll,
          dieType,
          tileMapping,
          destinationTile,
          targetName: target.character.name,
        };
      } else if (attack.targetType === 'any-empty-tile' || attack.displacementTargetType === 'any-empty-tile') {
        // Player chooses the destination - this is handled in target selection flow
        // The displacement destination should be passed in context
        if (context.displacementDestination) {
          const dest = context.displacementDestination;
          const targetCell = newBoard[target.row][target.col];
          newBoard[target.row][target.col] = null;
          newBoard[dest.row][dest.col] = targetCell;
          messages.push(`Displaced to row ${dest.row + 1}, col ${dest.col + 1}!`);
          // Track new position for damage application
          gameStateUpdates.displacedTargetPosition = { row: dest.row, col: dest.col };
        } else {
          messages.push(`${target.character.name} was displaced!`);
        }
      } else {
        // Default displacement behavior
        messages.push(`${target.character.name} was displaced!`);
      }
      
      skipDamage = attack.damage === 0;
      break;
    }
    
    case 'knockback': {
      if (!target?.character) break;
      const knockbackDistance = attack.knockbackDistance || 1;
      const direction = context.direction;
      
      if (direction) {
        const offset = DIRECTION_OFFSETS[direction];
        const newRow = target.row + (offset.row * knockbackDistance);
        const newCol = target.col + (offset.col * knockbackDistance);
        
        // Check if knockback destination is valid (in bounds and empty)
        const isInBounds = newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE;
        const isBlocked = !isInBounds || (isInBounds && board[newRow][newCol] !== null);
        
        if (!isBlocked) {
          // Move target to new position
          newBoard = board.map(r => [...r]);
          const targetCell = newBoard[target.row][target.col];
          newBoard[target.row][target.col] = null;
          newBoard[newRow][newCol] = targetCell;
          messages.push(`${target.character.name} was knocked back ${knockbackDistance} tile(s)!`);
          // Track the new position so damage can be applied to the moved target
          gameStateUpdates.displacedTargetPosition = { row: newRow, col: newCol };
        } else {
          // Knockback blocked - deal bonus damage instead
          const bonusDamage = attack.blockedBonusDamage || 2;
          const reason = !isInBounds ? 'hit the edge' : 'was blocked';
          messages.push(`${target.character.name} ${reason} - takes ${bonusDamage} extra damage!`);
          // Store bonus damage in gameStateUpdates to be applied during damage calculation
          gameStateUpdates.knockbackBonusDamage = bonusDamage;
        }
      }
      break;
    }
    
    case 'movement': {
      // Self-movement ability - move the character to the target position
      if (target && target.row !== undefined && target.col !== undefined) {
        // Move the attacker to the new position
        const attackerCell = board[attacker.row][attacker.col];
        newBoard = board.map(r => [...r]);
        newBoard[attacker.row][attacker.col] = null;
        newBoard[target.row][target.col] = attackerCell;
        messages.push(`${attacker.character.name} moved to a new position!`);
        
        // Update game state with new position
        gameStateUpdates.movedCharacter = {
          from: { row: attacker.row, col: attacker.col },
          to: { row: target.row, col: target.col },
          character: attackerCell
        };
      } else {
        messages.push(`${attacker.character.name} attempted to move but couldn't!`);
      }
      skipDamage = true;
      break;
    }
    
    case 'control': {
      if (!target?.character) break;
      
      // Check for specific control effects based on attack name/description
      const attackNameLower = attack.name.toLowerCase();
      
      // "Kill Yourself" - target uses their highest damage move against themselves
      if (attackNameLower.includes('kill yourself')) {
        const targetAttacks = target.character.attacks || [];
        
        // Find the attack with highest damage
        let highestDamageAttack = null;
        let highestDamage = 0;
        
        for (const targetAtk of targetAttacks) {
          if (targetAtk.damage && targetAtk.damage > highestDamage) {
            highestDamage = targetAtk.damage;
            highestDamageAttack = targetAtk;
          }
        }
        
        if (highestDamageAttack && highestDamage > 0) {
          // Apply the damage to the target
          const targetCell = board[target.row][target.col];
          const newTargetHp = targetCell.hp - highestDamage;
          
          newBoard = board.map(r => [...r]);
          
          if (newTargetHp <= 0) {
            newBoard[target.row][target.col] = null;
            messages.push(`${target.character.name} used ${highestDamageAttack.name} against themselves for ${highestDamage} damage and was DESTROYED!`);
          } else {
            newBoard[target.row][target.col] = { ...targetCell, hp: newTargetHp };
            messages.push(`${target.character.name} used ${highestDamageAttack.name} against themselves for ${highestDamage} damage! (${newTargetHp} HP remaining)`);
          }
        } else {
          messages.push(`${target.character.name} has no damaging attacks to use against themselves!`);
        }
        skipDamage = true;
        break;
      }
      
      // "Brainwash" - take control for the turn (handled by game state)
      if (attackNameLower.includes('brainwash')) {
        gameStateUpdates.controlledCharacter = {
          character: target.character,
          position: { row: target.row, col: target.col },
          originalOwner: target.character.player,
          controlledBy: attacker.character.player,
          freeAbilityUsed: false
        };
        messages.push(`${attacker.character.name} brainwashed ${target.character.name}! You may use one of their abilities for free.`);
        skipDamage = true;
        break;
      }
      
      // Generic control effect
      messages.push(`${attacker.character.name} took control of ${target.character.name}!`);
      skipDamage = true;
      break;
    }
    
    case 'removal': {
      if (!target?.character) break;
      
      // Check for conditional-based removal with different effects
      if (attack.conditionals && attack.conditionals.length > 0) {
        // Find which conditional matches the target's state
        const healthBelowCond = attack.conditionals.find(c => c.type === 'targetHealthBelow');
        const healthAboveCond = attack.conditionals.find(c => c.type === 'targetHealthAbove');
        
        // Check if target meets the "below" threshold (instant kill)
        if (healthBelowCond && target.character.hp <= healthBelowCond.value) {
          newBoard = board.map(r => [...r]);
          newBoard[target.row][target.col] = null;
          messages.push(`${target.character.name} was DESTROYED by ${attack.name}! (HP: ${target.character.hp} ≤ ${healthBelowCond.value})`);
        }
        // Check if target meets the "above" threshold (delayed return)
        else if (healthAboveCond && target.character.hp > healthAboveCond.value) {
          newBoard = board.map(r => [...r]);
          const removedCharacter = { ...newBoard[target.row][target.col] };
          newBoard[target.row][target.col] = null;
          
          // Store the character for delayed return
          const returnDelay = healthAboveCond.returnDelay || 1;
          const returnDamage = healthAboveCond.returnDamage || 0;
          gameStateUpdates.delayedReturn = {
            character: removedCharacter,
            originalPosition: { row: target.row, col: target.col },
            turnsUntilReturn: returnDelay * 2, // Turn cycles = 2 individual turns
            damageOnReturn: returnDamage,
            owner: removedCharacter.player
          };
          messages.push(`${target.character.name} was EATEN by ${attack.name}! They will return in ${returnDelay} turn cycle(s) and take ${returnDamage} damage. (HP: ${target.character.hp} > ${healthAboveCond.value})`);
        }
        // If neither conditional matches, no removal happens
        else {
          messages.push(`${attack.name} had no effect on ${target.character.name}!`);
        }
      } else {
        // Simple removal without conditionals
        newBoard = board.map(r => [...r]);
        newBoard[target.row][target.col] = null;
        messages.push(`${target.character.name} was DESTROYED by ${attack.name}!`);
      }
      skipDamage = true;
      break;
    }
    
    case 'trap': {
      if (!target?.character) break;
      const escapeCondition = attack.escapeCondition || { rollBelow: 5, dieType: 'd6' };
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        'trapped',
        999,
        { escapeCondition }
      );
      newBoard = result.board;
      messages.push(`${target.character.name} is TRAPPED!`);
      skipDamage = attack.damage === 0;
      break;
    }
    
    case 'zone-control':
    case 'summon-structure': {
      // These create structures on the board - handled by game-specific logic
      messages.push(`${attacker.character.name} created a zone effect!`);
      skipDamage = true;
      break;
    }
    
    case 'opponent-deck-reveal': {
      const peekCount = attack.peekCount || 1;
      messages.push(`${attacker.character.name} peeked at ${peekCount} card(s) from opponent's deck!`);
      gameStateUpdates.deckPeek = { player: 'opponent', count: peekCount, canReorder: attack.canReorder };
      skipDamage = true;
      break;
    }
    
    case 'self-deck-reveal': {
      const peekCount = attack.peekCount || 1;
      messages.push(`${attacker.character.name} peeked at ${peekCount} card(s) from their deck!`);
      gameStateUpdates.deckPeek = { player: 'self', count: peekCount };
      skipDamage = true;
      break;
    }
    
    case 'opponent-hand-reveal': {
      messages.push(`${attacker.character.name} revealed opponent's hand!`);
      gameStateUpdates.handReveal = { player: 'opponent' };
      skipDamage = true;
      break;
    }
    
    case 'character-placement-discount': {
      const discountAmount = attack.discountAmount || 'full';
      const validCards = attack.validCardIds || attack.conditionals?.find(c => c.type === 'cardInHand')?.cardIds || [];
      messages.push(`${attacker.character.name} can place a card at ${discountAmount === 'full' ? 'no cost' : 'reduced cost'}!`);
      gameStateUpdates.placementDiscount = { amount: discountAmount, validCards };
      skipDamage = true;
      break;
    }
    
    case 'multi-target': {
      // Multi-target is handled in conjunction with targetType
      // This just marks that the ability affects multiple targets
      break;
    }
    
    case 'combo': {
      // Combo abilities trigger based on ally actions - check if conditions are met
      messages.push(`${attacker.character.name} activated a combo attack!`);
      break;
    }
    
    case 'rival': {
      // Rival effects provide bonuses against specific enemies
      break;
    }
    
    case 'ignore-reaction': {
      // This flag indicates the attack bypasses reactions
      // Already handled by not checking for reactions when this is set
      break;
    }
    
    case 'cancel-attack': {
      // This is a reaction ability - handled in reaction processing
      break;
    }
    
    default:
      // Unknown special type - log warning
      console.warn(`Unknown special type: ${specialType}`);
      break;
  }
  
  return { board: newBoard, messages, skipDamage, gameStateUpdates };
}

/**
 * Apply special effect from an ability
 */
function applySpecialEffect(attack, board, attacker, target, existingMessages = []) {
  const messages = [];
  let newBoard = board;
  let skipDamage = false;
  
  switch (attack.special) {
    case 'vulnerability': {
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        'vulnerable',
        STATUS_EFFECTS.vulnerable.defaultDuration
      );
      newBoard = result.board;
      messages.push(`${target.character.name} is now VULNERABLE! Takes double damage for 2 turn cycles.`);
      skipDamage = true; // This ability doesn't deal damage
      break;
    }
    
    case 'heal': {
      const targetCell = board[target.row][target.col];
      const healAmount = attack.healAmount || attack.damage || 2;
      const maxHp = target.character.maxHp || targetCell.hp + healAmount; // If no max, just add
      const newHp = Math.min(targetCell.hp + healAmount, maxHp);
      newBoard = board.map(r => [...r]);
      newBoard[target.row][target.col] = { ...targetCell, hp: newHp };
      messages.push(`${target.character.name} healed for ${newHp - targetCell.hp} HP!`);
      skipDamage = true;
      break;
    }
    
    case 'stun':
    case 'paralyze': {
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        attack.special === 'stun' ? 'stunned' : 'paralyzed',
        attack.duration || 2
      );
      newBoard = result.board;
      messages.push(`${target.character.name} is ${attack.special === 'stun' ? 'STUNNED' : 'PARALYZED'}!`);
      skipDamage = attack.damage === 0;
      break;
    }
    
    case 'burn': {
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        'burned',
        999, // Burns until death
        { currentDamage: 1 }
      );
      newBoard = result.board;
      messages.push(`${target.character.name} is BURNING! Will take escalating damage each turn.`);
      skipDamage = true;
      break;
    }
    
    case 'damage-over-time': {
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        'poisoned',
        attack.duration || 3,
        { damagePerTurn: attack.dotDamage || 1 }
      );
      newBoard = result.board;
      messages.push(`${target.character.name} is POISONED!`);
      skipDamage = attack.damage === 0;
      break;
    }
    
    case 'mark': {
      const result = addStatusEffect(
        board,
        target.row,
        target.col,
        'marked',
        999,
        { markedBy: attacker.character.id, bonusDamage: attack.bonusDamage || 3 }
      );
      newBoard = result.board;
      messages.push(`${target.character.name} is MARKED! ${attacker.character.name} deals bonus damage to them.`);
      skipDamage = true;
      break;
    }
    
    // Add more special effects as needed
    default:
      // Unknown special - just continue with normal damage
      break;
  }
  
  return { board: newBoard, messages, skipDamage };
}

/**
 * Cancel the current ability flow
 */
export function cancelAbilityFlow() {
  return {
    flowState: {
      ...createAbilityFlowState(),
      state: ABILITY_FLOW_STATES.CANCELLED,
    },
  };
}

/**
 * Check if a character can act (not stunned, paralyzed, etc.)
 */
export function canCharacterAct(character) {
  if (!character) return false;
  
  const preventingEffects = character.statusEffects?.filter(
    e => STATUS_EFFECTS[e.type]?.preventsActions
  );
  
  return !preventingEffects || preventingEffects.length === 0;
}

/**
 * Process damage-over-time effects at the start of a turn
 */
export function processDotEffects(board, currentPlayer) {
  let newBoard = board.map(r => [...r]);
  const dotMessages = [];
  const destroyedCards = [];
  
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const cell = newBoard[row][col];
      
      // Only process effects on the current player's cards
      if (!cell || cell.player !== currentPlayer || !cell.statusEffects) continue;
      
      cell.statusEffects.forEach(effect => {
        if (effect.type === 'poisoned') {
          // Use pattern if available, otherwise use damagePerTurn
          let damage;
          if (effect.pattern && effect.pattern.length > 0) {
            const patternIndex = effect.patternIndex || 0;
            damage = effect.pattern[patternIndex] || effect.pattern[effect.pattern.length - 1];
          } else {
            damage = effect.damagePerTurn || 1;
          }
          
          const newHp = cell.hp - damage;
          
          // Update patternIndex for next turn if using pattern
          const updatedEffects = cell.statusEffects.map(e =>
            e.type === 'poisoned' && e.pattern
              ? { ...e, patternIndex: (e.patternIndex || 0) + 1 }
              : e
          );
          
          if (newHp <= 0) {
            newBoard[row][col] = null;
            dotMessages.push(`${cell.name} took ${damage} poison damage and was destroyed!`);
            destroyedCards.push({ row, col, name: cell.name });
          } else {
            newBoard[row][col] = { ...cell, hp: newHp, statusEffects: updatedEffects };
            dotMessages.push(`${cell.name} took ${damage} poison damage. (${newHp} HP remaining)`);
          }
        } else if (effect.type === 'burned') {
          const damage = effect.currentDamage || 1;
          const newHp = cell.hp - damage;
          
          // Increase burn damage for next turn
          const updatedEffects = cell.statusEffects.map(e =>
            e.type === 'burned' ? { ...e, currentDamage: damage + 1 } : e
          );
          
          if (newHp <= 0) {
            newBoard[row][col] = null;
            dotMessages.push(`${cell.name} took ${damage} burn damage and was destroyed!`);
            destroyedCards.push({ row, col, name: cell.name });
          } else {
            newBoard[row][col] = { ...cell, hp: newHp, statusEffects: updatedEffects };
            dotMessages.push(`${cell.name} took ${damage} burn damage. (${newHp} HP remaining, burn intensifies!)`);
          }
        }
      });
    }
  }
  
  return { board: newBoard, messages: dotMessages, destroyedCards };
}

// ============================================
// ABILITY AVAILABILITY CHECKING
// ============================================

/**
 * Check if an ability can be used given the current game state
 * Returns { canUse: boolean, reason?: string }
 */
export function canUseAbility(attack, context) {
  const { 
    board, 
    attacker, 
    playerEnergy, 
    playerHand, 
    gameState,
    characterUsedAttacks 
  } = context;
  
  // Check if character can act
  if (attacker?.character && !canCharacterAct(attacker.character)) {
    const preventingEffect = attacker.character.statusEffects?.find(
      e => STATUS_EFFECTS[e.type]?.preventsActions
    );
    return { 
      canUse: false, 
      reason: `Cannot act - ${preventingEffect?.type || 'incapacitated'}` 
    };
  }
  
  // Check energy cost
  if (playerEnergy < attack.cost) {
    return { canUse: false, reason: `Not enough energy (need ${attack.cost}, have ${playerEnergy})` };
  }
  
  // Check if already used this turn
  if (characterUsedAttacks?.includes(context.attackIndex)) {
    return { canUse: false, reason: 'Already used this turn' };
  }
  
  // Check conditionals
  if (attack.conditionals && attack.conditionals.length > 0) {
    const conditionalCheck = checkAllConditionals(attack, {
      board,
      attacker,
      playerHand,
      gameState,
    });
    
    if (!conditionalCheck.canUse) {
      const failureMessage = conditionalCheck.failedConditions
        .map(c => getConditionalFailureMessage(c))
        .join('; ');
      return { canUse: false, reason: failureMessage };
    }
  }
  
  return { canUse: true };
}

/**
 * Get all usable abilities for a character
 */
export function getUsableAbilities(character, context) {
  if (!character || !character.attacks) return [];
  
  return character.attacks.map((attack, index) => {
    const checkResult = canUseAbility(attack, { ...context, attackIndex: index });
    return {
      ...attack,
      attackIndex: index,
      canUse: checkResult.canUse,
      reason: checkResult.reason,
    };
  });
}

// ============================================
// PLACEMENT REACTION CHECKING
// ============================================

/**
 * Check for reactions triggered by card placement
 * Returns list of reactions that could trigger
 */
export function checkPlacementReactions(board, placementRow, placementCol, placedCard) {
  const reactions = [];
  
  // Check all adjacent cells for cards with adjacent-placement reactions
  for (const direction of Object.keys(DIRECTION_OFFSETS)) {
    const offset = DIRECTION_OFFSETS[direction];
    const checkRow = placementRow + offset.row;
    const checkCol = placementCol + offset.col;
    
    if (checkRow < 0 || checkRow >= GRID_SIZE || checkCol < 0 || checkCol >= GRID_SIZE) {
      continue;
    }
    
    const adjacentCard = board[checkRow][checkCol];
    if (!adjacentCard) continue;
    
    // Check if this card has adjacent-placement reactions
    const cardReactions = getCharacterReactionTriggers(adjacentCard);
    const placementReactions = cardReactions.filter(r => r.trigger === 'adjacent-placement');
    
    for (const reaction of placementReactions) {
      // Check direction restrictions
      const oppositeDirection = getOppositeDirection(direction);
      if (reaction.directions && !reaction.directions.includes(oppositeDirection)) {
        continue;
      }
      
      // Check if this reaction has already been used this turn
      const abilityIndex = adjacentCard.attacks?.findIndex(a => a.name === reaction.abilityName);
      if (abilityIndex !== undefined && abilityIndex >= 0 && adjacentCard.usedAttacks?.includes(abilityIndex)) {
        continue; // Already used this turn
      }
      
      // Check conditionals
      if (reaction.conditionals) {
        const conditionalCheck = checkAllConditionals({ conditionals: reaction.conditionals }, {
          board,
          attacker: { row: checkRow, col: checkCol, character: adjacentCard },
          target: { row: placementRow, col: placementCol, character: placedCard },
        });
        if (!conditionalCheck.canUse) continue;
      }
      
      reactions.push({
        reactingCard: adjacentCard,
        reactingPosition: { row: checkRow, col: checkCol },
        reaction,
        direction: oppositeDirection,
        automatic: reaction.automatic || false,
        abilityIndex, // Include the ability index for tracking
      });
    }
  }
  
  return reactions;
}

/**
 * Get the opposite direction
 */
function getOppositeDirection(direction) {
  const opposites = {
    'up': 'down',
    'down': 'up',
    'left': 'right',
    'right': 'left',
    'up-left': 'down-right',
    'up-right': 'down-left',
    'down-left': 'up-right',
    'down-right': 'up-left',
  };
  return opposites[direction] || direction;
}

/**
 * Check for placement reactions and return them for modal display
 * Does NOT auto-execute - returns reactions for player to confirm
 */
export function getPlacementReactions(board, placementRow, placementCol, placedCard) {
  const reactions = checkPlacementReactions(board, placementRow, placementCol, placedCard);
  
  // Return all reactions (both automatic and manual) for the modal
  // The reacting player will choose whether to use them
  return reactions.map(reaction => {
    const ability = reaction.reactingCard.attacks?.find(a => a.name === reaction.reaction.abilityName);
    return {
      ...reaction,
      ability,
      placementRow,
      placementCol,
      placedCard,
    };
  });
}

/**
 * Execute a confirmed placement reaction
 */
export function executePlacementReaction(board, reaction) {
  let newBoard = board.map(r => [...r]);
  const messages = [];
  let placedCardDestroyed = false;
  
  const { ability, placementRow, placementCol, placedCard, reactingCard, reactingPosition, abilityIndex } = reaction;
  
  if (!ability) {
    return { board: newBoard, messages: ['Reaction ability not found'], placedCardDestroyed: false };
  }
  
  // Mark the reaction as used on the reacting card
  if (reactingPosition && abilityIndex !== undefined && abilityIndex >= 0) {
    const reactingCell = newBoard[reactingPosition.row][reactingPosition.col];
    if (reactingCell) {
      newBoard[reactingPosition.row][reactingPosition.col] = {
        ...reactingCell,
        usedAttacks: [...(reactingCell.usedAttacks || []), abilityIndex],
      };
    }
  }
  
  // Check if the ability deals instant-kill damage
  if (ability.damage === 999 || ability.specialTypes?.includes('removal')) {
    newBoard[placementRow][placementCol] = null;
    placedCardDestroyed = true;
    messages.push(`${reactingCard.name} used ${ability.name} - ${placedCard.name} was INSTANTLY DESTROYED!`);
  }
  
  return { 
    board: newBoard, 
    messages, 
    placedCardDestroyed,
  };
}

/**
 * Process automatic placement reactions (like GamGam's Explosive Barrier)
 * @deprecated Use getPlacementReactions + modal + executePlacementReaction instead
 */
export function processAutomaticPlacementReactions(board, placementRow, placementCol, placedCard) {
  const reactions = checkPlacementReactions(board, placementRow, placementCol, placedCard);
  const automaticReactions = reactions.filter(r => r.automatic);
  
  let newBoard = board.map(r => [...r]);
  const messages = [];
  let placedCardDestroyed = false;
  
  for (const reaction of automaticReactions) {
    // Get the ability associated with this reaction
    const ability = reaction.reactingCard.attacks?.find(a => a.name === reaction.reaction.abilityName);
    if (!ability) continue;
    
    // Check if the ability deals instant-kill damage
    if (ability.damage === 999 || ability.specialTypes?.includes('removal')) {
      newBoard[placementRow][placementCol] = null;
      placedCardDestroyed = true;
      messages.push(`${reaction.reactingCard.name} used ${ability.name} - ${placedCard.name} was INSTANTLY DESTROYED!`);
    }
  }
  
  // Also return non-automatic reactions that need modal confirmation
  const pendingReactions = reactions.filter(r => !r.automatic).map(reaction => {
    const ability = reaction.reactingCard.attacks?.find(a => a.name === reaction.reaction.abilityName);
    return {
      ...reaction,
      ability,
      placementRow,
      placementCol,
      placedCard,
    };
  });
  
  return { 
    board: newBoard, 
    messages, 
    placedCardDestroyed,
    automaticReactions,
    pendingReactions,
  };
}

// ============================================
// ALLY PROTECTION REACTIONS
// ============================================

/**
 * Check for ally protection reactions (intercept abilities)
 */
export function checkAllyProtectionReactions(board, targetRow, targetCol, targetCard, attackDamage, attackerInfo) {
  const reactions = [];
  
  // Check all adjacent cells for cards with ally-killed or ally-attacked reactions
  for (const direction of Object.keys(DIRECTION_OFFSETS)) {
    const offset = DIRECTION_OFFSETS[direction];
    const checkRow = targetRow + offset.row;
    const checkCol = targetCol + offset.col;
    
    if (checkRow < 0 || checkRow >= GRID_SIZE || checkCol < 0 || checkCol >= GRID_SIZE) {
      continue;
    }
    
    const adjacentCard = board[checkRow][checkCol];
    if (!adjacentCard || adjacentCard.player !== targetCard.player) continue;
    
    // Check if this card has ally protection reactions
    const cardReactions = getCharacterReactionTriggers(adjacentCard);
    const protectionReactions = cardReactions.filter(r => 
      r.trigger === 'ally-killed' || r.trigger === 'ally-attacked'
    );
    
    for (const reaction of protectionReactions) {
      // Check direction restrictions
      const oppositeDirection = getOppositeDirection(direction);
      if (reaction.directions && !reaction.directions.includes(oppositeDirection)) {
        continue;
      }
      
      // Check conditionals
      if (reaction.conditionals) {
        const conditionalCheck = checkAllConditionals({ conditionals: reaction.conditionals }, {
          board,
          attacker: attackerInfo,
          target: { row: targetRow, col: targetCol, character: targetCard },
        });
        if (!conditionalCheck.canUse) continue;
      }
      
      reactions.push({
        protectingCard: adjacentCard,
        protectingPosition: { row: checkRow, col: checkCol },
        reaction,
        direction: oppositeDirection,
      });
    }
  }
  
  // Check for specific-ally-attacked reactions (protection when attacker is adjacent to protector)
  // e.g., Luther protecting Cormac - only triggers when attacker is adjacent to Luther
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const card = board[row][col];
      if (!card || card.player !== targetCard.player) continue;
      // Skip if same as target
      if (row === targetRow && col === targetCol) continue;
      
      const cardReactions = getCharacterReactionTriggers(card);
      const specificProtectionReactions = cardReactions.filter(r => 
        r.trigger === 'specific-ally-attacked' && r.protectedCardId === targetCard.id
      );
      
      for (const reaction of specificProtectionReactions) {
        // Check if attacker is adjacent to this protecting card
        if (attackerInfo) {
          let attackerIsAdjacent = false;
          for (const direction of Object.keys(DIRECTION_OFFSETS)) {
            const offset = DIRECTION_OFFSETS[direction];
            const adjacentRow = row + offset.row;
            const adjacentCol = col + offset.col;
            if (adjacentRow === attackerInfo.row && adjacentCol === attackerInfo.col) {
              attackerIsAdjacent = true;
              break;
            }
          }
          if (!attackerIsAdjacent) continue;
        }
        
        // Check conditionals
        if (reaction.conditionals) {
          const conditionalCheck = checkAllConditionals({ conditionals: reaction.conditionals }, {
            board,
            attacker: attackerInfo,
            target: { row: targetRow, col: targetCol, character: targetCard },
          });
          if (!conditionalCheck.canUse) continue;
        }
        
        reactions.push({
          protectingCard: card,
          protectingPosition: { row, col },
          reaction,
          direction: null, // No specific direction for board-wide protection
        });
      }
    }
  }
  
  return reactions;
}

