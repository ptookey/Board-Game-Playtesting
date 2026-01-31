import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Alert,
  Stack,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import {
  EnergyIcon,
  HeartIcon,
  TowerIcon,
  DamageIcon,
  BattleIcon,
  GameIcon,
  TrophyIcon,
  InlineIcon,
  Player1Icon,
  Player2Icon,
} from './icons/GameIcons';
import CharacterCard from './CharacterCard';
import PhaseAnnouncement from './PhaseAnnouncement';
import PlayerInfo from './PlayerInfo';
import BoardCell from './BoardCell';
import EnergyCard from './EnergyCard';
import AttackPanel from './AttackPanel';
import CheatPanel from './CheatPanel';
import {
  GRID_SIZE,
  STARTING_HAND_SIZE,
  BASE_ENERGY_REGEN,
  TOWER_HP,
  DIRECTION_OFFSETS,
  PLAYER_CONFIG,
} from '../config/gameConfig';
import {
  ABILITY_FLOW_STATES,
  createAbilityFlowState,
  initiateAbilityFlow,
  selectTarget,
  handleReactionDecision,
  processDisplacementSelection,
  executeAbility,
  cancelAbilityFlow,
  canCharacterAct,
  tickStatusEffects as tickEffects,
  processDotEffects,
  calculateDamage as calcDamage,
  formatDamageMessage,
  getAvailableReactions,
  addStatusEffect as addEffect,
  getPlacementReactions,
  executePlacementReaction,
} from '../systems/combatSystem';
import { generateDeck, drawCards } from '../utils/deckUtils';

