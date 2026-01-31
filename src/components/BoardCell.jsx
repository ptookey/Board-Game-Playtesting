import { Box, Stack, Typography, Chip, Tooltip } from '@mui/material';
import {
  HeartIcon,
  TowerIcon,
  STATUS_EFFECT_COLORS,
  getStatusEffectIcon,
} from './icons/GameIcons';
import { getCardImageUrl } from './CharacterCard';

function BoardCell({ 
  cell, 
  isSelected, 
  isClickable, 
  onClick, 
  playerNumber, 
  showTowerPreview, 
  isHovered, 
  onMouseEnter, 
  onMouseLeave,
  highlightColor,
}) {
  const imageUrl = cell?.image ? getCardImageUrl(cell.image) : null;
  
  // Determine border styling
  const hasBorder = isSelected || (isHovered && showTowerPreview) || highlightColor;
  const borderWidth = isSelected ? 3 : (isHovered && showTowerPreview) || highlightColor ? 2 : 0;
  const borderCol = isSelected ? 'warning.main' : highlightColor || 'success.main';
  
  return (
    <Box
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      sx={{
        width: 80,
        height: 80,
        bgcolor: cell
          ? cell.player === 1
            ? 'player1.light'
            : 'player2.light'
          : highlightColor
            ? 'rgba(255, 152, 0, 0.2)'
            : isHovered && showTowerPreview
              ? playerNumber === 1 ? 'primary.light' : 'secondary.light'
              : 'grey.200',
        borderRadius: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: isClickable || showTowerPreview || highlightColor ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        position: 'relative',
        border: borderWidth,
        borderColor: borderCol,
        boxShadow: isSelected ? '0 0 10px rgba(243, 156, 18, 0.5)' : highlightColor ? '0 0 8px rgba(255, 152, 0, 0.5)' : isHovered && showTowerPreview ? '0 0 8px rgba(46, 204, 113, 0.5)' : 'none',
        transform: isSelected ? 'scale(1.05)' : (isHovered && showTowerPreview) || highlightColor ? 'scale(1.03)' : 'scale(1)',
        zIndex: isSelected ? 1 : (isHovered && showTowerPreview) || highlightColor ? 1 : 0,
        '&:hover': (isClickable || showTowerPreview || highlightColor) && !cell
          ? {
              transform: 'scale(1.03)',
            }
          : {},
      }}
    >
      {/* Tower Preview on Hover */}
      {!cell && isHovered && showTowerPreview && (
        <Stack alignItems="center" spacing={0} sx={{ opacity: 0.5 }}>
          <TowerIcon sx={{ fontSize: 28, color: playerNumber === 1 ? 'primary.main' : 'secondary.main' }} />
          <Chip
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}><HeartIcon sx={{ fontSize: 12 }} />10</Box>}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.7rem',
              bgcolor: playerNumber === 1 ? 'primary.main' : 'secondary.main',
              color: 'white',
            }}
          />
        </Stack>
      )}
      {cell && cell.type === 'tower' && (
        <Stack alignItems="center" spacing={0}>
          <TowerIcon sx={{ fontSize: 28, color: cell.player === 1 ? 'primary.main' : 'secondary.main' }} />
          <Chip
            label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}><HeartIcon sx={{ fontSize: 12 }} />{cell.hp}</Box>}
            size="small"
            sx={{
              height: 18,
              fontSize: '0.7rem',
              bgcolor: cell.player === 1 ? 'primary.main' : 'secondary.main',
              color: 'white',
            }}
          />
        </Stack>
      )}
      {cell && cell.type === 'character' && (
        <Box
          sx={{
            width: '100%',
            height: '100%',
            position: 'relative',
            borderRadius: 1,
            overflow: 'hidden',
            // Trapped characters are semi-transparent (trapped in another dimension)
            opacity: cell.statusEffects?.some(e => e.type === 'trapped') ? 0.15 : 1,
            filter: cell.statusEffects?.some(e => e.type === 'trapped') ? 'grayscale(0.5)' : 'none',
            transition: 'opacity 0.3s ease, filter 0.3s ease',
          }}
        >
          {/* Status Effect Icons - Top Right Corner */}
          {cell.statusEffects && cell.statusEffects.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 2,
                right: 2,
                display: 'flex',
                flexDirection: 'column',
                gap: 0.25,
                zIndex: 10,
              }}
            >
              {cell.statusEffects.map((effect, index) => {
                const IconComponent = getStatusEffectIcon(effect.type);
                const color = STATUS_EFFECT_COLORS[effect.type] || '#fff';
                return (
                  <Tooltip 
                    key={index}
                    title={`${effect.type.toUpperCase()} (${effect.turnsRemaining} turns remaining)`}
                    arrow
                    placement="left"
                  >
                    <Box
                      sx={{
                        bgcolor: 'rgba(0,0,0,0.7)',
                        borderRadius: '50%',
                        p: 0.25,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'help',
                      }}
                    >
                      <IconComponent sx={{ fontSize: 14, color }} />
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
          )}
          {imageUrl ? (
            <>
              <Box
                component="img"
                src={imageUrl}
                alt={cell.name}
                sx={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
              {/* Player color tint overlay */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: cell.player === 1 
                    ? 'rgba(52, 152, 219, 0.35)' // Blue tint for player 1
                    : 'rgba(231, 76, 60, 0.35)', // Red tint for player 2
                  pointerEvents: 'none',
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                  p: 0.5,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="caption"
                  fontWeight="bold"
                  color="white"
                  sx={{ textShadow: '0 1px 2px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', gap: 0.25 }}
                >
                  <HeartIcon sx={{ fontSize: 12 }} />{cell.hp}
                </Typography>
              </Box>
            </>
          ) : (
            <Stack 
              alignItems="center" 
              justifyContent="center" 
              height="100%"
              sx={{
                background: cell.player === 1 
                  ? 'linear-gradient(135deg, #3498db, #2980b9)'
                  : 'linear-gradient(135deg, #e74c3c, #c0392b)',
                borderRadius: 1,
              }}
            >
              <Typography
                variant="caption"
                fontWeight="bold"
                textTransform="uppercase"
                color="white"
                textAlign="center"
                sx={{ 
                  fontSize: '0.65rem',
                  lineHeight: 1.1,
                  px: 0.5,
                  textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                }}
              >
                {cell.name.length > 8 ? cell.name.slice(0, 6) + '...' : cell.name}
              </Typography>
              <Chip
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}><HeartIcon sx={{ fontSize: 12 }} />{cell.hp}</Box>}
                size="small"
                sx={{
                  mt: 0.5,
                  height: 18,
                  fontSize: '0.65rem',
                  bgcolor: 'rgba(0,0,0,0.4)',
                  color: 'white',
                }}
              />
            </Stack>
          )}
        </Box>
      )}
    </Box>
  );
}

export default BoardCell;
