import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Modal,
  IconButton,
  Chip,
  Stack,
  Paper,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { DIRECTIONS, DIRECTION_SYMBOLS } from '../config/gameConfig';
import { EnergyIcon, HeartIcon, DamageIcon, MagicIcon, InlineIcon } from './icons/GameIcons';

// Import all card images from ScottCards folder
const cardImages = import.meta.glob('../assets/ScottCards/*', { eager: true });

// Helper to get the image URL for a card
export const getCardImageUrl = (imageName) => {
  if (!imageName) return null;
  const imagePath = `../assets/ScottCards/${imageName}`;
  const imageModule = cardImages[imagePath];
  return imageModule?.default || null;
};

export default function CharacterCard({
  character,
  isSelected = false,
  onClick,
  showDetails = false,
}) {
  const [showMagnified, setShowMagnified] = useState(false);
  const { name, hp, cost, attacks, attackDirections, image, class: cardClass } = character;
  const imageUrl = getCardImageUrl(image);

  const handleMagnifyClick = (e) => {
    e.stopPropagation();
    setShowMagnified(true);
  };

  const closeMagnified = () => {
    setShowMagnified(false);
  };

  // Get class-based gradient colors
  const getClassGradient = () => {
    const classGradients = {
      warrior: 'linear-gradient(135deg, #e74c3c, #c0392b)',
      mage: 'linear-gradient(135deg, #9b59b6, #8e44ad)',
      rogue: 'linear-gradient(135deg, #1abc9c, #16a085)',
      healer: 'linear-gradient(135deg, #3498db, #2980b9)',
      tank: 'linear-gradient(135deg, #95a5a6, #7f8c8d)',
      chepperland: 'linear-gradient(135deg, #f39c12, #d68910)',
      ascendance: 'linear-gradient(135deg, #667eea, #764ba2)',
    };
    return classGradients[cardClass?.toLowerCase()] || 'linear-gradient(135deg, #e74c3c, #c0392b)';
  };

  return (
    <>
      <Card
        onClick={onClick}
        sx={{
          width: 140,
          minHeight: 180,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          border: isSelected ? 3 : 0,
          borderColor: 'warning.main',
          transform: isSelected ? 'translateY(-10px)' : 'none',
          boxShadow: isSelected
            ? '0 6px 12px rgba(243, 156, 18, 0.4)'
            : '0 2px 4px rgba(0,0,0,0.1)',
          background: getClassGradient(),
          color: 'white',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          '&:hover': {
            transform: isSelected ? 'translateY(-10px)' : 'translateY(-5px)',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          },
        }}
      >
        {imageUrl ? (
          <Box sx={{ position: 'relative', width: '100%' }}>
            <Box
              component="img"
              src={imageUrl}
              alt={name}
              sx={{
                width: '100%',
                height: 'auto',
                display: 'block',
                borderRadius: '4px 4px 0 0',
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                display: 'flex',
                justifyContent: 'space-between',
                p: 0.5,
                background: 'linear-gradient(to bottom, rgba(0,0,0,0.6), transparent)',
              }}
            >
              <Chip
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>{cost}<EnergyIcon sx={{ fontSize: 12 }} /></Box>}
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  fontWeight: 'bold',
                  height: 22,
                  fontSize: '0.75rem',
                }}
              />
              <Chip
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}><HeartIcon sx={{ fontSize: 12 }} /> {hp}</Box>}
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  fontWeight: 'bold',
                  height: 22,
                  fontSize: '0.75rem',
                }}
              />
            </Box>
            <IconButton
              onClick={handleMagnifyClick}
              title="View card details"
              size="small"
              sx={{
                position: 'absolute',
                bottom: 4,
                right: 4,
                bgcolor: 'rgba(0,0,0,0.6)',
                color: 'white',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
              }}
            >
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Box>
        ) : (
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1, flex: 1, p: 1.5, height: '100%' }}>
            {/* Class Label */}
            <Typography 
              variant="overline" 
              sx={{ 
                opacity: 0.8, 
                letterSpacing: 1, 
                fontSize: '0.6rem',
                textAlign: 'center',
              }}
            >
              {cardClass || 'Character'}
            </Typography>
            
            {/* Card Name - centered and wrapped */}
            <Typography 
              variant="body2" 
              fontWeight="bold" 
              textAlign="center"
              sx={{ 
                fontSize: '0.85rem',
                lineHeight: 1.2,
                minHeight: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {name}
            </Typography>
            
            {/* Stats Row */}
            <Stack direction="row" justifyContent="center" spacing={1} sx={{ mt: 'auto' }}>
              <Chip
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}>{cost}<EnergyIcon sx={{ fontSize: 12 }} /></Box>}
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  color: 'white',
                  fontWeight: 'bold',
                  height: 22,
                  fontSize: '0.75rem',
                }}
              />
              <Chip
                label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.25 }}><HeartIcon sx={{ fontSize: 12 }} /> {hp}</Box>}
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 0, 0, 0.3)',
                  color: 'white',
                  fontWeight: 'bold',
                  height: 22,
                  fontSize: '0.75rem',
                }}
              />
            </Stack>
            
            {/* Magnify Button */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
              <IconButton
                onClick={handleMagnifyClick}
                title="View card details"
                size="small"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.3)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
                }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Box>
          </CardContent>
        )}

        {showDetails && (
          <CardContent sx={{ p: 1, pt: 0 }}>
            {/* Direction Grid */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gridTemplateRows: 'repeat(3, 1fr)',
                  gap: '1px',
                  width: 50,
                  height: 50,
                  bgcolor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: 1,
                  p: 0.25,
                }}
              >
                {Object.entries(DIRECTIONS).map(([key, dir]) => {
                  const isActive = attackDirections.includes(dir);
                  const gridPositions = {
                    UP_LEFT: '1 / 1',
                    LEFT: '2 / 1',
                    DOWN_LEFT: '3 / 1',
                    UP: '1 / 2',
                    DOWN: '3 / 2',
                    UP_RIGHT: '1 / 3',
                    RIGHT: '2 / 3',
                    DOWN_RIGHT: '3 / 3',
                  };
                  return (
                    <Box
                      key={key}
                      sx={{
                        gridArea: gridPositions[key],
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.7em',
                        opacity: isActive ? 1 : 0.3,
                        bgcolor: isActive ? 'rgba(255, 255, 255, 0.3)' : 'transparent',
                        borderRadius: 0.5,
                      }}
                    >
                      {DIRECTION_SYMBOLS[dir]}
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Attacks */}
            <Stack spacing={0.5}>
              {attacks.map((attack, index) => (
                <Paper
                  key={index}
                  sx={{
                    bgcolor: 'rgba(0, 0, 0, 0.2)',
                    p: 0.5,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Typography variant="caption" fontWeight={500}>
                    {attack.name}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9, display: 'flex', alignItems: 'center', gap: 0.25 }}>
                    {attack.cost}<EnergyIcon sx={{ fontSize: 10 }} /> → {attack.damage}<DamageIcon sx={{ fontSize: 10 }} />
                  </Typography>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        )}
      </Card>

      {/* Magnified Modal */}
      <Modal open={showMagnified} onClose={closeMagnified} aria-labelledby="card-modal-title">
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
            onClick={closeMagnified}
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
              alt={name}
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
                {name}
              </Typography>
              <Typography
                variant="overline"
                sx={{ letterSpacing: 2, opacity: 0.8, display: 'block', mb: 2 }}
              >
                {cardClass}
              </Typography>
              <Typography variant="h6" fontWeight="bold" mb={3} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                {cost}<EnergyIcon sx={{ fontSize: 18 }} /> | <HeartIcon sx={{ fontSize: 18 }} /> {hp}
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
                  {attacks.map((attack, index) => (
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

// Helper to create a character card data object
export function createCharacter({ id, name, hp, cost, attacks = [], attackDirections = [] }) {
  return {
    id,
    type: 'Character',
    name,
    hp,
    cost,
    attacks,
    attackDirections,
  };
}

// Re-export from config for backward compatibility
export { DIRECTIONS, ATTACK_TEMPLATES, CHARACTER_TEMPLATES } from '../config/gameConfig';
