import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Chip,
  Stack,
  Divider,
  Switch,
  FormControlLabel,
  Collapse,
  IconButton,
  Tooltip,
  Button,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BugReportIcon from '@mui/icons-material/BugReport';
import { HeartIcon } from './icons/GameIcons';
import { CHARACTER_TEMPLATES } from '../config/gameConfig';

export default function CheatPanel({
  onPlaceCard,
  cheatModeEnabled,
  onToggleCheatMode,
  infiniteEnergy,
  onToggleInfiniteEnergy,
  onClearBoard,
  board,
}) {
  const [expanded, setExpanded] = useState(false);

  // Get available cards (excluding energy cards)
  const characterCards = CHARACTER_TEMPLATES.filter(card => card.type === 'Character');

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 1000,
        maxWidth: expanded ? 800 : 200,
        transition: 'max-width 0.3s ease',
        bgcolor: 'rgba(0, 0, 0, 0.9)',
        color: 'white',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
          bgcolor: 'error.dark',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <BugReportIcon />
          <Typography variant="subtitle2" fontWeight="bold">
            Cheat Panel
          </Typography>
        </Stack>
        <IconButton size="small" sx={{ color: 'white' }}>
          {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
        </IconButton>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ p: 2 }}>
          {/* Toggle Switches */}
          <Stack spacing={1} mb={2}>
            <FormControlLabel
              control={
                <Switch
                  checked={cheatModeEnabled}
                  onChange={onToggleCheatMode}
                  color="error"
                  size="small"
                />
              }
              label={
                <Typography variant="caption" color="white">
                  Cheat Mode (Place Any Card)
                </Typography>
              }
            />
            <FormControlLabel
              control={
                <Switch
                  checked={infiniteEnergy}
                  onChange={onToggleInfiniteEnergy}
                  color="error"
                  size="small"
                />
              }
              label={
                <Typography variant="caption" color="white">
                  Infinite Energy (0 Cost Abilities)
                </Typography>
              }
            />
            <Button
              variant="outlined"
              color="error"
              size="small"
              onClick={onClearBoard}
              sx={{ mt: 1 }}
            >
              Clear Board
            </Button>
          </Stack>

          {cheatModeEnabled && (
            <>
              <Divider sx={{ my: 1, borderColor: 'rgba(255,255,255,0.2)' }} />

              {/* Card Selection */}
              <Stack direction="row" spacing={2}>
                {/* Player 1 Cards */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'primary.light',
                      fontWeight: 'bold',
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    Player 1 Cards
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 300,
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': { width: 6 },
                      '&::-webkit-scrollbar-thumb': { bgcolor: 'primary.main', borderRadius: 3 },
                    }}
                  >
                    <Stack spacing={0.5}>
                      {characterCards.map((card) => (
                        <Tooltip
                          key={`p1-${card.id}`}
                          title={`${card.name} - ${card.hp} HP - Cost: ${card.cost}`}
                          placement="left"
                        >
                          <Chip
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span style={{ fontSize: '0.7rem' }}>{card.name}</span>
                                <HeartIcon sx={{ fontSize: 10 }} />
                                <span style={{ fontSize: '0.65rem' }}>{card.hp}</span>
                              </Box>
                            }
                            size="small"
                            onClick={() => onPlaceCard(card, 1)}
                            sx={{
                              bgcolor: 'rgba(52, 152, 219, 0.3)',
                              color: 'white',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'primary.dark' },
                              height: 24,
                              fontSize: '0.65rem',
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Stack>
                  </Box>
                </Box>

                {/* Player 2 Cards */}
                <Box sx={{ flex: 1 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'secondary.light',
                      fontWeight: 'bold',
                      display: 'block',
                      mb: 1,
                    }}
                  >
                    Player 2 Cards
                  </Typography>
                  <Box
                    sx={{
                      maxHeight: 300,
                      overflowY: 'auto',
                      '&::-webkit-scrollbar': { width: 6 },
                      '&::-webkit-scrollbar-thumb': { bgcolor: 'secondary.main', borderRadius: 3 },
                    }}
                  >
                    <Stack spacing={0.5}>
                      {characterCards.map((card) => (
                        <Tooltip
                          key={`p2-${card.id}`}
                          title={`${card.name} - ${card.hp} HP - Cost: ${card.cost}`}
                          placement="right"
                        >
                          <Chip
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <span style={{ fontSize: '0.7rem' }}>{card.name}</span>
                                <HeartIcon sx={{ fontSize: 10 }} />
                                <span style={{ fontSize: '0.65rem' }}>{card.hp}</span>
                              </Box>
                            }
                            size="small"
                            onClick={() => onPlaceCard(card, 2)}
                            sx={{
                              bgcolor: 'rgba(231, 76, 60, 0.3)',
                              color: 'white',
                              cursor: 'pointer',
                              '&:hover': { bgcolor: 'secondary.dark' },
                              height: 24,
                              fontSize: '0.65rem',
                            }}
                          />
                        </Tooltip>
                      ))}
                    </Stack>
                  </Box>
                </Box>
              </Stack>
            </>
          )}
        </Box>
      </Collapse>
    </Paper>
  );
}

// Export the selected card state for use in GameBoard
export { };
