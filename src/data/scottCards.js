// Scott's Card Collection
// Extracted from card images in src/assets/ScottCards

/**
 * Special Types (consistent naming):
 * - control: Take control of enemy card
 * - removal: Instant kill / execute effects
 * - heal: Restore HP
 * - displacement: Move enemy to different tile
 * - opponent-deck-reveal: Peek/manipulate opponent's deck
 * - self-deck-reveal: Peek at your own deck
 * - opponent-hand-reveal: Look at opponent's hand
 * - movement: Move self to different tile
 * - no-abilities: Prevent target from using abilities
 * - multi-target: Affects multiple targets
 * - damage-buff: Increase damage output
 * - damage-over-time: Deals damage over multiple turns
 * - character-placement-discount: Reduce or negate placement cost
 * - cancel-attack: Block/dodge incoming attack
 * - vulnerability: Target takes increased damage
 * - damage-debuff: Reduce target's damage output
 * - endure-on-one: Survive lethal damage
 * - ignore-reaction: Bypass reaction abilities
 * - rival: Special interaction with specific enemy card
 * - summon-structure: Create a structure on the board
 * - no-movement: Prevent target from moving
 * - knockback: Push target away
 * - trap: Lock target in a state
 * - zone-control: Control a tile or area
 * - combo: Requires ally action to trigger
 * - mark: Mark target for bonus effects
 * - burn: Fire damage over time
 * 
 * Target Types:
 * - self: Ability targets the caster
 * - none: Ability doesn't require a target (e.g., deck manipulation)
 * - any-tile-with-enemy: Can target any tile with an enemy
 * - any-empty-tile: Can target any empty tile
 * - self-or-adjacent-ally: Can target self or adjacent ally
 * - adjacent-to-ally: Must target a tile adjacent to an ally
 * 
 * Reaction Triggers:
 * - target-of-attack: When this card is targeted by an attack
 * - adjacent-placement: When a card is placed adjacent to this one
 * - ally-attacked: When an adjacent ally is attacked
 * - ally-killed: When an adjacent ally would be killed
 * - on-death: When this card would die
 * - on-ally-attack: When an ally attacks
 * 
 * Conditionals:
 * - cardOnField: Specific card must be on the field
 * - targetHealthBelow: Target must have HP at or below threshold
 * - targetHealthAbove: Target must have HP above threshold
 * - attackDamageBelow: Incoming attack must deal damage at or below threshold
 * - attackDamageAbove: Incoming attack must deal damage above threshold
 * - cardInHand: Specific card must be in hand
 * - cardAdjacent: Specific card must be adjacent
 * - oncePerGame: Can only be used once per game
 * - oncePerTarget: Can only be used once per target
 */

