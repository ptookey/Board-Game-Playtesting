import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Chip,
  Alert,
  Stack,
  IconButton,
  Modal,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BlockIcon from '@mui/icons-material/Block';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import {
  EnergyIcon,
  HeartIcon,
  DamageIcon,
  MagicIcon,
  STATUS_EFFECT_COLORS,
  getStatusEffectIcon,
} from './icons/GameIcons';
import { getCardImageUrl } from './CharacterCard';
import { GRID_SIZE, DIRECTION_OFFSETS } from '../config/gameConfig';
import { canCharacterAct, checkAllConditionals } from '../systems/combatSystem';

// Special types that don't require a direction
const NO_DIRECTION_SPECIALS = [
  'heal', 'buff', 'team-buff', 'deck-control', 'deck-peek',
  'hand-reveal', 'dodge', 'block', 'free-summon',
  'placement-cheat', 'bribe', 'opponent-deck-reveal', 'self-deck-reveal',
  'opponent-hand-reveal', 'character-placement-discount',
];

// Target types that don't require a direction selection
const NO_DIRECTION_TARGET_TYPES = ['self', 'none', 'all-attack-directions'];

// Target types that need special direction handling
const HORIZONTAL_DIRECTION_TARGET_TYPES = ['horizontal-direction'];

// Target types that require clicking on a board cell instead of selecting a direction
const CELL_SELECTION_TARGET_TYPES = ['any-tile-with-enemy', 'any-empty-tile'];

