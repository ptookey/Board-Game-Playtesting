import { useState, useEffect } from 'react';
import { Box, Typography, Fade } from '@mui/material';
import {
  TowerIcon,
  BattleIcon,
  Player1Icon,
  Player2Icon,
  GameIcon,
} from './icons/GameIcons';

function PhaseAnnouncement({ announcement, onComplete }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (announcement) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(onComplete, 300); // Wait for fade out
      }, 1000); // Show for 1 second
      return () => clearTimeout(timer);
    }
  }, [announcement, onComplete]);

  if (!announcement) return null;

  const getAnnouncementStyle = () => {
    switch (announcement.type) {
      case 'towering':
        return {
          bgcolor: 'rgba(230, 126, 34, 0.85)',
          icon: <TowerIcon sx={{ fontSize: 48 }} />,
          gradient: 'linear-gradient(135deg, rgba(230, 126, 34, 0.9), rgba(211, 84, 0, 0.9))',
        };
      case 'playing':
        return {
          bgcolor: 'rgba(46, 204, 113, 0.85)',
          icon: <BattleIcon sx={{ fontSize: 48 }} />,
          gradient: 'linear-gradient(135deg, rgba(46, 204, 113, 0.9), rgba(39, 174, 96, 0.9))',
        };
      case 'turn':
        return {
          bgcolor: announcement.player === 1 ? 'rgba(52, 152, 219, 0.85)' : 'rgba(231, 76, 60, 0.85)',
          icon: announcement.player === 1 ? <Player1Icon sx={{ fontSize: 48 }} /> : <Player2Icon sx={{ fontSize: 48 }} />,
          gradient: announcement.player === 1 
            ? 'linear-gradient(135deg, rgba(52, 152, 219, 0.9), rgba(41, 128, 185, 0.9))'
            : 'linear-gradient(135deg, rgba(231, 76, 60, 0.9), rgba(192, 57, 43, 0.9))',
        };
      default:
        return {
          bgcolor: 'rgba(0, 0, 0, 0.7)',
          icon: <GameIcon sx={{ fontSize: 48 }} />,
          gradient: 'linear-gradient(135deg, rgba(44, 62, 80, 0.9), rgba(52, 73, 94, 0.9))',
        };
    }
  };

  const style = getAnnouncementStyle();

  return (
    <Fade in={visible} timeout={300}>
      <Box
        sx={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '100vw',
          height: 200,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: style.gradient,
          zIndex: 9999,
          pointerEvents: 'none',
          boxShadow: '0 0 60px rgba(0,0,0,0.5)',
        }}
      >
        <Box
          sx={{
            textAlign: 'center',
            color: 'white',
            animation: 'slideIn 0.3s ease-out',
            '@keyframes slideIn': {
              '0%': { transform: 'scale(0.8)', opacity: 0 },
              '100%': { transform: 'scale(1)', opacity: 1 },
            },
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 'bold',
              textShadow: '0 4px 20px rgba(0,0,0,0.4)',
              letterSpacing: 4,
              mb: 1,
            }}
          >
            {style.icon} {announcement.text} {style.icon}
          </Typography>
          {announcement.subtext && (
            <Typography
              variant="h5"
              sx={{
                opacity: 0.9,
                textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                letterSpacing: 2,
              }}
            >
              {announcement.subtext}
            </Typography>
          )}
        </Box>
      </Box>
    </Fade>
  );
}

export default PhaseAnnouncement;
