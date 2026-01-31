import { Card, CardContent, Typography, Zoom } from '@mui/material';
import { EnergyIcon } from './icons/GameIcons';
import { Button } from '@mui/material';
import { Box } from '@mui/system';

function EnergyCard({ card, isSelected, onClick, gamePhase, playEnergyCard, selectedCard }) {
  return (
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
        background: 'linear-gradient(135deg, #f39c12, #e67e22)',
        color: 'white',
        '&:hover': {
          transform: isSelected ? 'translateY(-10px)' : 'translateY(-5px)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        },
        position: 'relative',
        overflow: 'visible',
      }}
    >
      {isSelected && (
        <Box sx={{ position: 'absolute', top: -32, right: '50%', transform: 'translateX(50%)', zIndex: 1 }}>
          <Zoom in={true}>
            <Button
              variant="contained"
              sx={{
                bgcolor: '#f1c40f',
                color: '#2c3e50',
                '&:hover': { bgcolor: '#d4ac0d' },
              }}
              startIcon={<EnergyIcon />}
              onClick={playEnergyCard}
              disabled={!selectedCard || selectedCard.type !== 'Energy'}
            >
              Play
            </Button>
          </Zoom>
        </Box>
      )}
      <CardContent
        sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
        }}
      >
        <Typography
          variant="overline"
          sx={{ opacity: 0.8, letterSpacing: 1 }}
        >
          {card.type}
        </Typography>
        <Typography variant="body2" fontWeight="bold" textAlign="center">
          {card.name}
        </Typography>
        <Typography variant="h5" fontWeight="bold" textAlign="center" mt="auto" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
          +{card.value} <EnergyIcon sx={{ fontSize: 20 }} />
        </Typography>
      </CardContent>
    </Card>
  );
}

export default EnergyCard;
