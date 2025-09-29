import React, { useState } from 'react';
import {
  Container,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
  InputAdornment,
  IconButton,
  Fade,
  Slide,
  Avatar,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials } from '../types';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const goldShimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-15px); }
`;

const LoginContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `
    radial-gradient(circle at 20% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 80%, rgba(212, 175, 55, 0.05) 0%, transparent 50%),
    linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)
  `,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><circle cx="100" cy="100" r="2" fill="%23D4AF37" opacity="0.3"/><circle cx="300" cy="200" r="1" fill="%23FFD700" opacity="0.4"/><circle cx="500" cy="300" r="2" fill="%23D4AF37" opacity="0.2"/><circle cx="700" cy="400" r="1" fill="%23FFD700" opacity="0.3"/><circle cx="900" cy="500" r="2" fill="%23D4AF37" opacity="0.4"/><circle cx="200" cy="600" r="1" fill="%23FFD700" opacity="0.2"/><circle cx="400" cy="700" r="2" fill="%23D4AF37" opacity="0.3"/><circle cx="600" cy="800" r="1" fill="%23FFD700" opacity="0.4"/><circle cx="800" cy="900" r="2" fill="%23D4AF37" opacity="0.2"/></svg>')`,
    pointerEvents: 'none',
  },
}));

const LoginCard = styled(Box)(({ theme }) => ({
  background: 'rgba(26, 26, 26, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: 24,
  border: '1px solid rgba(212, 175, 55, 0.3)',
  padding: theme.spacing(6),
  width: '100%',
  maxWidth: 480,
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(212, 175, 55, 0.1)',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent)',
    animation: `${goldShimmer} 3s infinite`,
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(4),
  '& svg': {
    animation: `${float} 4s ease-in-out infinite`,
    filter: 'drop-shadow(0 0 30px rgba(212, 175, 55, 0.6))',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    transition: 'all 0.3s ease',
    '& fieldset': {
      borderColor: 'rgba(212, 175, 55, 0.3)',
      borderWidth: 2,
    },
    '&:hover fieldset': {
      borderColor: 'rgba(212, 175, 55, 0.6)',
      boxShadow: '0 0 20px rgba(212, 175, 55, 0.2)',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#D4AF37',
      boxShadow: '0 0 25px rgba(212, 175, 55, 0.3)',
    },
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(212, 175, 55, 0.8)',
    '&.Mui-focused': {
      color: '#D4AF37',
    },
  },
}));

const PremiumButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%)',
  color: '#000000',
  fontWeight: 700,
  fontSize: '1.1rem',
  padding: '16px 0',
  borderRadius: 12,
  textTransform: 'none',
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 8px 32px rgba(212, 175, 55, 0.4)',
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
  },
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px rgba(212, 175, 55, 0.6)',
    background: 'linear-gradient(45deg, #FFD700 0%, #D4AF37 50%, #FFD700 100%)',
    '&::before': {
      left: '100%',
      transition: 'left 0.6s',
    },
  },
  '&:disabled': {
    background: 'rgba(212, 175, 55, 0.3)',
    color: 'rgba(0, 0, 0, 0.5)',
  },
}));

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginCredentials>();

  const onSubmit = async (data: LoginCredentials) => {
    setLoading(true);
    setError('');
    
    try {
      await login(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginContainer>
      <Container maxWidth="sm">
        <Fade in timeout={1000}>
          <LoginCard>
            <LogoContainer>
              <svg width="100" height="100" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGradientLogin" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{stopColor: '#FFD700', stopOpacity: 1}} />
                    <stop offset="50%" style={{stopColor: '#D4AF37', stopOpacity: 1}} />
                    <stop offset="100%" style={{stopColor: '#B8860B', stopOpacity: 1}} />
                  </linearGradient>
                  <filter id="glowLogin">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                    <feMerge> 
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
                
                <path d="M100 20 L160 50 L160 120 Q160 160 100 180 Q40 160 40 120 L40 50 Z" 
                      fill="url(#logoGradientLogin)" 
                      stroke="#D4AF37" 
                      strokeWidth="2"
                      filter="url(#glowLogin)" />
                
                <ellipse cx="100" cy="80" rx="25" ry="20" fill="#2C3E50" stroke="#D4AF37" strokeWidth="1"/>
                <path d="M80 70 Q100 60 120 70" fill="none" stroke="#D4AF37" strokeWidth="2"/>
                
                <path d="M80 70 Q70 50 75 45" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"/>
                <path d="M120 70 Q130 50 125 45" fill="none" stroke="#D4AF37" strokeWidth="3" strokeLinecap="round"/>
                
                <g transform="translate(100,120)">
                  <line x1="-20" y1="-10" x2="20" y2="10" stroke="#8B4513" strokeWidth="3"/>
                  <line x1="20" y1="-10" x2="-20" y2="10" stroke="#8B4513" strokeWidth="3"/>
                  <ellipse cx="-15" cy="-5" rx="8" ry="12" fill="#C0C0C0" stroke="#D4AF37" strokeWidth="1"/>
                  <ellipse cx="15" cy="5" rx="8" ry="12" fill="#C0C0C0" stroke="#D4AF37" strokeWidth="1"/>
                  <ellipse cx="15" cy="-5" rx="8" ry="12" fill="#C0C0C0" stroke="#D4AF37" strokeWidth="1"/>
                  <ellipse cx="-15" cy="5" rx="8" ry="12" fill="#C0C0C0" stroke="#D4AF37" strokeWidth="1"/>
                </g>
                
                <g transform="translate(100,150)">
                  <circle r="3" fill="#87CEEB"/>
                  <line x1="-8" y1="0" x2="8" y2="0" stroke="#87CEEB" strokeWidth="2"/>
                  <line x1="0" y1="-8" x2="0" y2="8" stroke="#87CEEB" strokeWidth="2"/>
                  <line x1="-6" y1="-6" x2="6" y2="6" stroke="#87CEEB" strokeWidth="1"/>
                  <line x1="6" y1="-6" x2="-6" y2="6" stroke="#87CEEB" strokeWidth="1"/>
                </g>
                
                <text x="100" y="45" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#D4AF37">NA</text>
              </svg>
            </LogoContainer>

            <Slide direction="up" in timeout={1200}>
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(212, 175, 55, 0.1)', mr: 2, width: 50, height: 50 }}>
                    <AdminPanelSettingsIcon sx={{ color: '#D4AF37', fontSize: '1.8rem' }} />
                  </Avatar>
                  <Typography 
                    variant="h3" 
                    component="h1" 
                    sx={{ 
                      fontFamily: '"Playfair Display", serif',
                      fontWeight: 700,
                      background: 'linear-gradient(45deg, #D4AF37, #FFD700)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    Panel Admin
                  </Typography>
                </Box>
                
                <Typography 
                  variant="body1" 
                  align="center" 
                  sx={{ mb: 4, opacity: 0.8, fontSize: '1.1rem' }}
                >
                  Accede al panel de administración de los Nordicos Awards
                </Typography>
              </Box>
            </Slide>
            
            {error && (
              <Fade in>
                <Alert 
                  severity="error" 
                  sx={{ 
                    mb: 3, 
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    border: '1px solid rgba(244, 67, 54, 0.3)',
                    '& .MuiAlert-icon': { color: '#f44336' }
                  }}
                >
                  {error}
                </Alert>
              </Fade>
            )}
            
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <StyledTextField
                margin="normal"
                required
                fullWidth
                label="Nombre de usuario"
                autoComplete="username"
                autoFocus
                {...register('username', { required: 'El nombre de usuario es requerido' })}
                error={!!errors.username}
                helperText={errors.username?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <PersonIcon sx={{ color: '#D4AF37' }} />
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3 }}
              />
              
              <StyledTextField
                margin="normal"
                required
                fullWidth
                label="Contraseña"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                {...register('password', { required: 'La contraseña es requerida' })}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: '#D4AF37' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: '#D4AF37' }}
                      >
                        {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 4 }}
              />
              
              <PremiumButton
                type="submit"
                fullWidth
                disabled={loading}
                sx={{ mb: 3 }}
              >
                {loading ? 'Accediendo...' : 'Acceder al Panel'}
              </PremiumButton>
              
              <Box textAlign="center">
                <Link
                  component="button"
                  variant="body2"
                  onClick={() => navigate('/register')}
                  type="button"
                  sx={{
                    color: '#D4AF37',
                    textDecoration: 'none',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      color: '#FFD700',
                      textShadow: '0 0 10px rgba(212, 175, 55, 0.5)',
                    },
                  }}
                >
                  ¿No tienes cuenta? Regístrate aquí
                </Link>
              </Box>
            </Box>
          </LoginCard>
        </Fade>
      </Container>
    </LoginContainer>
  );
};

export default Login;