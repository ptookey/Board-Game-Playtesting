import { ThemeProvider, CssBaseline, Box } from '@mui/material';
import GameBoard from './components/GameBoard';
import theme from './theme/theme';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          p: { xs: 1, sm: 2.5 },
        }}
      >
        <GameBoard />
      </Box>
    </ThemeProvider>
  );
}

export default App;
