import React from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  Paper,
  Avatar,
  Fade,
  Zoom,
  Slide,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import StarIcon from '@mui/icons-material/Star';
import PeopleIcon from '@mui/icons-material/People';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const goldShimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const float = keyframes`
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const HeroSection = styled(Box)(({ theme }) => ({
  background: `linear-gradient(135deg, 
    rgba(0, 0, 0, 0.9) 0%, 
    rgba(26, 26, 26, 0.95) 50%, 
    rgba(0, 0, 0, 0.9) 100%),
    url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><defs><radialGradient id="g" cx="50%" cy="50%"><stop offset="0%" style="stop-color:%23D4AF37;stop-opacity:0.1"/><stop offset="100%" style="stop-color:%23000000;stop-opacity:0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(%23g)"/><circle cx="200" cy="200" r="3" fill="%23D4AF37" opacity="0.3"/><circle cx="800" cy="300" r="2" fill="%23FFD700" opacity="0.4"/><circle cx="400" cy="700" r="2" fill="%23D4AF37" opacity="0.3"/><circle cx="700" cy="800" r="3" fill="%23FFD700" opacity="0.2"/></svg>')`,
  minHeight: '80vh',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'radial-gradient(circle at 50% 50%, rgba(212, 175, 55, 0.1) 0%, transparent 70%)',
  },
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  marginBottom: theme.spacing(4),
  '& svg': {
    animation: `${float} 3s ease-in-out infinite`,
    filter: 'drop-shadow(0 0 20px rgba(212, 175, 55, 0.5))',
  },
}));

const GlowingCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(145deg, rgba(26, 26, 26, 0.9), rgba(45, 45, 45, 0.8))',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: 20,
  transition: 'all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, rgba(212, 175, 55, 0.1), transparent)',
    transition: 'left 0.8s',
  },
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    boxShadow: '0 20px 60px rgba(212, 175, 55, 0.3)',
    border: '1px solid rgba(212, 175, 55, 0.6)',
    '&::before': {
      left: '100%',
    },
  },
}));

const PremiumButton = styled(Button)(({ theme }) => ({
  background: 'linear-gradient(45deg, #D4AF37 0%, #FFD700 50%, #D4AF37 100%)',
  color: '#000000',
  fontWeight: 700,
  fontSize: '1.1rem',
  padding: '16px 32px',
  borderRadius: 50,
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
    animation: `${goldShimmer} 2s infinite`,
  },
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 12px 40px rgba(212, 175, 55, 0.6)',
    background: 'linear-gradient(45deg, #FFD700 0%, #D4AF37 50%, #FFD700 100%)',
  },
}));

const FeatureIcon = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  backgroundColor: 'rgba(212, 175, 55, 0.1)',
  border: '2px solid #D4AF37',
  margin: '0 auto 20px',
  animation: `${pulse} 2s infinite`,
  '& .MuiSvgIcon-root': {
    fontSize: '2.5rem',
    color: '#D4AF37',
  },
}));

const StatsBox = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  background: 'rgba(212, 175, 55, 0.1)',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: 16,
  backdropFilter: 'blur(10px)',
}));

