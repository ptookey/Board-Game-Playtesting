import { Paper, Typography, Stack } from '@mui/material';
import {
  EnergyIcon,
  DeckIcon,
  HandIcon,
  TowerIcon,
  InlineIcon,
} from './icons/GameIcons';

function PlayerInfo({ player, playerNumber, isActive }) {
  const color = playerNumber === 1 ? 'primary' : 'secondary';
  
  return (
    <Paper
      elevation={isActive ? 6 : 1}
      sx={{
        p: 2,
        minWidth: 150,
        bgcolor: 'background.paper',
        border: isActive ? 2 : 0,
        borderColor: `${color}.main`,
      }}
    >
      <Typography variant="h6" color={`${color}.main`} fontWeight="bold" gutterBottom>
        Player {playerNumber}
      </Typography>
      <Stack spacing={0.5}>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <InlineIcon><EnergyIcon /></InlineIcon> Energy: {player.energy}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <InlineIcon><DeckIcon /></InlineIcon> Deck: {player.deck.length}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <InlineIcon><HandIcon /></InlineIcon> Hand: {player.hand.length}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <InlineIcon><TowerIcon /></InlineIcon> Towers: {player.towersPlacedTotal}/2
        </Typography>
      </Stack>
    </Paper>
  );
}

export default PlayerInfo;