export const SCOTT_CARDS = [
  {
    id: 'axel',
    name: 'Axel',
    cost: 5,
    hp: 4,
    class: 'Ascendance',
    image: 'Axel card layout.JPG',
    attacks: [
      { 
        name: 'Desert Eagle', 
        cost: 2, 
        damage: 2 
      },
      { 
        name: 'Brainwash', 
        cost: 4, 
        damage: 0, 
        specialTypes: ['control'],
        range: 1,
        description: 'Take control of an enemy card for the duration of this turn, and use a single one of their abilities at no cost. Afterwards, you may use their other moves at their regular cost.' 
      },
      { 
        name: 'Kill Yourself', 
        cost: 5, 
        damage: 0, 
        specialTypes: ['control'],
        range: 1,
        description: 'Have the targeted enemy card use their highest damage move against themselves.' 
      },
    ],
    attackDirections: ['up-right', 'right'],
  },
  {
    id: 'manpounds',
    name: 'Manpounds',
    cost: 4,
    hp: 9,
    class: 'Chepperland',
    image: 'IMG_0591.PNG',
    attacks: [
      { 
        name: 'Projectile Puke', 
        cost: 2, 
        damage: 1, 
        range: 2, 
        description: 'Deal 1 damage up to two tiles away, in the applicable directions.' 
      },
      { 
        name: "Manpounds' A Man That's Big, Manpounds Will Eat Your Kids!", 
        cost: 4, 
        damage: 0, 
        specialTypes: ['removal'],
        targetType: 'adjacent',
        conditionals: [
          { type: 'targetHealthBelow', value: 2 }
        ],
        description: 'If any enemy card adjacent to Manpounds has 2 health or less, you may eat them, insta killing them.' 
      },
      { 
        name: 'Objects Are Either Eaten Or Defecated', 
        cost: 5, 
        damage: 0, 
        specialTypes: ['removal'],
        range: 1,
        conditionals: [
          { type: 'targetHealthBelow', value: 7, effect: 'instant-kill' },
          { type: 'targetHealthAbove', value: 7, effect: 'return-with-damage', returnDelay: 1, returnDamage: 2 }
        ],
        description: 'Eat targeted enemy card. If they have 7 health or less, they are insta killed. If they have more, they are returned to the board in 1 turn cycle with 2 damage dealt.' 
      },
    ],
    attackDirections: ['up-right', 'down-left'],
  },
  {
    id: 'filet-mignon',
    name: 'Filet Mignon',
    cost: 3,
    hp: 4,
    class: 'Chepperland',
    image: 'IMG_0592.PNG',
    attacks: [
      { 
        name: 'Mousse Au Chocolat', 
        cost: 3, 
        damage: 1, 
        description: 'Deal 1 damage.' 
      },
      { 
        name: 'Time Warp', 
        cost: 4, 
        damage: 0, 
        specialTypes: ['displacement'],
        range: 1,
        targetType: 'random-tile',
        description: 'Send targeted enemy card to a random empty tile on the board by having them roll a D20 that corresponds to a tile number.' 
      },
      { 
        name: 'Prisoner Of Another Dimension', 
        cost: 4, 
        damage: 0, 
        specialTypes: ['trap', 'no-abilities'],
        range: 1,
        duration: 'until-escape',
        escapeCondition: { rollBelow: 5, dieType: 'd6' },
        description: 'Trap a targeted enemy in another dimension. Each turn cycle, they must roll a die. If they roll a 1, 2, 3, or 4, they escape. Otherwise, they remain trapped, unable to use any moves.' 
      },
    ],
    attackDirections: ['right'],
  },
  {
    id: 'honey-man',
    name: 'Honey Man',
    cost: 3,
    hp: 6,
    class: 'Chepperland',
    image: 'IMG_0593.PNG',
    attacks: [
      { 
        name: 'Double Honey Kick', 
        cost: 1, 
        damage: 2, 
        description: 'Deal 2 damage.' 
      },
      { 
        name: 'Honey Slam', 
        cost: 2, 
        damage: 3, 
        description: 'Deal 3 damage.' 
      },
    ],
    attackDirections: ['up', 'down-left'],
  },
  {
    id: 'philip_swiss_cheese',
    name: 'Philip Swiss Cheese',
    cost: 4,
    hp: 10,
    class: 'Chepperland',
    image: 'IMG_0594.PNG',
    attacks: [
      { 
        name: 'Cheese Atom, Build Me Up!', 
        cost: 2, 
        damage: 0, 
        specialTypes: ['heal'],
        targetType: 'self',
        healAmount: 2,
        description: 'Heal 2 points of health.' 
      },
      { 
        name: 'Cheese Sword', 
        cost: 2, 
        damage: 3 
      },
      { 
        name: 'Cheese Radar', 
        cost: 2, 
        damage: 0, 
        specialTypes: ['opponent-deck-reveal'],
        targetType: 'none',
        peekCount: 1,
        canReorder: true,
        description: `Peek at the top card of your opponent's deck, with the option of placing it at the bottom of their deck.` 
      }
    ],
    attackDirections: ['left', 'down-right'],
  },
  {
    id: 'johnny_cheese',
    name: 'Johnny Cheese',
    cost: 5,
    hp: 13,
    class: 'Chepperland',
    image: 'IMG_0595.PNG',
    attacks: [
      { 
        name: 'Cheese Club, Up Up and Away!', 
        cost: 1, 
        damage: 2 
      },
      { 
        name: 'Teleportation', 
        cost: 1, 
        damage: 0, 
        specialTypes: ['movement'],
        targetType: 'horizontal-direction',
        moveDistance: 1,
        description: 'Move one tile horizontally.' 
      },
      { 
        name: 'Cheese Mitosis', 
        cost: 3, 
        damage: 0, 
        specialTypes: ['heal'],
        targetType: 'self',
        healAmount: 5,
        description: 'Heal 5 points of health.' 
      },
      { 
        name: 'Holy Cheese', 
        cost: 3, 
        damage: 0, 
        specialTypes: ['no-abilities', 'no-movement'],
        range: 1,
        duration: 1,
        description: 'Paralyze a targeted enemy for 1 turn cycle, preventing them from using any moves.' 
      },
      { 
        name: 'Rotten Green Cheese, Another Dimension!', 
        cost: 4, 
        damage: 1, 
        specialTypes: ['displacement'],
        range: 1,
        displacementTargetType: 'any-empty-tile',
        requiresDisplacementDestination: true,
        description: 'Send opponent to any empty tile of your choosing.' 
      }
    ],
    attackDirections: ['up', 'up-left', 'up-right'],
  },
  {
    id: 'sheriff_pepper',
    name: 'Sheriff Pepper',
    cost: 4,
    hp: 5,
    class: 'Chepperland',
    image: 'IMG_0596.PNG',
    attacks: [
      { 
        name: 'Ol Smokey Joe', 
        cost: 1, 
        damage: 1, 
        specialTypes: ['multi-target'],
        targetType: 'all-attack-directions',
        description: 'Deal 1 damage in all attack directions simultaneously.' 
      },
      { 
        name: `I'll Get You, Johnny Cheese!`, 
        cost: 2, 
        damage: 0, 
        specialTypes: ['rival', 'heal', 'damage-buff'],
        targetType: 'self',
        conditionals: [
          { type: 'cardOnField', cardId: 'johnny_cheese' }
        ],
        healAmount: 1,
        damageBonus: 1,
        duration: 1,
        description: 'If Johnny Cheese is on the field, heal 1 HP and all attacks deal +1 damage this turn.' 
      },
      { 
        name: 'Orange Pistol', 
        cost: 2, 
        damage: 3 
      },
      { 
        name: 'Pepper Breath', 
        cost: 2, 
        damage: 1, 
        specialTypes: ['damage-over-time'],
        range: 1,
        dotDamage: 1,
        dotDuration: 3,
        description: 'Deals 1 damage per turn cycle for 3 turn cycles.' 
      }
    ],
    attackDirections: ['up-left', 'up'],
  },
  {
    id: 'the_businessman',
    name: 'The Businessman',
    cost: 4,
    hp: 2,
    class: 'Chepperland',
    image: 'IMG_0597.PNG',
    attacks: [
      { 
        name: 'We Best Have an Agreement', 
        cost: 1, 
        damage: 0, 
        specialTypes: ['character-placement-discount'],
        targetType: 'self',
        conditionals: [
          { type: 'cardInHand', cardIds: ['honey-man', 'manpounds', 'filet-mignon'] }
        ],
        discountAmount: 'full',
        validCardIds: ['honey-man', 'manpounds', 'filet-mignon'],
        description: 'If you have Honey Man, Manpounds, or Filet Mignon in hand, you may place one down negating placement cost.' 
      },
      { 
        name: 'I Have Money, Lots of Money!', 
        cost: 2, 
        damage: 0, 
        specialTypes: ['cancel-attack'],
        reaction: {
          trigger: 'target-of-attack',
          condition: 'would-be-killed'
        },
        description: 'When an enemy is about to kill you, you may bribe them not to.' 
      },
      { 
        name: 'Five Fucking Coins to the Man Who Kills Them! Agh!', 
        cost: 3, 
        damage: 0, 
        specialTypes: ['vulnerability'],
        range: 1,
        vulnerabilityMultiplier: 2,
        duration: 2,
        description: 'Targeted enemy receives double damage for the next two turn cycles.' 
      }
    ],
    attackDirections: ['down-left', 'down', 'down-right'],
  },
  {
    id: 'gamgam',
    name: 'GamGam',
    cost: 4,
    hp: 2,
    class: 'Ascendance',
    image: 'IMG_1518.JPG',
    reactions: [
      {
        trigger: 'target-of-attack',
        abilityName: 'Impenetrable'
      },
      {
        trigger: 'adjacent-placement',
        abilityName: 'Explosive Barrier',
        directions: ['up', 'down']
      }
    ],
    attacks: [
      { 
        name: 'Impenetrable', 
        cost: 2, 
        damage: 999, 
        specialTypes: ['removal', 'cancel-attack'],
        reaction: {
          trigger: 'target-of-attack',
          automatic: true
        },
        description: 'If an enemy card attempts to attack or target GamGam, instantly kill them.' 
      },
      { 
        name: 'Explosive Barrier', 
        cost: 2, 
        damage: 999, 
        specialTypes: ['removal'],
        reaction: {
          trigger: 'adjacent-placement',
          directions: ['up', 'down'],
          automatic: true
        },
        description: 'If a card is placed above or below GamGam after placement, instantly kill them.' 
      }
    ],
    attackDirections: [],
  },
  {
    id: 'luther',
    name: 'Luther',
    cost: 4,
    hp: 10,
    class: 'Ascendance',
    image: 'IMG_1777.JPG',
    reactions: [
      {
        trigger: 'specific-ally-attacked',
        abilityName: 'Get Over Here',
        protectedCardId: 'cormac'
      }
    ],
    attacks: [
      { 
        name: 'Get Over Here', 
        cost: 1, 
        damage: 0, 
        specialTypes: ['cancel-attack', 'displacement'],
        reaction: {
          trigger: 'specific-ally-attacked',
          protectedCardId: 'cormac'
        },
        displacementTargetType: 'adjacent-to-self',
        description: 'If Cormac is on the field, and an enemy card adjacent to Luther is about to attack him, Luther can prevent the attack and send the enemy card flying to another space adjacent to that enemy card.' 
      },
      { 
        name: 'Haymaker', 
        cost: 2, 
        damage: 3 
      },
      { 
        name: 'Arm Snap', 
        cost: 5, 
        damage: 3, 
        specialTypes: ['damage-debuff'],
        damageReduction: 1,
        duration: 'permanent',
        conditionals: [
          { type: 'oncePerTarget' }
        ],
        description: 'Permanently reduce damage output of all enemy attacks by 1. Once per enemy card.' 
      }
    ],
    attackDirections: ['left', 'right'],
  },
  {
    id: 'damien_peak',
    name: 'Damien (Peak)',
    cost: 'T',
    hp: 9,
    class: 'Ascendance',
    image: 'IMG_2326.JPG',
    reactions: [
      {
        trigger: 'target-of-attack',
        abilityName: 'I Am the God of the New World'
      }
    ],
    attacks: [
      { 
        name: 'I Am the God of the New World', 
        cost: 1, 
        damage: 1, 
        specialTypes: ['cancel-attack'],
        reaction: {
          trigger: 'target-of-attack'
        },
        description: 'Dodge an enemy attack and deal 1 damage in return.' 
      },
      { 
        name: 'Electrocution', 
        cost: 2, 
        damage: 4 
      },
      { 
        name: 'Teleportation Slam', 
        cost: 3, 
        damage: 2, 
        targetType: 'any-tile-with-enemy',
        range: 'board'
      },
      { 
        name: 'Teleport', 
        cost: 3, 
        damage: 0, 
        specialTypes: ['movement'],
        targetType: 'any-empty-tile',
        range: 'board',
        description: 'Move Damien to any empty tile on the board.' 
      },
      { 
        name: 'Teleportation Shock', 
        cost: 5, 
        damage: 4, 
        targetType: 'any-tile-with-enemy',
        range: 'board'
      }
    ],
    attackDirections: ['up-left', 'up', 'up-right', 'right', 'down-right', 'down', 'down-left', 'left'],
  },
  {
    id: 'cassius',
    name: 'Cassius',
    cost: 3,
    hp: 5,
    class: 'Ascendance',
    image: 'IMG_3012.JPG',
    attacks: [
      { 
        name: 'Viral Touch', 
        cost: 5, 
        damage: 0, 
        specialTypes: ['damage-over-time'],
        range: 1,
        dotPattern: [1, 2, 5],
        dotDuration: 3,
        description: 'Infect enemy for 3 turn cycles: 1 damage, then 2, then 5.' 
      }
    ],
    attackDirections: ['down', 'down-right'],
  },
  {
    id: 'damien',
    name: 'Damien',
    cost: 5,
    hp: 7,
    class: 'Ascendance',
    image: 'IMG_3365.PNG',
    reactions: [
      {
        trigger: 'ally-killed',
        abilityName: `We're a Family!`,
        conditionals: [
          { type: 'cardAdjacent', cardIds: ['crystal', 'haydn'] }
        ]
      }
    ],
    attacks: [
      { 
        name: 'Electrocution', 
        cost: 2, 
        damage: 4 
      },
      { 
        name: `We're a Family!`, 
        cost: 3, 
        damage: 0, 
        specialTypes: ['cancel-attack'],
        reaction: {
          trigger: 'ally-killed',
          targetType: 'adjacent'
        },
        conditionals: [
          { type: 'cardAdjacent', cardIds: ['crystal', 'haydn'] }
        ],
        description: 'If Crystal or Haydn is adjacent and would be killed, Damien intervenes.' 
      },
      { 
        name: 'Flash Flood', 
        cost: 5, 
        damage: 4, 
        specialTypes: ['multi-target'],
        targetType: 'all-adjacent',
        affectsFriendly: true,
        conditionals: [
          { type: 'cardOnField', cardIds: ['crystal', 'haydn'], requireAll: true }
        ],
        description: 'If Crystal and Haydn are on the field, deal 4 damage to all adjacent tiles (including friendly).' 
      }
    ],
    attackDirections: ['left', 'up-right'],
  },
  {
    id: 'cullen',
    name: 'Cullen',
    cost: 3,
    hp: 3,
    class: 'Ascendance',
    image: 'IMG_3366.PNG',
    attacks: [
      { 
        name: 'Slice', 
        cost: 2, 
        damage: 2 
      },
      { 
        name: 'You Thought I Was Just Some Dude With a Sword?', 
        cost: 3, 
        damage: 3, 
        specialTypes: ['ignore-reaction'],
        bonusDamage: 3,
        description: 'Push attack through a block, dealing initial damage plus 3 additional damage.' 
      }
    ],
    attackDirections: ['left', 'down-right'],
  },
  {
    id: 'manson',
    name: 'Manson',
    cost: 4,
    hp: 7,
    class: 'Ascendance',
    image: 'IMG_3368.PNG',
    attacks: [
      { 
        name: 'Air Bullet', 
        cost: 1, 
        damage: 1 
      },
      { 
        name: 'Blow Away', 
        cost: 3, 
        damage: 2, 
        specialTypes: ['knockback', 'displacement'],
        range: 1,
        knockbackDistance: 1,
        blockedBonusDamage: 2,
        description: 'Send enemy back 1 tile in attack direction. If blocked, nonexistent, or a structure, deal 4 damage instead.' 
      },
      { 
        name: `It's Really Only Extortion If You Have a Choice, And, Well… You Don't`, 
        cost: 3, 
        damage: 0, 
        specialTypes: ['control'],
        range: 1,
        choices: [
          { type: 'give-tokens', amount: 2, timing: 'now-or-next-turn' },
          { type: 'give-card', amount: 1, from: 'hand' }
        ],
        description: 'Target owner must give either 2 action tokens (now or next turn) or one card from hand.' 
      }
    ],
    attackDirections: ['up', 'left', 'up-left'],
  },
  {
    id: 'rodriguez',
    name: 'Rodriguez',
    cost: 2,
    hp: 4,
    class: 'Ascendance',
    image: 'IMG_3369.PNG',
    attacks: [
      { 
        name: 'Uppercut', 
        cost: 1, 
        damage: 1 
      },
      { 
        name: 'Investigation', 
        cost: 1, 
        damage: 0, 
        specialTypes: ['self-deck-reveal'],
        targetType: 'none',
        peekCount: 3,
        description: 'Peek at the next three cards you will be drawing.' 
      },
      { 
        name: 'Gunshot', 
        cost: 2, 
        damage: 2 
      },
      { 
        name: 'Take the Bait…', 
        cost: 2, 
        damage: 0, 
        specialTypes: ['trap', 'character-placement-discount', 'bait-trap'],
        targetType: 'dual-selection', // Requires selecting one friendly and one enemy
        dualSelectionConfig: {
          first: { type: 'friendly-character', label: 'Select a friendly character as bait' },
          second: { type: 'enemy-character', label: 'Select an enemy character to trap' }
        },
        trapConfig: {
          trigger: 'enemy-attacks-friendly', // Triggers when marked enemy attacks marked friendly
          effect: 'free-summon-adjacent-to-attacker', // Summon a card from hand for free
          summonLocation: 'adjacent-to-attacker',
          summonCost: 'free'
        },
        conditionals: [
          { type: 'oncePerGame' },
          { type: 'minimumCharactersOnBoard', friendly: 1, enemy: 1 }
        ],
        description: 'Secretly select one friendly and one enemy card. If they attack each other, summon a card from hand free of cost adjacent to attacker. Once per game.' 
      }
    ],
    attackDirections: ['up-right'],
  },
  {
    id: 'damien_prime',
    name: 'Damien (Prime)',
    cost: 'T',
    hp: 8,
    class: 'Ascendance',
    image: 'IMG_3371.PNG',
    reactions: [
      {
        trigger: 'target-of-attack',
        abilityName: 'I Can See Your Movements'
      }
    ],
    attacks: [
      { 
        name: 'Mind Read', 
        cost: 1, 
        damage: 0, 
        specialTypes: ['opponent-hand-reveal'],
        targetType: 'none',
        description: `Look at all cards in opponent's hand.` 
      },
      { 
        name: 'I Can See Your Movements', 
        cost: 1, 
        damage: 0, 
        specialTypes: ['cancel-attack'],
        reaction: {
          trigger: 'target-of-attack'
        },
        description: `Dodge an enemy's attack.` 
      },
      { 
        name: `It's Time for Humanity to Rise Up!`, 
        cost: 1, 
        damage: 0, 
        specialTypes: ['damage-buff', 'multi-target'],
        targetType: 'self-and-adjacent-allies',
        damageBonus: 1,
        duration: 1,
        description: `All friendly cards adjacent to Damien deal +1 damage this turn, including Damien.` 
      },
      { 
        name: 'Electrocution', 
        cost: 2, 
        damage: 4 
      },
      { 
        name: 'Electric Flamethrower', 
        cost: 3, 
        damage: 6, 
        conditionals: [
          { type: 'cardOnField', cardIds: ['haydn', 'haydn_prime'], requireAny: true }
        ],
        description: `If Haydn or Haydn (Prime) is on the field, deal 6 damage.` 
      }
    ],
    attackDirections: ['down', 'down-left', 'left', 'up-right'],
  },
  {
    id: 'jack',
    name: 'Jack',
    cost: 1,
    hp: 4,
    class: 'Ascendance',
    image: 'IMG_3443.PNG',
    attacks: [
      { 
        name: 'Left Hook', 
        cost: 1, 
        damage: 1 
      },
      { 
        name: 'Gunshot', 
        cost: 2, 
        damage: 2 
      },
      { 
        name: `Guys?! I'm Getting Fucked Here, And Not In a Good Way!`, 
        cost: 0, 
        damage: 0, 
        specialTypes: ['character-placement-discount'],
        conditionals: [
          { type: 'cardInHand', cardIds: ['clark', 'rodriguez'] }
        ],
        discountAmount: 'full',
        description: 'If Clark or Rodriguez is in your hand, summon one of them at no cost.' 
      }
    ],
    attackDirections: ['up-left'],
  },
  {
    id: 'haydn',
    name: 'Haydn',
    cost: 4,
    hp: 6,
    class: 'Ascendance',
    image: 'IMG_3478.PNG',
    attacks: [
      { 
        name: 'Fireball', 
        cost: 2, 
        damage: 2, 
        range: 2, 
        description: 'Deal damage up to 2 tiles away in applicable directions.' 
      },
      { 
        name: 'Flamethrower', 
        cost: 2, 
        damage: 3 
      },
      { 
        name: 'Flame Wall', 
        cost: 2, 
        damage: 0, 
        specialTypes: ['zone-control', 'summon-structure'],
        targetType: 'adjacent-tile',
        duration: 2,
        blocksPlacement: true,
        blocksProjectiles: true,
        description: 'For 2 turns, block placement and projectiles through selected adjacent tile.' 
      },
      { 
        name: 'No Humanity… Only You and Damien', 
        cost: 3, 
        damage: 0, 
        specialTypes: ['movement'],
        targetType: 'adjacent-to-ally',
        conditionals: [
          { type: 'cardOnField', cardIds: ['crystal', 'damien', 'damien_prime'], requireAny: true }
        ],
        description: 'If Crystal, Damien, or Damien (Prime) is on the field, move Haydn adjacent to one of them.' 
      }
    ],
    attackDirections: ['up-right', 'down-right', 'right'],
  },
  {
    id: 'clark',
    name: 'Clark',
    cost: 3,
    hp: 6,
    class: 'Ascendance',
    image: 'IMG_3479.PNG',
    reactions: [
      {
        trigger: 'ally-killed',
        abilityName: `Never Again… I Swear`,
        directions: ['left', 'right']
      }
    ],
    attacks: [
      { 
        name: 'Right Hook', 
        cost: 1, 
        damage: 1 
      },
      { 
        name: 'Headshot', 
        cost: 2, 
        damage: 3 
      },
      { 
        name: `Never Again… I Swear`, 
        cost: 3, 
        damage: 0, 
        specialTypes: ['cancel-attack'],
        reaction: {
          trigger: 'ally-killed',
          directions: ['left', 'right']
        },
        description: `If a friendly card to Clark's left or right would be killed, Clark intervenes.` 
      }
    ],
    attackDirections: ['up-left', 'up-right'],
  },
  {
    id: 'damien_disabled',
    name: 'Damien (Disabled)',
    cost: 'T',
    hp: 1,
    class: 'Ascendance',
    image: 'IMG_3528.JPG',
    attacks: [
      { 
        name: 'Mind Read', 
        cost: 2, 
        damage: 0, 
        specialTypes: ['opponent-hand-reveal'],
        targetType: 'none',
        description: `Look at all cards in opponent's hand.` 
      },
      { 
        name: 'Electrocution', 
        cost: 5, 
        damage: 4 
      },
      { 
        name: 'Teleportation', 
        cost: 5, 
        damage: 0, 
        specialTypes: ['movement'],
        targetType: 'random-tile',
        range: 'board',
        dieType: 'd20',
        description: `Teleport to a random empty tile determined by a D20 roll.` 
      }
    ],
    attackDirections: ['up'],
  },
  {
    id: 'clark_enhanced',
    name: 'Clark (Enhanced)',
    cost: 'T',
    hp: 9,
    class: 'Ascendance',
    image: 'IMG_4063.PNG',
    reactions: [
      {
        trigger: 'target-of-attack',
        abilityName: 'Metallic X Shield',
        conditionals: [
          { type: 'attackDamageBelow', value: 3 }
        ]
      }
    ],
    attacks: [
      { 
        name: 'Metallic Right Hook', 
        cost: 1, 
        damage: 2 
      },
      { 
        name: 'Double Arm Slam', 
        cost: 2, 
        damage: 3 
      },
      { 
        name: 'Metallic X Shield', 
        cost: 2, 
        damage: 0, 
        specialTypes: ['cancel-attack'],
        reaction: {
          trigger: 'target-of-attack'
        },
        conditionals: [
          { type: 'attackDamageBelow', value: 3 }
        ],
        description: `Block an incoming attack dealing 3 damage or less.` 
      },
      { 
        name: `They're Dead! Because of You!`, 
        cost: 3, 
        damage: 0, 
        specialTypes: ['mark', 'damage-buff'],
        range: 1,
        damageBonus: 3,
        duration: 'permanent',
        targetType: 'single-enemy',
        description: `Choose an enemy. All Clark's attacks deal +3 damage to them.` 
      }
    ],
    attackDirections: ['up-left', 'up-right', 'right'],
  },
  {
    id: 'donald',
    name: 'Donald',
    cost: 3,
    hp: 3,
    class: 'Ascendance',
    image: 'IMG_4469.JPG',
    attacks: [
      { 
        name: 'Sonic Screech', 
        cost: 3, 
        damage: 1, 
        specialTypes: ['no-abilities', 'no-movement', 'multi-target'],
        targetType: 'all-in-directions',
        affectsFriendly: true,
        duration: 1,
        description: `Immobilize all friendly and enemy cards in applicable directions for one turn.` 
      }
    ],
    attackDirections: ['up-left', 'up', 'up-right'],
  },
  {
    id: 'cormac',
    name: 'Cormac',
    cost: 4,
    hp: 3,
    class: 'Ascendance',
    image: 'IMG_5622.PNG',
    reactions: [
      {
        trigger: 'target-of-attack',
        abilityName: 'Too Slow, Pussy'
      },
      {
        trigger: 'on-ally-attack',
        abilityName: 'Tag Team This Loser',
        conditionals: [
          { type: 'cardAdjacent', cardId: 'luther' }
        ]
      }
    ],
    attacks: [
      { 
        name: 'Fist Barrage', 
        cost: 1, 
        damage: 2 
      },
      { 
        name: 'Too Slow, Pussy', 
        cost: 1, 
        damage: 0, 
        specialTypes: ['cancel-attack'],
        reaction: {
          trigger: 'target-of-attack'
        },
        description: `Dodge an enemy's attack.` 
      },
      { 
        name: 'Tag Team This Loser', 
        cost: 1, 
        damage: 2, 
        specialTypes: ['combo'],
        reaction: {
          trigger: 'on-ally-attack'
        },
        conditionals: [
          { type: 'cardAdjacent', cardId: 'luther' },
          { type: 'allyDealtDamage', cardId: 'luther' }
        ],
        description: `If Luther damages an adjacent enemy, Cormac may deal +2 damage.` 
      },
      { 
        name: 'Ask Me What My 0–60 Is', 
        cost: 2, 
        damage: 0, 
        specialTypes: ['movement'],
        targetType: 'adjacent-in-directions',
        description: `Move to any adjacent tile in applicable directions.` 
      }
    ],
    attackDirections: ['up-left', 'up-right', 'down-right', 'down-left'],
  },
  {
    id: 'haydn_prime',
    name: 'Haydn (Prime)',
    cost: 'T',
    hp: 10,
    class: 'Ascendance',
    image: 'IMG_6108.PNG',
    attacks: [
      { 
        name: 'Fireball', 
        cost: 2, 
        damage: 2, 
        range: 2, 
        description: `Deal 2 damage up to 2 tiles away in applicable directions.` 
      },
      { 
        name: 'Flamethrower', 
        cost: 2, 
        damage: 3 
      },
      { 
        name: 'Radiating Heal', 
        cost: 3, 
        damage: 0, 
        specialTypes: ['heal'],
        healAmount: 3,
        targetType: 'self-or-adjacent-ally',
        description: `Heal 3 health to Haydn himself or a friendly card adjacent to Haydn.` 
      },
      { 
        name: `I'm Gonna Burn You Alive`, 
        cost: 5, 
        damage: 0, 
        specialTypes: ['damage-over-time', 'burn'],
        range: 1,
        dotPattern: [1, 2, 2, 2],
        dotDuration: 'until-death',
        description: `Burn an enemy card. First turn cycle deals 1 damage, each subsequent cycle deals 2 damage until the card dies.` 
      }
    ],
    attackDirections: ['up-right', 'right', 'down-right'],
  },
  {
    id: 'luna',
    name: 'Luna',
    cost: 1,
    hp: 2,
    class: 'Ascendance',
    image: 'IMG_6532.PNG',
    attacks: [
      { 
        name: 'Magnetic Pull', 
        cost: 5, 
        damage: 0, 
        specialTypes: ['displacement', 'multi-target'],
        range: 2,
        targetType: 'all-at-range',
        pullTowards: 'self',
        pullDistance: 1,
        conditionals: [
          { type: 'targetTileEmpty', tile: 'adjacent' }
        ],
        description: 'Pull every card 2 tiles away into the adjacent tile toward Luna, if that tile is empty.' 
      }
    ],
    attackDirections: [],
  },
  // Add more cards below as they are reviewed
];