function AttackPanel({
  selectedCharacter,
  currentPlayer,
  currentPlayerEnergy,
  board,
  onClose,
  onExecuteAttack,
  selectedAttack,
  setSelectedAttack,
  selectedDirection,
  setSelectedDirection,
  isControlled = false, // True if this is a brainwashed character
  isFreeAbility = false, // True if the next ability is free (brainwash)
}) {
  const [showMagnified, setShowMagnified] = useState(false);
  
  const imageUrl = selectedCharacter.image
    ? getCardImageUrl(selectedCharacter.image)
    : null;
  // Allow using abilities if owner OR if controlled via brainwash
  const isOwner = selectedCharacter.player === currentPlayer || isControlled;

  return (
    <>
    <Paper
      elevation={3}
      sx={{
        p: 2.5,
        mb: 2.5,
        borderLeft: 4,
        borderColor: 'secondary.main',
        display: 'flex',
        gap: 2.5,
      }}
    >
      {/* Card Image */}
      <Box sx={{ flexShrink: 0, width: 200 }}>
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={selectedCharacter.name}
            sx={{
              width: '100%',
              height: 'auto',
              borderRadius: 2,
              boxShadow: 2,
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: 280,
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              p: 2.5,
            }}
          >
            <Typography variant="h6" fontWeight="bold">
              {selectedCharacter.name}
            </Typography>
            <Typography variant="caption" textTransform="uppercase" letterSpacing={1} sx={{ opacity: 0.8 }}>
              {selectedCharacter.class}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Options */}
      <Box sx={{ flex: 1 }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} mb={2}>
          <Typography variant="h6">{selectedCharacter.name}</Typography>
          <Chip
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}><HeartIcon sx={{ fontSize: 14 }} /> {selectedCharacter.hp}</Box>}
            color="secondary"
            size="small"
            sx={{ fontWeight: 'bold' }}
          />
          {/* Status Effects Display */}
          {selectedCharacter.statusEffects && selectedCharacter.statusEffects.length > 0 && (
            <Stack direction="row" spacing={0.5}>
              {selectedCharacter.statusEffects.map((effect, index) => {
                const IconComponent = getStatusEffectIcon(effect.type);
                const color = STATUS_EFFECT_COLORS[effect.type] || '#666';
                return (
                  <Chip
                    key={index}
                    icon={<IconComponent sx={{ fontSize: 16, color: `${color} !important` }} />}
                    label={`${effect.turnsRemaining}t`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(0,0,0,0.1)',
                      borderColor: color,
                      border: 1,
                      '& .MuiChip-label': { fontSize: '0.7rem' },
                    }}
                    title={`${effect.type} - ${effect.turnsRemaining} turns remaining`}
                  />
                );
              })}
            </Stack>
          )}
          <IconButton 
            onClick={() => setShowMagnified(true)} 
            size="small" 
            sx={{ ml: 'auto' }}
            title="View full card"
          >
            <ZoomInIcon />
          </IconButton>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Stack>

        {isOwner ? (
          <>
            {/* Check if character can act */}
            {!canCharacterAct(selectedCharacter) ? (
              <Alert 
                severity="warning" 
                icon={<BlockIcon />}
                sx={{ 
                  mb: 2,
                  '& .MuiAlert-message': { width: '100%' }
                }}
              >
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Cannot Use Abilities
                </Typography>
                <Typography variant="body2">
                  {selectedCharacter.name} is affected by a status effect that prevents actions.
                  {selectedCharacter.statusEffects?.filter(e => 
                    ['stunned', 'paralyzed', 'frozen'].includes(e.type)
                  ).map(e => (
                    <Chip
                      key={e.type}
                      label={`${e.type.charAt(0).toUpperCase() + e.type.slice(1)} (${e.turnsRemaining} turn${e.turnsRemaining !== 1 ? 's' : ''} remaining)`}
                      size="small"
                      sx={{ 
                        ml: 1, 
                        mt: 0.5,
                        bgcolor: STATUS_EFFECT_COLORS[e.type] || '#666',
                        color: 'white',
                      }}
                    />
                  ))}
                </Typography>
              </Alert>
            ) : (
              <>
                {/* Attacks */}
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  1. Select Ability:{isControlled && ' (Brainwashed)'}
                </Typography>
                {isControlled && isFreeAbility && (
                  <Alert severity="success" sx={{ mb: 1, py: 0.5 }}>
                    <Typography variant="caption">First ability is FREE!</Typography>
                  </Alert>
                )}
                <Stack spacing={1} mb={2}>
              {selectedCharacter.attacks.map((attack, index) => {
                const isUsed = selectedCharacter.usedAttacks?.includes(index);
                const isSelected = selectedAttack?.index === index;
                // Check if this ability requires direction selection
                const hasNoDirectionSpecial = NO_DIRECTION_SPECIALS.includes(attack.special) ||
                  (attack.specialTypes && attack.specialTypes.some(st => NO_DIRECTION_SPECIALS.includes(st)));
                const hasNoDirectionTargetType = NO_DIRECTION_TARGET_TYPES.includes(attack.targetType);
                const isHorizontalDirection = HORIZONTAL_DIRECTION_TARGET_TYPES.includes(attack.targetType);
                const requiresCellSelection = CELL_SELECTION_TARGET_TYPES.includes(attack.targetType);
                // If targetType explicitly says no direction needed OR needs cell selection, don't require direction
                const requiresDirection = (hasNoDirectionTargetType || requiresCellSelection)
                  ? false 
                  : (attack.damage > 0 || (!hasNoDirectionSpecial && !hasNoDirectionTargetType));
                // Free if brainwash first ability OR if we have enough energy
                const canAfford = isFreeAbility || currentPlayerEnergy >= attack.cost;
                
                // Check conditionals for abilities that have them
                // Filter out target-dependent conditionals (they're checked during execution)
                const TARGET_DEPENDENT_CONDITIONALS = [
                  'targetHealthBelow', 'targetHealthAbove', 'attackDamageBelow', 'attackDamageAbove'
                ];
                let conditionalsPass = true;
                let conditionalReason = null;
                if (attack.conditionals && attack.conditionals.length > 0) {
                  // Only check non-target-dependent conditionals for ability availability
                  const preTargetConditionals = attack.conditionals.filter(
                    c => !TARGET_DEPENDENT_CONDITIONALS.includes(c.type)
                  );
                  
                  if (preTargetConditionals.length > 0) {
                    const attackWithFilteredConditionals = {
                      ...attack,
                      conditionals: preTargetConditionals,
                    };
                    const conditionalCheck = checkAllConditionals(attackWithFilteredConditionals, {
                      board,
                      attacker: {
                        row: selectedCharacter.row,
                        col: selectedCharacter.col,
                        character: selectedCharacter,
                      },
                    });
                    conditionalsPass = conditionalCheck.canUse;
                    if (!conditionalsPass && conditionalCheck.failedConditions?.length > 0) {
                      const failed = conditionalCheck.failedConditions[0];
                      if (failed.type === 'cardOnField') {
                        const cardNames = failed.cardIds?.join(' & ') || failed.cardId;
                        conditionalReason = `Requires ${cardNames} on field`;
                      } else if (failed.type === 'cardAdjacent') {
                        const cardNames = failed.cardIds?.join(' or ') || failed.cardId;
                        conditionalReason = `Requires ${cardNames} adjacent`;
                      } else {
                        conditionalReason = 'Conditions not met';
                      }
                    }
                  }
                }

                return (
                  <Box key={index}>
                    <Button
                      fullWidth
                      variant={isSelected ? 'contained' : 'outlined'}
                      color={isSelected ? 'success' : 'secondary'}
                      disabled={!canAfford || isUsed || !conditionalsPass}
                      onClick={() => {
                        setSelectedAttack({ ...attack, index, requiresDirection, isHorizontalDirection, requiresCellSelection });
                        setSelectedDirection(null);
                      }}
                      sx={{
                        justifyContent: 'space-between',
                        textDecoration: isUsed ? 'line-through' : 'none',
                        opacity: isUsed ? 0.5 : 1,
                      }}
                    >
                      <Chip
                        label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>{isFreeAbility ? 'FREE' : attack.cost}<EnergyIcon sx={{ fontSize: 14 }} /></Box>}
                        size="small"
                        sx={{ bgcolor: isFreeAbility ? 'success.main' : 'rgba(0,0,0,0.2)', color: 'inherit' }}
                      />
                      <Typography variant="body2" fontWeight="bold" sx={{ flex: 1, mx: 1 }}>
                        {attack.name}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        {attack.damage > 0 ? <>{attack.damage}<DamageIcon sx={{ fontSize: 16 }} /></> : <MagicIcon sx={{ fontSize: 16 }} />}
                      </Typography>
                      {isUsed && (
                        <Chip label="USED" size="small" color="error" sx={{ ml: 1 }} />
                      )}
                      {!conditionalsPass && !isUsed && (
                        <Chip 
                          label={conditionalReason || "LOCKED"} 
                          size="small" 
                          color="warning" 
                          sx={{ ml: 1 }} 
                        />
                      )}
                    </Button>
                    {attack.description && (
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          mt: 0.5,
                          px: 1,
                          fontStyle: 'italic',
                        }}
                      >
                        {attack.description}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>

            {/* Direction Selection */}
            {selectedAttack && selectedAttack.requiresDirection && !selectedAttack.isHorizontalDirection && (
              <>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  2. Select Direction:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" mb={2}>
                  {selectedCharacter.attackDirections.map((dir, i) => {
                    const offset = DIRECTION_OFFSETS[dir];
                    const targetRow = selectedCharacter.row + offset.row;
                    const targetCol = selectedCharacter.col + offset.col;
                    const inBounds =
                      targetRow >= 0 &&
                      targetRow < GRID_SIZE &&
                      targetCol >= 0 &&
                      targetCol < GRID_SIZE;
                    const target = inBounds ? board[targetRow][targetCol] : null;
                    const hasEnemy = target && target.player !== currentPlayer;
                    const dirSymbols = {
                      up: '↑', down: '↓', left: '←', right: '→',
                      'up-left': '↖', 'up-right': '↗',
                      'down-left': '↙', 'down-right': '↘',
                    };

                    return (
                      <Button
                        key={i}
                        variant={selectedDirection === dir ? 'contained' : 'outlined'}
                        color={hasEnemy ? 'error' : 'primary'}
                        onClick={() => setSelectedDirection(dir)}
                        sx={{
                          minWidth: 44,
                          height: 44,
                          fontSize: '1.3rem',
                          position: 'relative',
                        }}
                      >
                        {dirSymbols[dir]}
                        {hasEnemy && (
                          <Box
                            sx={{
                              position: 'absolute',
                              top: -4,
                              right: -4,
                              bgcolor: 'warning.main',
                              color: 'white',
                              width: 16,
                              height: 16,
                              borderRadius: '50%',
                              fontSize: 10,
                              fontWeight: 'bold',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            !
                          </Box>
                        )}
                      </Button>
                    );
                  })}
                </Stack>
                {selectedDirection && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    onClick={() => onExecuteAttack(selectedAttack, selectedAttack.index)}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Use "{selectedAttack.name}"
                  </Button>
                )}
              </>
            )}

            {/* Horizontal Direction Selection (Left/Right only) */}
            {selectedAttack && selectedAttack.isHorizontalDirection && (
              <>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  2. Select Direction (Horizontal):
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center" mb={2}>
                  {['left', 'right'].map((dir) => {
                    const offset = dir === 'left' ? -1 : 1;
                    const moveDistance = selectedAttack.moveDistance || 1;
                    const targetCol = selectedCharacter.col + (offset * moveDistance);
                    const inBounds = targetCol >= 0 && targetCol < GRID_SIZE;
                    const targetTile = inBounds ? board[selectedCharacter.row][targetCol] : null;
                    const isBlocked = !inBounds || targetTile !== null;

                    return (
                      <Button
                        key={dir}
                        variant={selectedDirection === dir ? 'contained' : 'outlined'}
                        color={isBlocked ? 'error' : 'info'}
                        onClick={() => setSelectedDirection(dir)}
                        disabled={isBlocked}
                        sx={{
                          minWidth: 80,
                          height: 50,
                          fontSize: '1.5rem',
                        }}
                      >
                        {dir === 'left' ? '← Left' : 'Right →'}
                      </Button>
                    );
                  })}
                </Stack>
                {selectedDirection && (
                  <Button
                    fullWidth
                    variant="contained"
                    color="success"
                    onClick={() => onExecuteAttack(selectedAttack, selectedAttack.index)}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Move {selectedDirection === 'left' ? 'Left' : 'Right'}
                  </Button>
                )}
              </>
            )}

            {/* No Direction Needed */}
            {selectedAttack && !selectedAttack.requiresDirection && !selectedAttack.isHorizontalDirection && (
              <>
                <Typography variant="caption" color="text.secondary" mb={1} display="block">
                  2. Confirm:
                </Typography>
                <Button
                  fullWidth
                  variant="contained"
                  color="success"
                  onClick={() => onExecuteAttack(selectedAttack, selectedAttack.index)}
                  sx={{ fontWeight: 'bold' }}
                >
                  Use "{selectedAttack.name}"
                </Button>
              </>
            )}
              </>
            )}
          </>
        ) : (
          <>
            <Typography variant="caption" color="text.secondary" mb={1} display="block">
              Abilities:
            </Typography>
            <Stack spacing={1}>
              {selectedCharacter.attacks.map((attack, index) => (
                <Box key={index}>
                  <Paper
                    sx={{
                      p: 1.5,
                      bgcolor: 'action.hover',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Chip label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>{attack.cost}<EnergyIcon sx={{ fontSize: 14 }} /></Box>} size="small" />
                    <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>
                      {attack.name}
                    </Typography>
                    <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>{attack.damage}<DamageIcon sx={{ fontSize: 16 }} /></Typography>
                  </Paper>
                  {attack.description && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', mt: 0.5, px: 1, fontStyle: 'italic' }}
                    >
                      {attack.description}
                    </Typography>
                  )}
                </Box>
              ))}
            </Stack>
            <Alert severity="warning" sx={{ mt: 2 }} icon={<WarningAmberIcon />}>
              Enemy character
            </Alert>
          </>
        )}
      </Box>
    </Paper>

    {/* Magnified Card Modal */}
    <Modal open={showMagnified} onClose={() => setShowMagnified(false)} aria-labelledby="card-modal-title">
      <Box
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '90vw',
          maxHeight: '90vh',
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 24,
          outline: 'none',
          overflow: 'hidden',
        }}
      >
        <IconButton
          onClick={() => setShowMagnified(false)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            bgcolor: 'rgba(0,0,0,0.7)',
            color: 'white',
            zIndex: 10,
            '&:hover': { bgcolor: 'error.main' },
          }}
        >
          <CloseIcon />
        </IconButton>
        {imageUrl ? (
          <Box
            component="img"
            src={imageUrl}
            alt={selectedCharacter.name}
            sx={{
              width: '100%',
              maxHeight: '85vh',
              objectFit: 'contain',
              display: 'block',
            }}
          />
        ) : (
          <Box
            sx={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white',
              p: 4,
              minWidth: 320,
              textAlign: 'center',
            }}
          >
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              {selectedCharacter.name}
            </Typography>
            <Typography
              variant="overline"
              sx={{ letterSpacing: 2, opacity: 0.8, display: 'block', mb: 2 }}
            >
              {selectedCharacter.class}
            </Typography>
            <Typography variant="h6" fontWeight="bold" mb={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
              {selectedCharacter.cost}<EnergyIcon sx={{ fontSize: 18 }} /> | <HeartIcon sx={{ fontSize: 18 }} /> {selectedCharacter.hp}
            </Typography>
            <Paper
              sx={{
                bgcolor: 'rgba(0,0,0,0.2)',
                borderRadius: 2,
                p: 2,
                textAlign: 'left',
              }}
            >
              <Typography variant="subtitle2" sx={{ opacity: 0.9, mb: 1.5 }}>
                Abilities:
              </Typography>
              <Stack spacing={2} divider={<Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }} />}>
                {selectedCharacter.attacks.map((attack, index) => (
                  <Box key={index}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        {attack.cost}<EnergyIcon sx={{ fontSize: 14 }} />
                      </Typography>
                      <Typography variant="body2" fontWeight="bold" sx={{ flex: 1 }}>
                        {attack.name}
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>
                        {attack.damage > 0 ? <>{attack.damage}<DamageIcon sx={{ fontSize: 14 }} /></> : <MagicIcon sx={{ fontSize: 14 }} />}
                      </Typography>
                    </Stack>
                    {attack.description && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 0.75,
                          opacity: 0.9,
                          lineHeight: 1.4,
                          fontStyle: 'italic',
                        }}
                      >
                        {attack.description}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>
        )}
      </Box>
    </Modal>
    </>
  );
}

export default AttackPanel;