const Home: React.FC = () => {
  const features = [
    {
      icon: <EmojiEventsIcon />,
      title: 'Ceremonia Premium',
      description: 'Una experiencia de premiación única con diseño elegante y profesional.',
    },
    {
      icon: <PeopleIcon />,
      title: 'Nominaciones',
      description: 'Sistema completo para nominar a tus amigos en diferentes categorías.',
    },
    {
      icon: <StarIcon />,
      title: 'Votaciones',
      description: 'Vota por tus favoritos de manera fácil y segura.',
    },
  ];

  return (
    <Box>
      <HeroSection>
        <Container maxWidth="lg">
          <Fade in timeout={1000}>
            <Box textAlign="center">
              <LogoContainer>
                <svg width="120" height="120" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" style={{stopColor: '#FFD700', stopOpacity: 1}} />
                      <stop offset="50%" style={{stopColor: '#D4AF37', stopOpacity: 1}} />
                      <stop offset="100%" style={{stopColor: '#B8860B', stopOpacity: 1}} />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                      <feMerge> 
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  
                  <path d="M100 20 L160 50 L160 120 Q160 160 100 180 Q40 160 40 120 L40 50 Z" 
                        fill="url(#logoGradient)" 
                        stroke="#D4AF37" 
                        strokeWidth="2"
                        filter="url(#glow)" />
                  
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
                  <Typography variant="h1" gutterBottom sx={{ mb: 2 }}>
                    Nordicos Awards
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 4, opacity: 0.9, fontWeight: 300 }}>
                    La ceremonia de premios más épica del año
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 6, fontSize: '1.2rem', maxWidth: 600, mx: 'auto', opacity: 0.8 }}>
                    Una noche especial para celebrar y premiar lo mejor de nuestro grupo de amigos. 
                    Vota, compite y disfruta de una experiencia única.
                  </Typography>
                </Box>
              </Slide>

              <Zoom in timeout={1500}>
                <Box sx={{ display: 'flex', gap: 3, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <PremiumButton
                    onClick={() => window.location.href = '/categories'}
                    size="large"
                  >
                    Ver Categorías
                  </PremiumButton>
                  <PremiumButton
                    variant="outlined"
                    onClick={() => window.location.href = '/login'}
                    size="large"
                    sx={{
                      background: 'transparent',
                      color: '#D4AF37',
                      borderColor: '#D4AF37',
                      '&:hover': {
                        background: 'rgba(212, 175, 55, 0.1)',
                        borderColor: '#FFD700',
                      },
                    }}
                    startIcon={<AdminPanelSettingsIcon />}
                  >
                    Panel Admin
                  </PremiumButton>
                </Box>
              </Zoom>
            </Box>
          </Fade>
        </Container>
      </HeroSection>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Fade in timeout={2000}>
          <Typography variant="h2" textAlign="center" gutterBottom sx={{ mb: 6 }}>
            Una Experiencia Premium
          </Typography>
        </Fade>

        <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          {features.map((feature, index) => (
            <Box key={index} sx={{ flex: '1 1 300px', maxWidth: 400 }}>
              <Fade in timeout={2000 + index * 200}>
                <GlowingCard>
                  <CardContent sx={{ textAlign: 'center', p: 4 }}>
                    <FeatureIcon>
                      {feature.icon}
                    </FeatureIcon>
                    <Typography variant="h4" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body1" sx={{ opacity: 0.8 }}>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </GlowingCard>
              </Fade>
            </Box>
          ))}
        </Box>
      </Container>

      <Box sx={{ backgroundColor: 'rgba(212, 175, 55, 0.05)', py: 8 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 250px', maxWidth: 300 }}>
              <Fade in timeout={2500}>
                <StatsBox>
                  <Typography variant="h2" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                    2024
                  </Typography>
                  <Typography variant="h6">
                    Año de los Premios
                  </Typography>
                </StatsBox>
              </Fade>
            </Box>
            <Box sx={{ flex: '1 1 250px', maxWidth: 300 }}>
              <Fade in timeout={2700}>
                <StatsBox>
                  <Typography variant="h2" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                    ∞
                  </Typography>
                  <Typography variant="h6">
                    Categorías Épicas
                  </Typography>
                </StatsBox>
              </Fade>
            </Box>
            <Box sx={{ flex: '1 1 250px', maxWidth: 300 }}>
              <Fade in timeout={2900}>
                <StatsBox>
                  <Typography variant="h2" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                    1
                  </Typography>
                  <Typography variant="h6">
                    Noche Inolvidable
                  </Typography>
                </StatsBox>
              </Fade>
            </Box>
          </Box>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Fade in timeout={3000}>
          <Box>
            <Typography variant="h3" gutterBottom sx={{ mb: 3 }}>
              ¿Listo para la Ceremonia?
            </Typography>
            <Typography variant="body1" sx={{ mb: 4, fontSize: '1.2rem', opacity: 0.8 }}>
              Únete a la experiencia más épica del año. Vota por tus favoritos y 
              descubre quién se lleva los premios más codiciados.
            </Typography>
            <PremiumButton
              onClick={() => window.location.href = '/categories'}
              size="large"
              sx={{ fontSize: '1.3rem', py: 2, px: 4 }}
            >
              Comenzar Ahora
            </PremiumButton>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
};

export default Home;