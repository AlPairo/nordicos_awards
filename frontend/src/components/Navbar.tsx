import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Avatar } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import logoNA from '../assets/images/logoNA.png';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'rgba(10, 10, 10, 0.95)',
  backdropFilter: 'blur(10px)',
  borderBottom: '2px solid #D4AF37',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.8)',
}));

const LogoBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.05)',
  },
}));

const NavButton = styled(Button)(({ theme }) => ({
  color: '#FFFFFF',
  fontWeight: 500,
  textTransform: 'none',
  borderRadius: 8,
  padding: '8px 16px',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: 'rgba(212, 175, 55, 0.1)',
    color: '#D4AF37',
    transform: 'translateY(-2px)',
  },
}));

const LogoutButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #D4AF37, #FFD700)',
  color: '#000000',
  fontWeight: 600,
  textTransform: 'none',
  borderRadius: 20,
  padding: '8px 20px',
  '&:hover': {
    background: 'linear-gradient(45deg, #FFD700, #D4AF37)',
    transform: 'translateY(-1px)',
    boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)',
  },
}));

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <StyledAppBar position="sticky">
      <Toolbar sx={{ py: 1 }}>
        <LogoBox 
          sx={{ flexGrow: 1 }}
          onClick={() => navigate('/')}
        >
          <Avatar sx={{ width: 40, height: 40, bgcolor: 'transparent' }}>
            <svg width="40" height="40" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGradientNav" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor: '#FFD700', stopOpacity: 1}} />
                  <stop offset="50%" style={{stopColor: '#D4AF37', stopOpacity: 1}} />
                  <stop offset="100%" style={{stopColor: '#B8860B', stopOpacity: 1}} />
                </linearGradient>
              </defs>
              
              <path d="M100 20 L160 50 L160 120 Q160 160 100 180 Q40 160 40 120 L40 50 Z" 
                    fill="url(#logoGradientNav)" 
                    stroke="#D4AF37" 
                    strokeWidth="2" />
              
               <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <img 
                src={logoNA} 
                alt="Nordicos FC Logo" 
                style={{ 
                    height: '60px', 
                    width: 'auto'
                }} 
                />
            </Typography>
             
              
              <text x="100" y="45" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#D4AF37">NA</text>
            </svg>
          </Avatar>
          <Typography 
            variant="h5" 
            component="div" 
            sx={{ 
              fontFamily: '"Playfair Display", serif',
              fontWeight: 700,
              background: 'linear-gradient(45deg, #D4AF37, #FFD700)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
            }}
          >
            Nordicos Awards
          </Typography>
        </LogoBox>
        
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {user ? (
            <>
              <NavButton onClick={() => navigate('/voting')}>
                Votación
              </NavButton>
              <NavButton onClick={() => navigate('/upload')}>
                Subir Contenido
              </NavButton>
              {isAdmin && (
                <NavButton onClick={() => navigate('/admin')}>
                  Admin
                </NavButton>
              )}
              <NavButton onClick={() => navigate('/results')}>
                Resultados
              </NavButton>
              <LogoutButton onClick={handleLogout}>
                Salir ({user.full_name})
              </LogoutButton>
            </>
          ) : (
            <>
              <NavButton onClick={() => navigate('/login')}>
                Iniciar Sesión
              </NavButton>
              <LogoutButton onClick={() => navigate('/register')}>
                Registrarse
              </LogoutButton>
            </>
          )}
        </Box>
      </Toolbar>
    </StyledAppBar>
  );
};

export default Navbar;