export default function GameBoard() {
  const [currentPlayer, setCurrentPlayer] = useState(1);
  const [gamePhase, setGamePhase] = useState('setup'); // setup, towering, playing, ended
  const [turnCount, setTurnCount] = useState({ 1: 0, 2: 0 });
  const [hoveredCell, setHoveredCell] = useState(null); // { row, col } for tower preview
  const [announcement, setAnnouncement] = useState(null); // { type, text, subtext, player }
  const [delayedReturns, setDelayedReturns] = useState([]); // Characters removed that will return later

  const [board, setBoard] = useState(
    Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  );

  const [player1, setPlayer1] = useState({
    deck: [],
    hand: [],
    towersPlacedThisTurn: 0,
    towersPlacedTotal: 0,
    energy: PLAYER_CONFIG[1].startingEnergy,
  });

  const [player2, setPlayer2] = useState({
    deck: [],
    hand: [],
    towersPlacedThisTurn: 0,
    towersPlacedTotal: 0,
    energy: PLAYER_CONFIG[2].startingEnergy,
  });

  const [selectedCard, setSelectedCard] = useState(null);
  const [message, setMessage] = useState('Click "Start Game" to begin!');
  const [placingTower, setPlacingTower] = useState(false);
  const [selectedBoardCharacter, setSelectedBoardCharacter] = useState(null);
  const [selectedDirection, setSelectedDirection] = useState(null);
  const [selectedAttack, setSelectedAttack] = useState(null);
  const [winner, setWinner] = useState(null);

  // Ability flow state for handling reactions
  const [abilityFlow, setAbilityFlow] = useState(createAbilityFlowState());
  const [showReactionPrompt, setShowReactionPrompt] = useState(false);

  // Placement reaction state
  const [pendingPlacementReactions, setPendingPlacementReactions] = useState([]);
  const [showPlacementReactionModal, setShowPlacementReactionModal] = useState(false);

  // Brainwash / controlled character state
  const [controlledCharacter, setControlledCharacter] = useState(null); // { character, position, originalOwner, controlledBy, freeAbilityUsed }

  // Escape roll state for trapped characters
  const [escapeRollState, setEscapeRollState] = useState(null); // { character, position, escapeCondition, rollResult, escaped, pendingRolls: [] }

  // Cheat mode state
  const [cheatModeEnabled, setCheatModeEnabled] = useState(false);
  const [infiniteEnergy, setInfiniteEnergy] = useState(false);
  const [cheatCardToPlace, setCheatCardToPlace] = useState(null); // { card, player }

  // Deck peek state for abilities like Cheese Radar
  const [deckPeekState, setDeckPeekState] = useState(null); // { cards: [], player: 'opponent' | 'self', canReorder: boolean }

  // Hand reveal state for abilities like Mind Read
  const [handRevealState, setHandRevealState] = useState(null); // { cards: [], targetPlayer: number }

  // Displacement destination selection state (for abilities like Rotten Green Cheese)
  const [displacementState, setDisplacementState] = useState(null); // { targetRow, targetCol, attack, attackIndex, flowState }

  // Placement discount state (for abilities like We Best Have an Agreement)
  const [placementDiscount, setPlacementDiscount] = useState(null); // { amount: 'full' | number, validCards: string[], fromAbility: string }

  // Cell selection state (for abilities like Teleportation Slam that target any cell)
  const [cellSelectionState, setCellSelectionState] = useState(null); // { attack, attackIndex, flowState, targetType }

  // Active traps state (for abilities like Take the Bait)
  // Array of { trapId, player, casterPosition, friendlyTarget: {row, col, cardId}, enemyTarget: {row, col, cardId}, abilityName }
  const [activeTraps, setActiveTraps] = useState([]);

  // Dual selection state (for abilities that require selecting two targets like Take the Bait)
  // { attack, attackIndex, flowState, config, phase: 'first' | 'second', firstSelection: null | {row, col} }
  const [dualSelectionState, setDualSelectionState] = useState(null);

  // Trap triggered reaction state (for when a bait trap is triggered and player can summon)
  // { trap, attacker: {row, col}, freeSummonCards: [], adjacentTiles: [] }
  const [trapTriggeredState, setTrapTriggeredState] = useState(null);

  // Trap summon selection state (two-step: select card, then tile)
  const [trapSummonSelection, setTrapSummonSelection] = useState(null); // { card, phase: 'selectCard' | 'selectTile' }

  // Sync selectedBoardCharacter with board state when board changes
  // This ensures usedAttacks and other properties stay up-to-date
  useEffect(() => {
    if (selectedBoardCharacter) {
      const { row, col } = selectedBoardCharacter;
      const currentCell = board[row]?.[col];
      if (currentCell && currentCell.type === 'character') {
        // Update selectedBoardCharacter with current board state
        setSelectedBoardCharacter(prev => ({ ...currentCell, row, col }));
      } else {
        // Character no longer exists at this position (killed, moved, etc.)
        setSelectedBoardCharacter(null);
      }
    }
  }, [board]);

  const startGame = () => {
    const deck1 = generateDeck();
    const deck2 = generateDeck();

    const { drawn: hand1, remaining: remaining1 } = drawCards(deck1, STARTING_HAND_SIZE);
    const { drawn: hand2, remaining: remaining2 } = drawCards(deck2, STARTING_HAND_SIZE);

    setPlayer1({
      deck: remaining1,
      hand: hand1,
      towersPlacedThisTurn: 0,
      towersPlacedTotal: 0,
      energy: PLAYER_CONFIG[1].startingEnergy,
    });
    setPlayer2({
      deck: remaining2,
      hand: hand2,
      towersPlacedThisTurn: 0,
      towersPlacedTotal: 0,
      energy: PLAYER_CONFIG[2].startingEnergy,
    });
    setBoard(Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null)));
    setCurrentPlayer(1);
    setTurnCount({ 1: 1, 2: 0 });
    setGamePhase('towering'); // Start in towering phase
    setSelectedCard(null);
    setPlacingTower(false);
    setHoveredCell(null);
    setSelectedBoardCharacter(null);
    setSelectedDirection(null);
    setSelectedAttack(null);
    setWinner(null);
    setDelayedReturns([]); // Reset delayed returns
    setMessage('Player 1\'s turn - Place your tower! (1 tower this turn, 5 Energy)');

    // Show game start announcements
    setAnnouncement({ type: 'turn', text: 'PLAYER 1', subtext: 'Your turn begins!', player: 1 });
  };

  const getTowersAllowedThisTurn = (player, turn) => {
    const config = PLAYER_CONFIG[player].towersPerTurn;
    const turnIndex = turn - 1;
    if (turnIndex < config.length) {
      return config[turnIndex];
    }
    return 0;
  };

  const getCurrentPlayerState = () => currentPlayer === 1 ? player1 : player2;
  const setCurrentPlayerState = (state) => currentPlayer === 1 ? setPlayer1(state) : setPlayer2(state);

  // Helper to find trapped characters for a player
  const getTrappedCharactersForPlayer = (boardState, player) => {
    const trapped = [];
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const cell = boardState[row][col];
        if (cell && cell.player === player && cell.type === 'character') {
          const trappedEffect = cell.statusEffects?.find(e => e.type === 'trapped');
          if (trappedEffect) {
            trapped.push({
              character: cell,
              position: { row, col },
              escapeCondition: trappedEffect.escapeCondition || { rollBelow: 5, dieType: 'd6' }
            });
          }
        }
      }
    }
    return trapped;
  };

  // Process escape roll result
  const processEscapeRoll = (boardState, row, col, rollResult, escapeCondition) => {
    const escaped = rollResult < escapeCondition.rollBelow;
    let newBoard = boardState.map(r => [...r]);

    if (escaped) {
      // Remove trapped status effect
      const cell = newBoard[row][col];
      if (cell) {
        newBoard[row][col] = {
          ...cell,
          statusEffects: (cell.statusEffects || []).filter(e => e.type !== 'trapped')
        };
      }
    }

    return { board: newBoard, escaped };
  };

  const selectCard = (card, index) => {
    // Check if player can play cards this turn
    const canPlayCards = turnCount[currentPlayer] >= PLAYER_CONFIG[currentPlayer].canPlayCardsFromTurn;

    if (!canPlayCards) {
      setMessage('You cannot play cards yet - complete the towering phase first!');
      return;
    }

    if (gamePhase === 'towering') {
      setMessage('You must place all your towers first!');
      return;
    }
    if (gamePhase !== 'playing') return;

    const playerState = getCurrentPlayerState();
    const towersAllowed = getTowersAllowedThisTurn(currentPlayer, turnCount[currentPlayer]);

    if (playerState.towersPlacedThisTurn < towersAllowed) {
      setMessage(`You must place ${towersAllowed - playerState.towersPlacedThisTurn} more tower(s) first!`);
      return;
    }

    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
      setMessage('Card deselected.');
      return;
    }

    setSelectedCard({ ...card, handIndex: index });
    setPlacingTower(false);
    setSelectedDirection(null);
    setSelectedAttack(null);
    setSelectedBoardCharacter(null);

    if (card.type === 'Energy') {
      setMessage(`Selected ${card.name} (+${card.value} Energy). Click "Play Energy Card" to use it.`);
    } else {
      const canAfford = playerState.energy >= card.cost;
      setMessage(`Selected ${card.name} (${card.cost} Energy -> ${card.hp} HP). ${canAfford ? 'Click the board to summon.' : 'Not enough energy!'}`);
    }
  };

  const startPlacingTower = () => {
    const playerState = getCurrentPlayerState();
    const towersAllowed = getTowersAllowedThisTurn(currentPlayer, turnCount[currentPlayer]);

    if (playerState.towersPlacedThisTurn >= towersAllowed) {
      setMessage('You have placed all your towers for this turn!');
      return;
    }
    setPlacingTower(true);
    setSelectedCard(null);
    setSelectedDirection(null);
    setSelectedAttack(null);
    setSelectedBoardCharacter(null);
    setMessage(`Click an empty square to place your tower (${towersAllowed - playerState.towersPlacedThisTurn} remaining this turn).`);
  };

  // Cheat: Place any card on the board
  const handleCheatPlaceCard = (card, player, row, col) => {
    if (board[row][col] !== null) {
      setMessage('Cheat: That square is occupied!');
      return;
    }

    const newBoard = board.map(r => [...r]);
    const placedCard = {
      ...card,
      player: player,
      type: 'character',
      hp: card.hp,
      statusEffects: [],
      usedAttacks: [],
    };
    newBoard[row][col] = placedCard;

    // Check for placement reactions (like GamGam's Explosive Barrier)
    const placementReactions = getPlacementReactions(newBoard, row, col, placedCard);

    setBoard(newBoard);

    // If there are placement reactions, show the modal
    if (placementReactions.length > 0) {
      setPendingPlacementReactions(placementReactions);
      setShowPlacementReactionModal(true);
      setMessage(`Cheat: Placed ${card.name} for Player ${player}. ${placementReactions[0].reactingCard.name} can react!`);
    } else {
      setMessage(`Cheat: Placed ${card.name} for Player ${player} at (${row}, ${col})`);
    }
    setCheatCardToPlace(null);
  };

  const handleCellClick = (row, col) => {
    // Handle trap summon tile selection (e.g., Take the Bait - selecting where to summon)
    if (trapSummonSelection?.phase === 'selectTile') {
      handleTrapSummonTileSelect(row, col);
      return;
    }

    // Handle reaction displacement target selection (e.g., Luther's "Get Over Here")
    if (abilityFlow.state === ABILITY_FLOW_STATES.SELECTING_REACTION_DISPLACEMENT) {
      const validTargets = abilityFlow.pendingDisplacement?.validTargets || [];
      const isValidTarget = validTargets.some(t => t.row === row && t.col === col);

      if (!isValidTarget) {
        setMessage('Please select a valid empty tile adjacent to the attacker!');
        return;
      }

      const result = processDisplacementSelection(abilityFlow, { row, col });

      if (!result.success) {
        setMessage(result.error);
        return;
      }

      completeAbilityExecution(result.flowState);
      return;
    }

    // Handle displacement destination selection
    if (displacementState) {
      // Check if the clicked tile is empty
      if (board[row][col] !== null) {
        setMessage('Please select an EMPTY tile to displace the enemy to!');
        return;
      }

      // Execute the displacement with the chosen destination
      const { flowState, targetRow, targetCol, targetName } = displacementState;

      // Create updated flow state with displacement destination in context
      const contextWithDestination = {
        displacementDestination: { row, col }
      };

      // Execute ability with displacement destination
      const playerState = getCurrentPlayerState();
      const result = executeAbility(
        flowState,
        board,
        playerState.energy,
        getOpponentEnergy(),
        contextWithDestination
      );

      if (!result.success) {
        setMessage(result.error);
        setDisplacementState(null);
        setAbilityFlow(createAbilityFlowState());
        return;
      }

      // Update board and energy
      setBoard(result.board);
      setCurrentPlayerState({
        ...playerState,
        energy: infiniteEnergy ? playerState.energy : result.attackerEnergy,
      });
      setOpponentEnergy(infiniteEnergy ? getOpponentEnergy() : result.targetEnergy);

      setMessage(`${targetName} was sent to another dimension! ${result.messages.join(' ')}`);

      // Check for win condition
      const gameWinner = checkWinCondition(result.board);
      if (gameWinner) {
        setWinner(gameWinner);
        setGamePhase('ended');
        setMessage(`Player ${gameWinner} wins! All enemy towers destroyed!`);
        setAnnouncement({ type: 'turn', text: `PLAYER ${gameWinner} WINS!`, subtext: 'All enemy towers destroyed!', player: gameWinner });
      }

      // Clear displacement state
      setDisplacementState(null);
      setAbilityFlow(createAbilityFlowState());
      return;
    }

    // Handle dual selection for trap abilities (e.g., Take the Bait)
    if (dualSelectionState) {
      const { attack, config, phase, firstSelection, casterPosition } = dualSelectionState;
      const cell = board[row][col];

      if (phase === 'first') {
        // First selection - must be a friendly character
        if (config.first.type === 'friendly-character') {
          if (!cell || cell.type !== 'character' || cell.player !== currentPlayer) {
            setMessage('Please select a friendly character!');
            return;
          }

          // Store first selection and move to second phase
          setDualSelectionState({
            ...dualSelectionState,
            phase: 'second',
            firstSelection: { row, col, cardId: cell.id, cardName: cell.name }
          });
          setMessage(config.second.label);
        }
      } else if (phase === 'second') {
        // Second selection - must be an enemy character
        if (config.second.type === 'enemy-character') {
          if (!cell || cell.type !== 'character' || cell.player === currentPlayer) {
            setMessage('Please select an enemy character!');
            return;
          }

          // Both selections complete - create the trap
          const newTrap = {
            trapId: `trap-${Date.now()}`,
            player: currentPlayer,
            casterPosition,
            abilityName: attack.name,
            friendlyTarget: firstSelection,
            enemyTarget: { row, col, cardId: cell.id, cardName: cell.name },
            trapConfig: attack.trapConfig,
          };

          setActiveTraps(prev => [...prev, newTrap]);
          setDualSelectionState(null);
          setMessage(`Trap set! If ${cell.name} attacks ${firstSelection.cardName}, you may summon a character for free!`);
        }
      }
      return;
    }

    // Handle cell selection for board-wide targeting abilities (e.g., Teleportation Slam)
    if (cellSelectionState) {
      const { attack, attackIndex, flowState, targetType } = cellSelectionState;
      const cell = board[row][col];

      // Validate target based on targetType
      if (targetType === 'any-tile-with-enemy') {
        // Must click on an enemy character
        if (!cell || cell.owner === currentPlayer || cell.card?.type === 'tower') {
          setMessage('Please select an enemy character!');
          return;
        }
      } else if (targetType === 'any-empty-tile') {
        // Must click on an empty tile
        if (cell !== null) {
          setMessage('Please select an empty tile!');
          return;
        }
      }

      // Select target using the clicked position as direction (position object)
      const targetResult = selectTarget(
        flowState,
        board,
        { row, col }  // Pass position object as direction for board-wide targeting
      );

      if (!targetResult.success) {
        setMessage(targetResult.error);
        setCellSelectionState(null);
        setAbilityFlow(createAbilityFlowState());
        return;
      }

      // Clear cell selection state
      setCellSelectionState(null);

      // Check for pending reactions
      if (targetResult.flowState.state === ABILITY_FLOW_STATES.AWAITING_REACTION) {
        setAbilityFlow(targetResult.flowState);
        setMessage(`${targetResult.flowState.target.name} can react! Choose a reaction.`);
        return;
      }

      // Execute ability
      completeAbilityExecution(targetResult.flowState);
      return;
    }

    // Cheat mode: Place selected cheat card
    if (cheatModeEnabled && cheatCardToPlace) {
      handleCheatPlaceCard(cheatCardToPlace.card, cheatCardToPlace.player, row, col);
      return;
    }

    // Handle towering phase - direct placement on click
    if (gamePhase === 'towering') {
      if (board[row][col] !== null) {
        setMessage('That square is occupied!');
        return;
      }

      const playerState = getCurrentPlayerState();
      const towersAllowed = getTowersAllowedThisTurn(currentPlayer, turnCount[currentPlayer]);

      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = { player: currentPlayer, type: 'tower', hp: TOWER_HP };
      setBoard(newBoard);

      const newTowersPlacedThisTurn = playerState.towersPlacedThisTurn + 1;
      const newTowersPlacedTotal = playerState.towersPlacedTotal + 1;

      setCurrentPlayerState({
        ...playerState,
        towersPlacedThisTurn: newTowersPlacedThisTurn,
        towersPlacedTotal: newTowersPlacedTotal,
      });

      setHoveredCell(null);

      if (newTowersPlacedThisTurn < towersAllowed) {
        setMessage(`Tower placed! (${TOWER_HP} HP) Place ${towersAllowed - newTowersPlacedThisTurn} more tower(s).`);
      } else {
        // Check if player can play cards this turn
        const canPlayCards = turnCount[currentPlayer] >= PLAYER_CONFIG[currentPlayer].canPlayCardsFromTurn;

        if (canPlayCards) {
          // Draw a card if available
          if (playerState.deck.length > 0) {
            const { drawn, remaining } = drawCards(playerState.deck, 1);
            setCurrentPlayerState({
              ...playerState,
              deck: remaining,
              hand: [...playerState.hand, ...drawn],
              towersPlacedThisTurn: newTowersPlacedThisTurn,
              towersPlacedTotal: newTowersPlacedTotal,
            });
            setGamePhase('playing');
            setMessage(`All towers placed! Drew ${drawn[0].name}! Play cards or end turn.`);
            setAnnouncement({ type: 'playing', text: 'BATTLE PHASE', subtext: 'Play cards and attack!' });
          } else {
            setGamePhase('playing');
            setMessage(`All towers placed! Play cards or end turn.`);
            setAnnouncement({ type: 'playing', text: 'BATTLE PHASE', subtext: 'Play cards and attack!' });
          }
        } else {
          // Can't play cards yet - just end turn message
          setGamePhase('playing'); // Still set to playing so they can end turn
          setMessage(`All towers placed! End your turn.`);
          setAnnouncement({ type: 'turn', text: 'TOWERS PLACED', subtext: 'End your turn to continue!' });
        }
      }
      return;
    }

    if (gamePhase !== 'playing') return;

    if (board[row][col] !== null) {
      setMessage('That square is occupied!');
      return;
    }

    const playerState = getCurrentPlayerState();
    const towersAllowed = getTowersAllowedThisTurn(currentPlayer, turnCount[currentPlayer]);

    if (placingTower && playerState.towersPlacedThisTurn < towersAllowed) {
      const newBoard = board.map(r => [...r]);
      newBoard[row][col] = { player: currentPlayer, type: 'tower', hp: TOWER_HP };
      setBoard(newBoard);

      const newTowersPlacedThisTurn = playerState.towersPlacedThisTurn + 1;
      const newTowersPlacedTotal = playerState.towersPlacedTotal + 1;

      setCurrentPlayerState({
        ...playerState,
        towersPlacedThisTurn: newTowersPlacedThisTurn,
        towersPlacedTotal: newTowersPlacedTotal,
      });

      setPlacingTower(false);

      if (newTowersPlacedThisTurn < towersAllowed) {
        setMessage(`Tower placed! (${TOWER_HP} HP) Place ${towersAllowed - newTowersPlacedThisTurn} more tower(s).`);
      } else {
        setMessage(`Tower placed! (${TOWER_HP} HP) Play cards or end turn!`);
      }
      return;
    }

    if (!selectedCard) {
      setMessage('Select a card from your hand or place a tower!');
      return;
    }

    if (selectedCard.type === 'Character') {
      // Check if this card qualifies for free placement from an ability like "We Best Have an Agreement"
      const isDiscountedPlacement = placementDiscount &&
        placementDiscount.validCards &&
        placementDiscount.validCards.includes(selectedCard.id);

      const effectiveCost = isDiscountedPlacement && placementDiscount.amount === 'full'
        ? 0
        : (isDiscountedPlacement && typeof placementDiscount.amount === 'number'
          ? Math.max(0, selectedCard.cost - placementDiscount.amount)
          : selectedCard.cost);

      if (playerState.energy < effectiveCost) {
        setMessage(`Not enough energy! ${selectedCard.name} costs ${effectiveCost} Energy, you have ${playerState.energy} Energy.`);
        return;
      }

      const newBoard = board.map(r => [...r]);
      const placedCard = {
        player: currentPlayer,
        type: 'character',
        name: selectedCard.name,
        hp: selectedCard.hp,
        attacks: selectedCard.attacks,
        attackDirections: selectedCard.attackDirections,
        image: selectedCard.image,
        class: selectedCard.class,
        reactions: selectedCard.reactions,
        id: selectedCard.id,
        usedAttacks: [],
      };
      newBoard[row][col] = placedCard;

      // Check for placement reactions (like GamGam's Explosive Barrier)
      const placementReactions = getPlacementReactions(newBoard, row, col, placedCard);

      // Update board first
      setBoard(newBoard);

      const newHand = playerState.hand.filter((_, i) => i !== selectedCard.handIndex);
      const newEnergy = playerState.energy - effectiveCost;
      setCurrentPlayerState({
        ...playerState,
        hand: newHand,
        energy: newEnergy,
      });

      // Clear placement discount after use
      if (isDiscountedPlacement) {
        setPlacementDiscount(null);
      }

      // If there are placement reactions, show the modal
      if (placementReactions.length > 0) {
        setPendingPlacementReactions(placementReactions);
        setShowPlacementReactionModal(true);
        setMessage(`${selectedCard.name} summoned! ${placementReactions[0].reactingCard.name} can react!`);
      } else {
        const costMessage = isDiscountedPlacement ? 'FREE!' : `-${effectiveCost} Energy`;
        setMessage(`${selectedCard.name} summoned! (${selectedCard.hp} HP, ${costMessage})`);
      }
      setSelectedCard(null);
      return;
    }
  };

  const playEnergyCard = () => {
    if (!selectedCard || selectedCard.type !== 'Energy') return;

    const playerState = getCurrentPlayerState();
    const newHand = playerState.hand.filter((_, i) => i !== selectedCard.handIndex);
    const newEnergy = playerState.energy + selectedCard.value;
    setCurrentPlayerState({
      ...playerState,
      hand: newHand,
      energy: newEnergy,
    });
    setMessage(`+${selectedCard.value} Energy! You now have ${newEnergy} Energy.`);
    setSelectedCard(null);
  };

  const checkWinCondition = (boardState) => {
    let player1Towers = 0;
    let player2Towers = 0;

    for (let row of boardState) {
      for (let cell of row) {
        if (cell && cell.type === 'tower') {
          if (cell.player === 1) player1Towers++;
          else if (cell.player === 2) player2Towers++;
        }
      }
    }

    if (player1Towers === 0) return 2;
    if (player2Towers === 0) return 1;
    return null;
  };

  // Check if any "Take the Bait" style traps are triggered by an attack
  const checkBaitTraps = (attackerRow, attackerCol, targetRow, targetCol) => {
    const attackerCell = board[attackerRow]?.[attackerCol];
    const targetCell = board[targetRow]?.[targetCol];

    if (!attackerCell || !targetCell) return null;

    // Find any traps where:
    // - The attacker matches the trap's enemyTarget
    // - The target matches the trap's friendlyTarget
    for (const trap of activeTraps) {
      // Skip traps from the attacking player
      if (trap.player === attackerCell.player) continue;

      // Check if the attacker is the enemy we're watching
      const isMatchingAttacker =
        (trap.enemyTarget.row === attackerRow && trap.enemyTarget.col === attackerCol) ||
        (trap.enemyTarget.cardId === attackerCell.id);

      // Check if the target is the friendly we set as bait
      const isMatchingTarget =
        (trap.friendlyTarget.row === targetRow && trap.friendlyTarget.col === targetCol) ||
        (trap.friendlyTarget.cardId === targetCell.id);

      if (isMatchingAttacker && isMatchingTarget) {
        return trap;
      }
    }

    return null;
  };

  // Get adjacent empty tiles to a position
  const getAdjacentEmptyTiles = (row, col, boardState) => {
    const emptyTiles = [];
    const directions = ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'];

    for (const dir of directions) {
      const offset = DIRECTION_OFFSETS[dir];
      if (!offset) continue;

      const newRow = row + offset.row;
      const newCol = col + offset.col;

      if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
        if (boardState[newRow][newCol] === null) {
          emptyTiles.push({ row: newRow, col: newCol });
        }
      }
    }

    return emptyTiles;
  };

  // Get character cards from player's hand
  const getCharacterCardsFromHand = (player) => {
    const hand = player === 1 ? player1.hand : player2.hand;
    return hand.filter(card => card.type === 'Character');
  };

  // Get the opponent's energy
  const getOpponentEnergy = () => {
    return currentPlayer === 1 ? player2.energy : player1.energy;
  };

  const setOpponentEnergy = (energy) => {
    if (currentPlayer === 1) {
      setPlayer2(prev => ({ ...prev, energy }));
    } else {
      setPlayer1(prev => ({ ...prev, energy }));
    }
  };

  // Initiate an attack - this starts the ability flow
  const executeAttack = (attack, attackIndex) => {
    if (!selectedBoardCharacter) return;

    // Check if this is a brainwashed character
    const isControlledCharacter = controlledCharacter &&
      controlledCharacter.position.row === selectedBoardCharacter.row &&
      controlledCharacter.position.col === selectedBoardCharacter.col;

    if (selectedBoardCharacter.player !== currentPlayer && !isControlledCharacter) {
      setMessage("You can only attack with your own characters!");
      return;
    }

    // Check if controlled character already used their free ability
    if (isControlledCharacter && controlledCharacter.freeAbilityUsed) {
      // After free ability, they can still use paid abilities
      // But need to check energy cost
    }

    const charOnBoard = board[selectedBoardCharacter.row][selectedBoardCharacter.col];

    // Check if character can act (not stunned/paralyzed)
    if (!canCharacterAct(charOnBoard)) {
      setMessage(`${charOnBoard.name} cannot act due to a status effect!`);
      return;
    }

    if (charOnBoard.usedAttacks && charOnBoard.usedAttacks.includes(attackIndex)) {
      setMessage(`${attack.name} has already been used!`);
      return;
    }

    const playerState = getCurrentPlayerState();

    // Determine if this is a free ability (brainwash first use or infinite energy)
    const isFreeFromBrainwash = isControlledCharacter && !controlledCharacter.freeAbilityUsed;
    const effectiveCost = (infiniteEnergy || isFreeFromBrainwash) ? 0 : attack.cost;

    if (!infiniteEnergy && !isFreeFromBrainwash && playerState.energy < attack.cost) {
      setMessage(`Not enough energy for ${attack.name}! Need ${attack.cost} Energy`);
      return;
    }

    // Handle dual-selection abilities (e.g., Take the Bait - select friendly then enemy)
    if (attack.targetType === 'dual-selection' && attack.dualSelectionConfig) {
      // Check if there are enough valid targets
      const friendlyChars = [];
      const enemyChars = [];

      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const cell = board[row][col];
          if (cell && cell.type === 'character') {
            if (cell.player === currentPlayer) {
              friendlyChars.push({ row, col, cell });
            } else {
              enemyChars.push({ row, col, cell });
            }
          }
        }
      }

      if (friendlyChars.length < 1 || enemyChars.length < 1) {
        setMessage('Need at least one friendly and one enemy character on the board!');
        return;
      }

      // Deduct energy upfront
      if (!infiniteEnergy && !isFreeFromBrainwash) {
        setCurrentPlayerState({
          ...playerState,
          energy: playerState.energy - attack.cost,
        });
      }

      // Mark the ability as used
      const charOnBoardUpdated = board[selectedBoardCharacter.row][selectedBoardCharacter.col];
      const newBoard = board.map(r => [...r]);
      newBoard[selectedBoardCharacter.row][selectedBoardCharacter.col] = {
        ...charOnBoardUpdated,
        usedAttacks: [...(charOnBoardUpdated.usedAttacks || []), attackIndex]
      };
      setBoard(newBoard);

      // Start dual selection flow
      setDualSelectionState({
        attack,
        attackIndex,
        casterPosition: { row: selectedBoardCharacter.row, col: selectedBoardCharacter.col },
        config: attack.dualSelectionConfig,
        phase: 'first',
        firstSelection: null,
      });

      setMessage(attack.dualSelectionConfig.first.label);
      setSelectedBoardCharacter(null);
      setSelectedDirection(null);
      setSelectedAttack(null);
      return;
    }

    // Handle abilities that require cell selection (e.g., Teleportation Slam)
    if (attack.requiresCellSelection) {
      // Determine controlledBy for brainwashed characters
      const controlledByPlayer = isControlledCharacter ? currentPlayer : null;

      // Start the ability flow
      const initResult = initiateAbilityFlow(
        board,
        selectedBoardCharacter.row,
        selectedBoardCharacter.col,
        attack,
        attackIndex,
        controlledByPlayer
      );

      if (!initResult.success) {
        setMessage(initResult.error);
        return;
      }

      // Set up cell selection state - player needs to click on a valid target
      setCellSelectionState({
        attack,
        attackIndex,
        flowState: initResult.flowState,
        targetType: attack.targetType,
      });

      const targetDesc = attack.targetType === 'any-tile-with-enemy' ? 'an enemy' : 'an empty tile';
      setMessage(`Click on ${targetDesc} anywhere on the board!`);
      return;
    }

    // Handle abilities that don't need a direction (self-buffs, deck reveal, etc.)
    if (!attack.requiresDirection) {
      // Determine controlledBy for brainwashed characters
      const controlledByPlayer = isControlledCharacter ? currentPlayer : null;

      // Start the ability flow (even for no-direction abilities, to handle special effects)
      const initResult = initiateAbilityFlow(
        board,
        selectedBoardCharacter.row,
        selectedBoardCharacter.col,
        attack,
        attackIndex,
        controlledByPlayer
      );

      if (!initResult.success) {
        setMessage(initResult.error);
        return;
      }

      // For no-direction abilities, immediately select target (which handles targetType: 'none' and 'self')
      const targetResult = selectTarget(
        initResult.flowState,
        board,
        null, // No direction needed
        getOpponentEnergy(),
        { playerHand: playerState.hand }
      );

      if (!targetResult.success) {
        setMessage(targetResult.error);
        return;
      }

      // Execute the ability through the normal flow
      completeAbilityExecution(targetResult.flowState);
      return;
    }

    if (!selectedDirection) return;

    // Determine controlledBy for brainwashed characters
    const controlledByPlayer = isControlledCharacter ? currentPlayer : null;

    // Start the ability flow
    const initResult = initiateAbilityFlow(
      board,
      selectedBoardCharacter.row,
      selectedBoardCharacter.col,
      attack,
      attackIndex,
      controlledByPlayer
    );

    if (!initResult.success) {
      setMessage(initResult.error);
      return;
    }

    // Select the target
    const targetResult = selectTarget(
      initResult.flowState,
      board,
      selectedDirection,
      getOpponentEnergy(),
      { playerHand: playerState.hand }
    );

    if (!targetResult.success) {
      setMessage(targetResult.error);
      return;
    }

    // Check if any bait traps are triggered by this attack
    if (targetResult.flowState.target?.character && activeTraps.length > 0) {
      const triggeredTrap = checkBaitTraps(
        selectedBoardCharacter.row,
        selectedBoardCharacter.col,
        targetResult.flowState.target.row,
        targetResult.flowState.target.col
      );

      if (triggeredTrap) {
        // Trap triggered! Give the trap owner a chance to summon
        const adjacentTiles = getAdjacentEmptyTiles(
          selectedBoardCharacter.row,
          selectedBoardCharacter.col,
          board
        );
        const summonableCards = getCharacterCardsFromHand(triggeredTrap.player);

        if (summonableCards.length > 0 && adjacentTiles.length > 0) {
          // Store the pending attack flow and show trap reaction prompt
          setAbilityFlow(targetResult.flowState);
          setTrapTriggeredState({
            trap: triggeredTrap,
            attackerPosition: { row: selectedBoardCharacter.row, col: selectedBoardCharacter.col },
            pendingFlowState: targetResult.flowState,
            freeSummonCards: summonableCards,
            adjacentTiles,
          });
          setMessage(`TRAP TRIGGERED! ${triggeredTrap.abilityName} activates! Player ${triggeredTrap.player} may summon a character for free!`);
          return;
        } else {
          // Remove the trap since it triggered but couldn't be used (no cards or no space)
          setActiveTraps(prev => prev.filter(t => t.trapId !== triggeredTrap.trapId));
          if (summonableCards.length === 0) {
            setMessage(`Trap triggered but no character cards in hand to summon!`);
          } else {
            setMessage(`Trap triggered but no adjacent tiles available!`);
          }
        }
      }
    }

    // Check if target has reactions
    if (targetResult.hasReaction && targetResult.flowState.state === ABILITY_FLOW_STATES.AWAITING_REACTION) {
      // Show reaction prompt to opponent
      setAbilityFlow(targetResult.flowState);
      setShowReactionPrompt(true);
      setMessage(`${targetResult.flowState.target.character.name} can react! Waiting for Player ${currentPlayer === 1 ? 2 : 1}'s decision...`);
      return;
    }

    // Check if this is a displacement ability that requires destination selection
    if (attack.requiresDisplacementDestination && targetResult.flowState.target?.character) {
      setDisplacementState({
        targetRow: targetResult.flowState.target.row,
        targetCol: targetResult.flowState.target.col,
        targetName: targetResult.flowState.target.character.name,
        attack,
        attackIndex,
        flowState: targetResult.flowState,
      });
      setMessage(`Select an empty tile to send ${targetResult.flowState.target.character.name} to!`);
      // Clear selections but keep the flow going
      setSelectedDirection(null);
      setSelectedAttack(null);
      setSelectedBoardCharacter(null);
      return;
    }

    // No reactions available - execute immediately
    completeAbilityExecution(targetResult.flowState);
  };

  // Handle reaction decision from opponent
  const handleReaction = (decision, selectedReaction = null) => {
    const result = handleReactionDecision(abilityFlow, decision, selectedReaction, board);

    if (!result.success) {
      setMessage(result.error);
      return;
    }

    setShowReactionPrompt(false);

    // Check if we need to select a displacement target
    if (result.flowState.state === ABILITY_FLOW_STATES.SELECTING_REACTION_DISPLACEMENT) {
      setAbilityFlow(result.flowState);
      setMessage(`Select where to displace ${result.flowState.pendingDisplacement?.cardToDisplace?.character?.name}!`);
      return;
    }

    completeAbilityExecution(result.flowState);
  };

  // Handle placement reaction decision (e.g., GamGam's Explosive Barrier)
  const handlePlacementReaction = (decision, selectedReaction = null) => {
    if (decision === 'skip') {
      // Player chose not to use any reaction
      setShowPlacementReactionModal(false);
      setPendingPlacementReactions([]);
      setMessage('Placement reaction skipped.');
      return;
    }

    if (decision === 'use' && selectedReaction) {
      // Execute the selected placement reaction
      const result = executePlacementReaction(board, selectedReaction);

      setBoard(result.board);
      setShowPlacementReactionModal(false);
      setPendingPlacementReactions([]);

      if (result.messages.length > 0) {
        setMessage(result.messages.join(' '));
      }

      // Check for win condition after reaction
      const gameWinner = checkWinCondition(result.board);
      if (gameWinner) {
        setWinner(gameWinner);
        setGamePhase('ended');
        setMessage(`Player ${gameWinner} wins! All enemy towers destroyed!`);
        setAnnouncement({ type: 'turn', text: `PLAYER ${gameWinner} WINS!`, subtext: 'All enemy towers destroyed!', player: gameWinner });
      }
    }
  };

  // Handle trap triggered reaction (e.g., Take the Bait free summon)
  const handleTrapReaction = (decision, selectedCard = null, selectedTile = null) => {
    if (!trapTriggeredState) return;

    const { trap, pendingFlowState } = trapTriggeredState;

    if (decision === 'skip') {
      // Player chose not to use the trap reaction
      // Remove the trap (it was triggered, one-time use)
      setActiveTraps(prev => prev.filter(t => t.trapId !== trap.trapId));
      setTrapTriggeredState(null);
      setMessage('Trap reaction skipped.');

      // Continue with the original attack
      continueAttackAfterTrap(pendingFlowState);
      return;
    }

    if (decision === 'use' && selectedCard && selectedTile) {
      // Summon the character for free adjacent to the attacker
      const newBoard = board.map(r => [...r]);

      // Place the summoned character
      newBoard[selectedTile.row][selectedTile.col] = {
        ...selectedCard,
        player: trap.player,
        type: 'character',
        id: selectedCard.id,
        name: selectedCard.name,
        hp: selectedCard.hp,
        attacks: selectedCard.attacks,
        attackDirections: selectedCard.attackDirections,
        class: selectedCard.class,
        reactions: selectedCard.reactions,
        statusEffects: [],
        usedAttacks: [],
      };

      setBoard(newBoard);

      // Remove card from player's hand
      const playerHand = trap.player === 1 ? player1.hand : player2.hand;
      const newHand = playerHand.filter(c => c.id !== selectedCard.id || c !== selectedCard);

      if (trap.player === 1) {
        setPlayer1(prev => ({ ...prev, hand: newHand }));
      } else {
        setPlayer2(prev => ({ ...prev, hand: newHand }));
      }

      // Remove the trap (it was used)
      setActiveTraps(prev => prev.filter(t => t.trapId !== trap.trapId));
      setTrapTriggeredState(null);

      setMessage(`${selectedCard.name} summoned for FREE via ${trap.abilityName}!`);

      // Continue with the original attack (with updated board)
      continueAttackAfterTrap(pendingFlowState, newBoard);
    }
  };

  // Handle selecting a card to summon from trap
  const handleTrapSummonCardSelect = (card) => {
    if (!trapTriggeredState) return;
    setTrapSummonSelection({ card, phase: 'selectTile' });
    setMessage(`Select an adjacent tile to summon ${card.name}!`);
  };

  // Handle selecting a tile to summon the trapped card to
  const handleTrapSummonTileSelect = (row, col) => {
    if (!trapTriggeredState || !trapSummonSelection?.card) return;

    const validTiles = trapTriggeredState.adjacentTiles;
    const isValid = validTiles.some(t => t.row === row && t.col === col);

    if (!isValid) {
      setMessage('Please select a valid adjacent tile!');
      return;
    }

    handleTrapReaction('use', trapSummonSelection.card, { row, col });
    setTrapSummonSelection(null);
  };

  // Continue attack execution after trap reaction
  const continueAttackAfterTrap = (flowState, updatedBoard = null) => {
    const boardToUse = updatedBoard || board;

    // Update flowState with possibly new board
    const updatedFlowState = {
      ...flowState,
    };

    // Check if target has reactions
    if (flowState.availableReactions?.length > 0 && flowState.state === ABILITY_FLOW_STATES.AWAITING_REACTION) {
      setAbilityFlow(updatedFlowState);
      setShowReactionPrompt(true);
      setMessage(`${flowState.target.character.name} can react! Waiting for Player ${currentPlayer === 1 ? 2 : 1}'s decision...`);
      return;
    }

    // Execute the ability
    completeAbilityExecution(updatedFlowState);
  };

  // Handle escape roll for trapped characters
  const handleEscapeRoll = () => {
    if (!escapeRollState) return;

    const { escapeCondition } = escapeRollState;

    // Roll the die (d6 = 1-6)
    const dieMax = escapeCondition.dieType === 'd6' ? 6 : escapeCondition.dieType === 'd20' ? 20 : 6;
    const rollResult = Math.floor(Math.random() * dieMax) + 1;
    const escaped = rollResult < escapeCondition.rollBelow;

    setEscapeRollState(prev => ({
      ...prev,
      rollResult,
      escaped,
    }));
  };

  // Continue after escape roll result
  const handleEscapeRollContinue = () => {
    if (!escapeRollState) return;

    const { position, escaped, pendingRolls, pendingBoard } = escapeRollState;

    // Apply the result to the board
    const { board: updatedBoard } = processEscapeRoll(
      pendingBoard || board,
      position.row,
      position.col,
      escapeRollState.rollResult,
      escapeRollState.escapeCondition
    );

    // Check if there are more trapped characters to roll for
    if (pendingRolls && pendingRolls.length > 0) {
      const [next, ...remaining] = pendingRolls;
      setEscapeRollState({
        character: next.character,
        position: next.position,
        escapeCondition: next.escapeCondition,
        rollResult: null,
        escaped: null,
        pendingRolls: remaining,
        pendingBoard: updatedBoard,
      });
    } else {
      // All done, update board and close modal
      setBoard(updatedBoard);
      setEscapeRollState(null);

      // Show message about escape results
      if (escaped) {
        setMessage(prev => `${prev} ${escapeRollState.character.name} escaped from the other dimension!`);
      } else {
        setMessage(prev => `${prev} ${escapeRollState.character.name} remains trapped in the other dimension!`);
      }
    }
  };

  // Handle deck peek decision (leave at top or move to bottom)
  const handleDeckPeekDecision = (moveToBottom) => {
    if (!deckPeekState) return;

    const { targetPlayer } = deckPeekState;
    const setTargetPlayerState = targetPlayer === 1 ? setPlayer1 : setPlayer2;
    const targetPlayerState = targetPlayer === 1 ? player1 : player2;

    if (moveToBottom && deckPeekState.cards.length > 0) {
      // Move the peeked card(s) to the bottom of the deck
      const newDeck = [
        ...targetPlayerState.deck.slice(deckPeekState.cards.length),
        ...deckPeekState.cards
      ];
      setTargetPlayerState({
        ...targetPlayerState,
        deck: newDeck,
      });
      setMessage(prev => `${prev} Card moved to the bottom of Player ${targetPlayer}'s deck!`);
    } else {
      setMessage(prev => `${prev} Card left at the top of Player ${targetPlayer}'s deck.`);
    }

    setDeckPeekState(null);
  };

  // Complete the ability execution after any reactions
  const completeAbilityExecution = (flowState) => {
    const playerState = getCurrentPlayerState();
    const opponentEnergy = getOpponentEnergy();

    // Check if this was a brainwash free ability
    const isControlledAbility = controlledCharacter &&
      controlledCharacter.position.row === flowState.attackerRow &&
      controlledCharacter.position.col === flowState.attackerCol;
    const isFreeFromBrainwash = isControlledAbility && !controlledCharacter.freeAbilityUsed;

    const result = executeAbility(
      flowState,
      board,
      playerState.energy,
      opponentEnergy
    );

    if (!result.success) {
      setMessage(result.error);
      setAbilityFlow(createAbilityFlowState());
      return;
    }

    // Update board and energy (with infinite energy cheat support and brainwash free ability)
    setBoard(result.board);
    setCurrentPlayerState({
      ...playerState,
      energy: (infiniteEnergy || isFreeFromBrainwash) ? playerState.energy : result.attackerEnergy,
    });
    setOpponentEnergy(infiniteEnergy ? getOpponentEnergy() : result.targetEnergy);

    // Mark free brainwash ability as used
    if (isFreeFromBrainwash) {
      setControlledCharacter({ ...controlledCharacter, freeAbilityUsed: true });
    }

    // Handle delayed returns (e.g., characters that were eaten and will return later)
    if (result.gameStateUpdates?.delayedReturn) {
      setDelayedReturns(prev => [...prev, result.gameStateUpdates.delayedReturn]);
    }

    // Handle brainwash - set controlled character
    if (result.gameStateUpdates?.controlledCharacter) {
      setControlledCharacter(result.gameStateUpdates.controlledCharacter);
    }

    // Handle deck peek (e.g., Cheese Radar)
    if (result.gameStateUpdates?.deckPeek) {
      const { player, count, canReorder } = result.gameStateUpdates.deckPeek;
      const targetDeck = player === 'opponent'
        ? (currentPlayer === 1 ? player2.deck : player1.deck)
        : (currentPlayer === 1 ? player1.deck : player2.deck);

      if (targetDeck.length > 0) {
        const peekedCards = targetDeck.slice(0, count);
        setDeckPeekState({
          cards: peekedCards,
          player,
          canReorder: canReorder || false,
          targetPlayer: player === 'opponent'
            ? (currentPlayer === 1 ? 2 : 1)
            : currentPlayer
        });
      }
    }

    // Handle hand reveal (e.g., Mind Read)
    if (result.gameStateUpdates?.handReveal) {
      const { player } = result.gameStateUpdates.handReveal;
      const targetHand = player === 'opponent'
        ? (currentPlayer === 1 ? player2.hand : player1.hand)
        : (currentPlayer === 1 ? player1.hand : player2.hand);

      if (targetHand.length > 0) {
        setHandRevealState({
          cards: targetHand,
          targetPlayer: player === 'opponent'
            ? (currentPlayer === 1 ? 2 : 1)
            : currentPlayer
        });
      } else {
        setMessage(prev => `${prev} Player ${player === 'opponent' ? (currentPlayer === 1 ? 2 : 1) : currentPlayer}'s hand is empty!`);
      }
    }

    // Handle placement discount (e.g., We Best Have an Agreement)
    if (result.gameStateUpdates?.placementDiscount) {
      const { amount, validCards } = result.gameStateUpdates.placementDiscount;
      setPlacementDiscount({
        amount,
        validCards: validCards || [],
        fromAbility: flowState.attack?.name || 'Unknown ability'
      });
    }

    // Display messages
    setMessage(result.messages.join(' '));

    // Check for win condition
    const gameWinner = checkWinCondition(result.board);
    if (gameWinner) {
      setWinner(gameWinner);
      setGamePhase('ended');
      setMessage(`Player ${gameWinner} wins! All enemy towers destroyed!`);
      setAnnouncement({ type: 'turn', text: `PLAYER ${gameWinner} WINS!`, subtext: 'All enemy towers destroyed!', player: gameWinner });
    }

    // Reset ability flow state
    setAbilityFlow(createAbilityFlowState());
    setSelectedDirection(null);
    setSelectedAttack(null);
    setSelectedBoardCharacter(null);
  };

  const endTurn = () => {
    const playerState = getCurrentPlayerState();
    const towersAllowed = getTowersAllowedThisTurn(currentPlayer, turnCount[currentPlayer]);

    if (playerState.towersPlacedThisTurn < towersAllowed) {
      setMessage(`You must place all ${towersAllowed} tower(s) before ending your turn!`);
      return;
    }

    const nextPlayer = currentPlayer === 1 ? 2 : 1;
    const nextTurn = turnCount[nextPlayer] + 1;
    const nextPlayerState = nextPlayer === 1 ? player1 : player2;
    const setNextPlayerState = nextPlayer === 1 ? setPlayer1 : setPlayer2;

    setTurnCount(prev => ({ ...prev, [nextPlayer]: nextTurn }));

    const newEnergy = Math.max(nextPlayerState.energy, BASE_ENERGY_REGEN);
    const energyGained = newEnergy - nextPlayerState.energy;

    const nextTowersAllowed = getTowersAllowedThisTurn(nextPlayer, nextTurn);
    const needsTowers = nextTowersAllowed > 0;
    const canPlayCards = nextTurn >= PLAYER_CONFIG[nextPlayer].canPlayCardsFromTurn;

    if (needsTowers) {
      // Towering phase - must place towers, can't draw or play cards
      setNextPlayerState({
        ...nextPlayerState,
        energy: newEnergy,
        towersPlacedThisTurn: 0,
      });
      const towerMsg = canPlayCards
        ? `Player ${nextPlayer}'s turn - Place ${nextTowersAllowed} tower(s), then play cards!`
        : `Player ${nextPlayer}'s turn - Towering Phase! Place ${nextTowersAllowed} tower(s).`;
      setMessage(towerMsg);
      setGamePhase('towering');
      setAnnouncement({ type: 'turn', text: `PLAYER ${nextPlayer}`, subtext: canPlayCards ? 'Place towers, then play!' : 'Towering Phase - Place your towers!', player: nextPlayer });
    } else if (canPlayCards && nextPlayerState.deck.length > 0) {
      // Can play cards and has cards to draw
      const { drawn, remaining } = drawCards(nextPlayerState.deck, 1);
      setNextPlayerState({
        ...nextPlayerState,
        deck: remaining,
        hand: [...nextPlayerState.hand, ...drawn],
        energy: newEnergy,
        towersPlacedThisTurn: 0,
      });
      const energyMsg = energyGained > 0 ? ` Energy restored to ${newEnergy}!` : ` (${newEnergy} Energy)`;
      setMessage(`Player ${nextPlayer}'s turn - Drew ${drawn[0].name}!${energyMsg}`);
      setGamePhase('playing');
      setAnnouncement({ type: 'turn', text: `PLAYER ${nextPlayer}`, subtext: 'Your turn begins!', player: nextPlayer });
    } else if (canPlayCards) {
      // Can play cards but no cards to draw
      setNextPlayerState({
        ...nextPlayerState,
        energy: newEnergy,
        towersPlacedThisTurn: 0,
      });
      setMessage(`Player ${nextPlayer}'s turn - No cards left to draw! (${newEnergy} Energy)`);
      setGamePhase('playing');
      setAnnouncement({ type: 'turn', text: `PLAYER ${nextPlayer}`, subtext: 'Your turn begins!', player: nextPlayer });
    } else {
      // Can't play cards yet (shouldn't happen with current config, but handle it)
      setNextPlayerState({
        ...nextPlayerState,
        energy: newEnergy,
        towersPlacedThisTurn: 0,
      });
      setMessage(`Player ${nextPlayer}'s turn - Setup phase complete.`);
      setGamePhase('towering'); // Stay in towering phase conceptually
      setAnnouncement({ type: 'turn', text: `PLAYER ${nextPlayer}`, subtext: 'Setup phase', player: nextPlayer });
    }

    // Reset usedAttacks for the current player's characters (abilities are once per turn)
    const boardWithResetAbilities = board.map(row =>
      row.map(cell => {
        if (cell && cell.player === currentPlayer) {
          return { ...cell, usedAttacks: [] };
        }
        return cell;
      })
    );

    setCurrentPlayer(nextPlayer);
    setSelectedCard(null);
    setPlacingTower(false);
    setHoveredCell(null);
    setSelectedBoardCharacter(null);
    setSelectedDirection(null);
    setSelectedAttack(null);
    setAbilityFlow(createAbilityFlowState());
    setShowReactionPrompt(false);
    setControlledCharacter(null); // Clear brainwash at end of turn
    setPlacementDiscount(null); // Clear placement discount at end of turn

    // Tick down status effect durations and process DOT effects
    const tickResult = tickEffects(boardWithResetAbilities);
    const dotResult = processDotEffects(tickResult.board, nextPlayer);
    let finalBoard = dotResult.board;
    const returnMessages = [];

    // Process delayed returns (characters that were eaten and are returning)
    const remainingReturns = [];
    for (const delayedReturn of delayedReturns) {
      const newTurnsRemaining = delayedReturn.turnsUntilReturn - 1;

      if (newTurnsRemaining <= 0) {
        // Time to return the character!
        const { character, originalPosition, damageOnReturn } = delayedReturn;
        const returnRow = originalPosition.row;
        const returnCol = originalPosition.col;

        // Check if original position is empty
        if (finalBoard[returnRow][returnCol] === null) {
          // Apply damage and place character back
          const newHp = character.hp - damageOnReturn;
          if (newHp <= 0) {
            returnMessages.push(`${character.name} returned but was destroyed by the damage!`);
          } else {
            finalBoard = finalBoard.map(r => [...r]);
            finalBoard[returnRow][returnCol] = { ...character, hp: newHp };
            returnMessages.push(`${character.name} returned with ${newHp} HP! (took ${damageOnReturn} damage)`);
          }
        } else {
          // Original position is occupied - find nearby empty tile
          let placed = false;
          for (let dr = -1; dr <= 1 && !placed; dr++) {
            for (let dc = -1; dc <= 1 && !placed; dc++) {
              const nr = returnRow + dr;
              const nc = returnCol + dc;
              if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE && finalBoard[nr][nc] === null) {
                const newHp = character.hp - damageOnReturn;
                if (newHp > 0) {
                  finalBoard = finalBoard.map(r => [...r]);
                  finalBoard[nr][nc] = { ...character, hp: newHp };
                  returnMessages.push(`${character.name} returned nearby with ${newHp} HP! (took ${damageOnReturn} damage)`);
                } else {
                  returnMessages.push(`${character.name} returned but was destroyed by the damage!`);
                }
                placed = true;
              }
            }
          }
          if (!placed) {
            // No space available - character is lost
            returnMessages.push(`${character.name} could not return - no space available!`);
          }
        }
      } else {
        // Still waiting
        remainingReturns.push({ ...delayedReturn, turnsUntilReturn: newTurnsRemaining });
      }
    }

    setDelayedReturns(remainingReturns);

    // Check for trapped characters belonging to the incoming player
    const trappedCharacters = getTrappedCharactersForPlayer(finalBoard, nextPlayer);

    if (trappedCharacters.length > 0) {
      // Show escape roll modal for the first trapped character
      // Store pending rolls for remaining trapped characters
      const [first, ...rest] = trappedCharacters;
      setEscapeRollState({
        character: first.character,
        position: first.position,
        escapeCondition: first.escapeCondition,
        rollResult: null,
        escaped: null,
        pendingRolls: rest,
        pendingBoard: finalBoard,  // Store board state to apply after all rolls
      });
    } else {
      setBoard(finalBoard);
    }

    // Show any DOT messages and return messages
    const allMessages = [...dotResult.messages, ...returnMessages];
    if (allMessages.length > 0) {
      // Append messages to the turn message
      setTimeout(() => {
        setMessage(prev => `${prev} ${allMessages.join(' ')}`);
      }, 100);
    }
  };

  const currentPlayerState = getCurrentPlayerState();

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', p: { xs: 1, sm: 2.5 } }}>
      {/* Phase/Turn Announcement Overlay */}
      <PhaseAnnouncement
        announcement={announcement}
        onComplete={() => setAnnouncement(null)}
      />

      {/* Reaction Prompt Dialog */}
      <Dialog
        open={showReactionPrompt}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: 2,
            borderColor: currentPlayer === 1 ? 'secondary.main' : 'primary.main',
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: currentPlayer === 1 ? 'secondary.dark' : 'primary.dark',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <BattleIcon sx={{ fontSize: 28 }} />
          Player {currentPlayer === 1 ? 2 : 1} - Reaction Available!
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {abilityFlow.target && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  {abilityFlow.attacker?.name} is attacking {abilityFlow.target.character.name} with "{abilityFlow.ability?.name}"!
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  Incoming damage: {abilityFlow.ability?.damage || 0} <DamageIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} />
                </Typography>
              </Alert>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Available Reactions:
              </Typography>

              <Stack spacing={1.5}>
                {abilityFlow.availableReactions?.map((reaction, idx) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: 1,
                      borderColor: reaction.isAllyProtection ? 'warning.main' : 'divider',
                      bgcolor: reaction.isAllyProtection ? 'warning.light' : 'transparent',
                      '&:hover': {
                        bgcolor: reaction.isAllyProtection ? 'warning.main' : 'action.hover',
                        borderColor: 'primary.main',
                      },
                    }}
                    onClick={() => handleReaction('use', reaction)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        {reaction.isAllyProtection && (
                          <Typography variant="caption" color="warning.dark" fontWeight="bold" sx={{ display: 'block', mb: 0.5 }}>
                            🛡️ {reaction.protectingCard?.name} protects {abilityFlow.target.character.name}
                          </Typography>
                        )}
                        <Typography variant="body1" fontWeight="bold">
                          {reaction.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reaction.description || `${reaction.type} reaction`}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<EnergyIcon sx={{ fontSize: 16 }} />}
                        label={`${reaction.cost} Energy`}
                        size="small"
                        color={getOpponentEnergy() >= reaction.cost ? 'success' : 'error'}
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => handleReaction('decline')}
            fullWidth
          >
            Decline (Take Full Damage)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Placement Reaction Modal */}
      <Dialog
        open={showPlacementReactionModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: 2,
            borderColor: 'warning.main',
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'warning.dark',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <BattleIcon sx={{ fontSize: 28 }} />
          Placement Reaction Available!
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {pendingPlacementReactions.length > 0 && (
            <>
              <Alert severity="warning" sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  {pendingPlacementReactions[0].placedCard.name} was placed {pendingPlacementReactions[0].direction} of {pendingPlacementReactions[0].reactingCard.name}!
                </Typography>
              </Alert>

              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                Available Reactions:
              </Typography>

              <Stack spacing={1.5}>
                {pendingPlacementReactions.map((reaction, idx) => (
                  <Paper
                    key={idx}
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: 1,
                      borderColor: 'divider',
                      '&:hover': {
                        bgcolor: 'action.hover',
                        borderColor: 'warning.main',
                      },
                    }}
                    onClick={() => handlePlacementReaction('use', reaction)}
                  >
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Typography variant="body1" fontWeight="bold">
                          {reaction.ability?.name || reaction.reaction.abilityName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {reaction.ability?.description || 'Placement reaction'}
                        </Typography>
                      </Box>
                      <Chip
                        icon={<EnergyIcon sx={{ fontSize: 16 }} />}
                        label={`${reaction.ability?.cost || 0} Energy`}
                        size="small"
                        color="warning"
                      />
                    </Stack>
                  </Paper>
                ))}
              </Stack>
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => handlePlacementReaction('skip')}
            fullWidth
          >
            Skip (Don't React)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Trap Triggered Modal (for abilities like Take the Bait) */}
      <Dialog
        open={trapTriggeredState !== null}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: 2,
            borderColor: 'warning.main',
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'warning.dark',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          🪤 TRAP TRIGGERED! - {trapTriggeredState?.trap?.abilityName}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {trapTriggeredState && (
            <>
              <Alert severity="success" sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  Player {trapTriggeredState.trap.player}'s trap has been triggered!
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  You may summon a character card from your hand for FREE adjacent to the attacker!
                </Typography>
              </Alert>

              {!trapSummonSelection && (
                <>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    Select a Character to Summon:
                  </Typography>

                  <Stack direction="row" spacing={2} flexWrap="wrap" sx={{ mb: 2 }}>
                    {trapTriggeredState.freeSummonCards.map((card, idx) => (
                      <Paper
                        key={idx}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          border: 2,
                          borderColor: 'divider',
                          minWidth: 150,
                          '&:hover': {
                            bgcolor: 'action.hover',
                            borderColor: 'warning.main',
                          },
                        }}
                        onClick={() => handleTrapSummonCardSelect(card)}
                      >
                        <Typography variant="body1" fontWeight="bold">
                          {card.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Cost: {card.cost} | HP: {card.hp}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </>
              )}

              {trapSummonSelection?.phase === 'selectTile' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body1" fontWeight="bold">
                    Now click on a highlighted tile adjacent to the attacker to summon {trapSummonSelection.card.name}!
                  </Typography>
                </Alert>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => handleTrapReaction('skip')}
            fullWidth
          >
            Skip (Don't Summon)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Escape Roll Modal for Trapped Characters */}
      <Dialog
        open={escapeRollState !== null}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: 2,
            borderColor: escapeRollState?.escaped ? 'success.main' : escapeRollState?.escaped === false ? 'error.main' : 'secondary.main',
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: escapeRollState?.escaped ? 'success.dark' : escapeRollState?.escaped === false ? 'error.dark' : 'secondary.dark',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          🌀 Dimension Escape Roll
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {escapeRollState && (
            <Box textAlign="center">
              <Alert severity={escapeRollState.escaped === null ? 'warning' : escapeRollState.escaped ? 'success' : 'error'} sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  {escapeRollState.character.name} is trapped in another dimension!
                </Typography>
              </Alert>

              <Typography variant="subtitle1" gutterBottom>
                Roll {escapeRollState.escapeCondition.dieType.toUpperCase()} to attempt escape
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Need {escapeRollState.escapeCondition.rollBelow - 1} or lower to escape (roll 1-{escapeRollState.escapeCondition.rollBelow - 1})
              </Typography>

              {escapeRollState.rollResult !== null && (
                <Box sx={{ my: 3 }}>
                  <Typography
                    variant="h2"
                    fontWeight="bold"
                    color={escapeRollState.escaped ? 'success.main' : 'error.main'}
                    sx={{
                      fontSize: '4rem',
                      textShadow: '2px 2px 4px rgba(0,0,0,0.2)',
                    }}
                  >
                    🎲 {escapeRollState.rollResult}
                  </Typography>
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    color={escapeRollState.escaped ? 'success.main' : 'error.main'}
                    sx={{ mt: 1 }}
                  >
                    {escapeRollState.escaped ? '✅ ESCAPED!' : '❌ STILL TRAPPED!'}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          {escapeRollState?.rollResult === null ? (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={handleEscapeRoll}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              🎲 Roll to Escape!
            </Button>
          ) : (
            <Button
              variant="contained"
              color={escapeRollState?.escaped ? 'success' : 'error'}
              size="large"
              onClick={handleEscapeRollContinue}
              sx={{ px: 4, py: 1.5, fontSize: '1.1rem' }}
            >
              {escapeRollState?.pendingRolls?.length > 0 ? 'Next Escape Roll' : 'Continue'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Deck Peek Modal (for abilities like Cheese Radar) */}
      <Dialog
        open={deckPeekState !== null}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: 2,
            borderColor: 'info.main',
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'info.dark',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          🔍 Deck Peek - Player {deckPeekState?.targetPlayer}'s Deck
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {deckPeekState && (
            <Box textAlign="center">
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  Top card of Player {deckPeekState.targetPlayer}'s deck:
                </Typography>
              </Alert>

              <Stack spacing={2} alignItems="center">
                {deckPeekState.cards.map((card, idx) => (
                  <Paper
                    key={idx}
                    elevation={3}
                    sx={{
                      p: 2,
                      minWidth: 200,
                      background: card.type === 'Energy'
                        ? 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: card.type === 'Energy' ? '#2c3e50' : 'white',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="h6" fontWeight="bold">
                      {card.name}
                    </Typography>
                    {card.type === 'Energy' ? (
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        +{card.value} Energy
                      </Typography>
                    ) : (
                      <>
                        <Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1 }}>
                          <Chip
                            icon={<EnergyIcon sx={{ fontSize: 16, color: '#f1c40f !important' }} />}
                            label={`${card.cost} Cost`}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                          />
                          <Chip
                            icon={<HeartIcon sx={{ fontSize: 16, color: '#e74c3c !important' }} />}
                            label={`${card.hp} HP`}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}
                          />
                        </Stack>
                        {card.class && (
                          <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                            Class: {card.class}
                          </Typography>
                        )}
                      </>
                    )}
                  </Paper>
                ))}
              </Stack>

              {deckPeekState.canReorder && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  You may choose to move this card to the bottom of their deck.
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, justifyContent: 'center' }}>
          {deckPeekState?.canReorder ? (
            <>
              <Button
                variant="contained"
                color="warning"
                size="large"
                onClick={() => handleDeckPeekDecision(true)}
                sx={{ px: 3 }}
              >
                Move to Bottom
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                size="large"
                onClick={() => handleDeckPeekDecision(false)}
                sx={{ px: 3 }}
              >
                Leave at Top
              </Button>
            </>
          ) : (
            <Button
              variant="contained"
              color="primary"
              size="large"
              onClick={() => handleDeckPeekDecision(false)}
              sx={{ px: 4 }}
            >
              OK
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Hand Reveal Modal (for abilities like Mind Read) */}
      <Dialog
        open={handRevealState !== null}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            border: 2,
            borderColor: 'secondary.main',
          }
        }}
      >
        <DialogTitle sx={{
          bgcolor: 'secondary.dark',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          🧠 Mind Read - Player {handRevealState?.targetPlayer}'s Hand
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {handRevealState && (
            <Box textAlign="center">
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  You can see all {handRevealState.cards.length} card(s) in Player {handRevealState.targetPlayer}'s hand:
                </Typography>
              </Alert>

              <Stack
                direction="row"
                spacing={2}
                flexWrap="wrap"
                justifyContent="center"
                sx={{ gap: 2 }}
              >
                {handRevealState.cards.map((card, idx) => (
                  <Paper
                    key={idx}
                    elevation={3}
                    sx={{
                      p: 2,
                      minWidth: 160,
                      maxWidth: 180,
                      background: card.type === 'Energy'
                        ? 'linear-gradient(135deg, #f1c40f 0%, #f39c12 100%)'
                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: card.type === 'Energy' ? '#2c3e50' : 'white',
                      borderRadius: 2,
                    }}
                  >
                    <Typography variant="subtitle1" fontWeight="bold">
                      {card.name}
                    </Typography>
                    {card.type !== 'Energy' && (
                      <>
                        <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1 }}>
                          <Chip
                            icon={<EnergyIcon sx={{ fontSize: 14, color: '#f1c40f !important' }} />}
                            label={card.cost}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit', height: 24 }}
                          />
                          <Chip
                            icon={<HeartIcon sx={{ fontSize: 14, color: '#e74c3c !important' }} />}
                            label={card.hp}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'inherit', height: 24 }}
                          />
                        </Stack>
                        {card.class && (
                          <Typography variant="caption" sx={{ mt: 1, display: 'block', opacity: 0.8 }}>
                            {card.class}
                          </Typography>
                        )}
                      </>
                    )}
                    {card.type === 'Energy' && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        +{card.value} Energy
                      </Typography>
                    )}
                  </Paper>
                ))}
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            color="secondary"
            size="large"
            onClick={() => setHandRevealState(null)}
            sx={{ px: 4 }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Box */}
      <Box display="flex" justifyContent="center" alignItems="center" gap={2} mb={2.5}>
        <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" flexWrap="wrap">
          <Chip
            label={`Player ${currentPlayer}'s Turn`}
            color={currentPlayer === 1 ? 'primary' : 'secondary'}
            sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
          />
          <Chip
            label={gamePhase.toUpperCase()}
            color="default"
            sx={{ fontWeight: 'bold' }}
          />
        </Stack>
        <Alert
          severity="info"
          sx={{ fontSize: '1.1em' }}
          icon={false}
        >
          {message}
        </Alert>
        {gamePhase === 'ended' ? (
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<RestartAltIcon />}
            onClick={startGame}
          >
            Play Again
          </Button>
        ) : (
          <Button
            variant="outlined"
            color="inherit"
            startIcon={<RestartAltIcon />}
            onClick={startGame}
          >
            New Game
          </Button>
        )}
      </Box>

      {/* Game Area */}
      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={3}
        justifyContent="center"
        alignItems="flex-start"
        mb={3}
      >
        {/* Player 1 Info */}
        <PlayerInfo
          player={player1}
          playerNumber={1}
          isActive={currentPlayer === 1 && (gamePhase === 'playing' || gamePhase === 'towering')}
        />

        {/* Board */}
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            bgcolor: '#34495e',
            borderRadius: 2,
          }}
        >
          <Stack spacing={0.5}>
            {board.map((row, rowIndex) => (
              <Stack key={rowIndex} direction="row" spacing={0.5}>
                {row.map((cell, colIndex) => (
                  <BoardCell
                    key={colIndex}
                    cell={cell}
                    playerNumber={currentPlayer}
                    isSelected={
                      selectedBoardCharacter?.row === rowIndex &&
                      selectedBoardCharacter?.col === colIndex
                    }
                    isClickable={selectedCard || placingTower || gamePhase === 'towering'}
                    showTowerPreview={gamePhase === 'towering' && !cell}
                    isHovered={hoveredCell?.row === rowIndex && hoveredCell?.col === colIndex}
                    highlightColor={
                      abilityFlow.state === ABILITY_FLOW_STATES.SELECTING_REACTION_DISPLACEMENT &&
                        abilityFlow.pendingDisplacement?.validTargets?.some(t => t.row === rowIndex && t.col === colIndex)
                        ? 'warning.main'
                        : cellSelectionState?.targetType === 'any-tile-with-enemy' &&
                          cell && cell.owner !== currentPlayer && cell.card?.type !== 'tower'
                          ? 'error.main'
                          : cellSelectionState?.targetType === 'any-empty-tile' && !cell
                            ? 'success.main'
                            : dualSelectionState?.phase === 'first' &&
                              cell?.type === 'character' && cell?.player === currentPlayer
                              ? 'info.main'
                              : dualSelectionState?.phase === 'second' &&
                                cell?.type === 'character' && cell?.player !== currentPlayer
                                ? 'error.main'
                                : trapSummonSelection?.phase === 'selectTile' &&
                                  trapTriggeredState?.adjacentTiles?.some(t => t.row === rowIndex && t.col === colIndex)
                                  ? 'warning.main'
                                  : null
                    }
                    onMouseEnter={() => {
                      if (gamePhase === 'towering' && !cell) {
                        setHoveredCell({ row: rowIndex, col: colIndex });
                      }
                    }}
                    onMouseLeave={() => setHoveredCell(null)}
                    onClick={() => {
                      if (gamePhase === 'towering') {
                        handleCellClick(rowIndex, colIndex);
                        return;
                      }
                      // Handle trap summon tile selection
                      if (trapSummonSelection?.phase === 'selectTile') {
                        handleCellClick(rowIndex, colIndex);
                        return;
                      }
                      // Handle dual selection (e.g., Take the Bait)
                      if (dualSelectionState) {
                        handleCellClick(rowIndex, colIndex);
                        return;
                      }
                      // Handle reaction displacement selection
                      if (abilityFlow.state === ABILITY_FLOW_STATES.SELECTING_REACTION_DISPLACEMENT) {
                        handleCellClick(rowIndex, colIndex);
                        return;
                      }
                      // Handle cell selection for board-wide targeting
                      if (cellSelectionState) {
                        handleCellClick(rowIndex, colIndex);
                        return;
                      }
                      if (cell && cell.type === 'character' && !selectedCard && !placingTower) {
                        if (
                          selectedBoardCharacter?.row === rowIndex &&
                          selectedBoardCharacter?.col === colIndex
                        ) {
                          setSelectedBoardCharacter(null);
                          setCellSelectionState(null);
                          setMessage('Character deselected.');
                        } else {
                          setSelectedBoardCharacter({ ...cell, row: rowIndex, col: colIndex });
                          setCellSelectionState(null); // Clear any pending cell selection
                          setMessage(`${cell.name} selected - ${cell.attacks.length} attack(s) available`);
                        }
                      } else {
                        handleCellClick(rowIndex, colIndex);
                      }
                    }}
                  />
                ))}
              </Stack>
            ))}
          </Stack>
        </Paper>

        {/* Player 2 Info */}
        <PlayerInfo
          player={player2}
          playerNumber={2}
          isActive={currentPlayer === 2 && (gamePhase === 'playing' || gamePhase === 'towering')}
        />
      </Stack>

      {/* Attack Panel */}
      {selectedBoardCharacter && (
        <AttackPanel
          selectedCharacter={selectedBoardCharacter}
          currentPlayer={currentPlayer}
          currentPlayerEnergy={currentPlayerState.energy}
          board={board}
          onClose={() => {
            setSelectedBoardCharacter(null);
            setSelectedDirection(null);
            setSelectedAttack(null);
            setCellSelectionState(null);
          }}
          onExecuteAttack={executeAttack}
          selectedAttack={selectedAttack}
          setSelectedAttack={setSelectedAttack}
          selectedDirection={selectedDirection}
          setSelectedDirection={setSelectedDirection}
          isControlled={
            controlledCharacter &&
            controlledCharacter.position.row === selectedBoardCharacter.row &&
            controlledCharacter.position.col === selectedBoardCharacter.col
          }
          isFreeAbility={
            controlledCharacter &&
            controlledCharacter.position.row === selectedBoardCharacter.row &&
            controlledCharacter.position.col === selectedBoardCharacter.col &&
            !controlledCharacter.freeAbilityUsed
          }
        />
      )}

      {/* Hand */}
      <Box
        width="100%"
        display="flex"
        justifyContent="center"
      >
        {(gamePhase === 'playing' || gamePhase === 'towering') && (
          <Paper
            elevation={2}
            sx={{
              p: 2.5,
              mb: 2.5,
              opacity: gamePhase === 'towering' ? 0.6 : 1,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 2,
              width: 'fit-content',
            }}
          >
            <Stack
              direction="row"
              spacing={1.5}
              flexWrap="wrap"
              justifyContent="center"
              useFlexGap
              maxWidth={900}
            >
              {currentPlayerState.hand.map((card, index) =>
                card.type === 'Character' ? (
                  <CharacterCard
                    key={card.id}
                    character={card}
                    isSelected={selectedCard?.id === card.id}
                    onClick={() => selectCard(card, index)}
                  />
                ) : (
                  <EnergyCard
                    key={card.id}
                    card={card}
                    isSelected={selectedCard?.id === card.id}
                    onClick={() => selectCard(card, index)}
                    gamePhase={gamePhase}
                    playEnergyCard={playEnergyCard}
                    selectedCard={selectedCard}
                  />
                )
              )}
            </Stack>
            <Box>
              <Button
                variant="contained"
                color="info"
                startIcon={<SkipNextIcon />}
                onClick={endTurn}
                sx={{
                  width: 140,
                  minHeight: 196,
                }}
              >
                End Turn
              </Button>
            </Box>
          </Paper>
        )}
      </Box>

      {/* Controls */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        flexWrap="wrap"
        useFlexGap
      >
        {gamePhase === 'setup' && (
          <Button
            variant="contained"
            color="success"
            size="large"
            startIcon={<PlayArrowIcon />}
            onClick={startGame}
          >
            Start Game
          </Button>
        )}
      </Stack>

      {/* Cheat Panel for Testing */}
      <Box display='hidden'>
        <CheatPanel
          cheatModeEnabled={cheatModeEnabled}
          onToggleCheatMode={() => setCheatModeEnabled(!cheatModeEnabled)}
          infiniteEnergy={infiniteEnergy}
          onToggleInfiniteEnergy={() => setInfiniteEnergy(!infiniteEnergy)}
          onPlaceCard={(card, player) => setCheatCardToPlace({ card, player })}
          onClearBoard={() => {
            setBoard(board.map(row => row.map(cell =>
              cell && cell.type === 'tower' ? cell : null
            )));
            setMessage('Board cleared (towers preserved)!');
          }}
          board={board}
        />
      </Box>

      {/* Displacement destination selection indicator */}
      {displacementState && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'secondary.main',
            color: 'white',
            px: 3,
            py: 1,
            borderRadius: 2,
            zIndex: 1000,
            boxShadow: 3,
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            Click an empty tile to send {displacementState.targetName} to another dimension!
          </Typography>
          <Button
            size="small"
            color="inherit"
            onClick={() => {
              setDisplacementState(null);
              setMessage('Displacement cancelled.');
            }}
            sx={{ mt: 0.5 }}
          >
            Cancel
          </Button>
        </Box>
      )}

      {/* Cheat mode indicator */}
      {cheatCardToPlace && (
        <Box
          sx={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'error.main',
            color: 'white',
            px: 3,
            py: 1,
            borderRadius: 2,
            zIndex: 1000,
            boxShadow: 3,
          }}
        >
          <Typography variant="body2" fontWeight="bold">
            Click an empty tile to place {cheatCardToPlace.card.name} for Player {cheatCardToPlace.player}
          </Typography>
        </Box>
      )}
    </Box>
  );
}