// Special Type definitions for reference
export const SPECIAL_TYPES = {
  'control': 'Take control of enemy card',
  'removal': 'Instant kill / execute effects',
  'heal': 'Restore HP',
  'displacement': 'Move enemy to different tile',
  'opponent-deck-reveal': 'Peek/manipulate opponent\'s deck',
  'self-deck-reveal': 'Peek at your own deck',
  'opponent-hand-reveal': 'Look at opponent\'s hand',
  'movement': 'Move self to different tile',
  'no-abilities': 'Prevent target from using abilities',
  'multi-target': 'Affects multiple targets',
  'damage-buff': 'Increase damage output',
  'damage-over-time': 'Deals damage over multiple turns',
  'character-placement-discount': 'Reduce or negate placement cost',
  'cancel-attack': 'Block/dodge incoming attack',
  'vulnerability': 'Target takes increased damage',
  'damage-debuff': 'Reduce target\'s damage output',
  'endure-on-one': 'Survive lethal damage',
  'ignore-reaction': 'Bypass reaction abilities',
  'rival': 'Special interaction with specific enemy card',
  'summon-structure': 'Create a structure on the board',
  'no-movement': 'Prevent target from moving',
  'knockback': 'Push target away',
  'trap': 'Lock target in a state',
  'zone-control': 'Control a tile or area',
  'combo': 'Requires ally action to trigger',
  'mark': 'Mark target for bonus effects',
  'burn': 'Fire damage over time'
};

