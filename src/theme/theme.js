import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#3498db',
      light: '#5dade2',
      dark: '#2980b9',
    },
    secondary: {
      main: '#e74c3c',
      light: '#f5b7b1',
      dark: '#c0392b',
    },
    success: {
      main: '#2ecc71',
      dark: '#27ae60',
    },
    warning: {
      main: '#f39c12',
      dark: '#e67e22',
    },
    info: {
      main: '#9b59b6',
    },
    background: {
      default: '#667eea',
      paper: '#ffffff',
    },
    player1: {
      main: '#3498db',
      light: '#d4e6f1',
      contrastText: '#ffffff',
    },
    player2: {
      main: '#e74c3c',
      light: '#f5b7b1',
      contrastText: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
    h1: {
      fontSize: '2rem',
      fontWeight: 600,
    },
    h3: {
      fontSize: '1.2rem',
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 'bold',
          borderRadius: 8,
          padding: '12px 24px',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 'bold',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default theme;