// Reaction trigger definitions for reference
export const REACTION_TRIGGERS = {
  'target-of-attack': 'When this card is targeted by an attack',
  'adjacent-placement': 'When a card is placed adjacent to this one',
  'ally-attacked': 'When an adjacent ally is attacked',
  'ally-killed': 'When an adjacent ally would be killed',
  'on-death': 'When this card would die',
  'on-ally-attack': 'When an ally attacks'
};

// Conditional type definitions for reference
export const CONDITIONAL_TYPES = {
  'cardOnField': 'Specific card must be on the field',
  'targetHealthBelow': 'Target must have HP at or below threshold',
  'targetHealthAbove': 'Target must have HP above threshold',
  'attackDamageBelow': 'Incoming attack must deal damage at or below threshold',
  'attackDamageAbove': 'Incoming attack must deal damage above threshold',
  'cardInHand': 'Specific card must be in hand',
  'cardAdjacent': 'Specific card must be adjacent',
  'oncePerGame': 'Can only be used once per game',
  'oncePerTarget': 'Can only be used once per target',
  'allyDealtDamage': 'Ally must have dealt damage',
  'targetTileEmpty': 'Target tile must be empty',
  'triggerCondition': 'Custom trigger condition',
  'minimumCharactersOnBoard': 'Requires minimum number of friendly and enemy characters on board'
};

// Helper to get a card by ID
export const getCardById = (id) => SCOTT_CARDS.find(card => card.id === id);

// Helper to get all cards of a specific class
export const getCardsByClass = (className) => SCOTT_CARDS.filter(card => card.class === className);

// Helper to get all cards with a specific special type
export const getCardsBySpecialType = (specialType) => SCOTT_CARDS.filter(card => 
  card.attacks.some(attack => attack.specialTypes?.includes(specialType))
);

// Helper to get all cards with reaction abilities
export const getCardsWithReactions = () => SCOTT_CARDS.filter(card => 
  card.reactions && card.reactions.length > 0
);

// Helper to get cards that can react to a specific trigger
export const getCardsByReactionTrigger = (trigger) => SCOTT_CARDS.filter(card => 
  card.reactions?.some(reaction => reaction.trigger === trigger)
);

// Export count for reference
export const TOTAL_SCOTT_CARDS = SCOTT_CARDS.length;
