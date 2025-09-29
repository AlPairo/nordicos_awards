import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Avatar,
  Paper,
  Fade,
  Slide,
} from '@mui/material';
import { styled, keyframes } from '@mui/material/styles';
import { useAuth } from '../contexts/AuthContext';
import MediaReview from '../components/MediaReview';
import CategoryManagement from '../components/CategoryManagement';
import NomineeManagement from '../components/NomineeManagement';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import CategoryIcon from '@mui/icons-material/Category';
import PeopleIcon from '@mui/icons-material/People';
import SecurityIcon from '@mui/icons-material/Security';

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

const goldShimmer = keyframes`
  0% { background-position: -200px 0; }
  100% { background-position: calc(200px + 100%) 0; }
`;

const AdminContainer = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  background: `
    radial-gradient(circle at 10% 20%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 90% 80%, rgba(212, 175, 55, 0.1) 0%, transparent 50%),
    linear-gradient(135deg, #0A0A0A 0%, #1A1A1A 100%)
  `,
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
}));

const HeaderCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(145deg, rgba(26, 26, 26, 0.95), rgba(45, 45, 45, 0.9))',
  backdropFilter: 'blur(20px)',
  border: '2px solid rgba(212, 175, 55, 0.3)',
  borderRadius: 20,
  marginBottom: theme.spacing(4),
  position: 'relative',
  overflow: 'hidden',
  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
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

const StyledTabs = styled(Tabs)(({ theme }) => ({
  '& .MuiTabs-indicator': {
    backgroundColor: '#D4AF37',
    height: 3,
    borderRadius: 2,
  },
  '& .MuiTab-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: 600,
    fontSize: '1rem',
    textTransform: 'none',
    minHeight: 64,
    transition: 'all 0.3s ease',
    '&:hover': {
      color: '#D4AF37',
      transform: 'translateY(-2px)',
    },
    '&.Mui-selected': {
      color: '#D4AF37',
      fontWeight: 700,
    },
  },
}));

const TabContainer = styled(Paper)(({ theme }) => ({
  background: 'rgba(26, 26, 26, 0.8)',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(212, 175, 55, 0.2)',
  borderRadius: 16,
  padding: 0,
  overflow: 'hidden',
}));

const StatsCard = styled(Card)(({ theme }) => ({
  background: 'linear-gradient(145deg, rgba(212, 175, 55, 0.1), rgba(255, 215, 0, 0.05))',
  border: '1px solid rgba(212, 175, 55, 0.3)',
  borderRadius: 16,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(212, 175, 55, 0.2)',
    border: '1px solid rgba(212, 175, 55, 0.5)',
  },
}));

const AdminAvatar = styled(Avatar)(({ theme }) => ({
  width: 80,
  height: 80,
  backgroundColor: 'rgba(212, 175, 55, 0.2)',
  border: '3px solid #D4AF37',
  animation: `${pulse} 2s infinite`,
  '& .MuiSvgIcon-root': {
    fontSize: '2.5rem',
    color: '#D4AF37',
  },
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 4 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Admin: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <AdminContainer>
        <Container maxWidth="lg" sx={{ textAlign: 'center', pt: 8 }}>
          <CircularProgress 
            size={60} 
            sx={{ 
              color: '#D4AF37',
              '& .MuiCircularProgress-circle': {
                strokeLinecap: 'round',
              },
            }} 
          />
          <Typography variant="h6" sx={{ mt: 2, color: '#D4AF37' }}>
            Cargando Panel de Administración...
          </Typography>
        </Container>
      </AdminContainer>
    );
  }

  if (!user || !isAdmin) {
    return (
      <AdminContainer>
        <Container maxWidth="lg" sx={{ pt: 8 }}>
          <Fade in>
            <Alert 
              severity="error"
              sx={{
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                border: '2px solid rgba(244, 67, 54, 0.3)',
                borderRadius: 4,
                fontSize: '1.1rem',
                '& .MuiAlert-icon': { color: '#f44336', fontSize: '1.5rem' }
              }}
            >
              <Typography variant="h6">Acceso Denegado</Typography>
              No tienes permisos para acceder al panel de administración de los Nordicos Awards.
            </Alert>
          </Fade>
        </Container>
      </AdminContainer>
    );
  }

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <AdminContainer>
      <Container maxWidth="lg">
        <Fade in timeout={1000}>
          <HeaderCard>
            <CardContent sx={{ textAlign: 'center', py: 4 }}>
              <AdminAvatar sx={{ mx: 'auto', mb: 3 }}>
                <AdminPanelSettingsIcon />
              </AdminAvatar>
              <Typography 
                variant="h2" 
                component="h1" 
                gutterBottom
                sx={{
                  fontFamily: '"Playfair Display", serif',
                  fontWeight: 700,
                  background: 'linear-gradient(45deg, #D4AF37, #FFD700)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2,
                }}
              >
                Panel de Administración
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  opacity: 0.8, 
                  maxWidth: 600, 
                  mx: 'auto',
                  fontSize: '1.2rem',
                }}
              >
                Control total sobre la ceremonia de premios Nordicos Awards
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mt: 3, gap: 1 }}>
                <SecurityIcon sx={{ color: '#D4AF37' }} />
                <Typography variant="body1" sx={{ color: '#D4AF37', fontWeight: 600 }}>
                  Bienvenido, {user.full_name}
                </Typography>
              </Box>
            </CardContent>
          </HeaderCard>
        </Fade>

        <Slide direction="up" in timeout={1200}>
          <Box sx={{ display: 'flex', gap: 3, mb: 4, flexWrap: 'wrap' }}>
            <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
              <StatsCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'rgba(212, 175, 55, 0.1)' }}>
                    <PhotoLibraryIcon sx={{ color: '#D4AF37', fontSize: '2rem' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                    Archivos
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Gestión de contenido multimedia
                  </Typography>
                </CardContent>
              </StatsCard>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
              <StatsCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'rgba(212, 175, 55, 0.1)' }}>
                    <CategoryIcon sx={{ color: '#D4AF37', fontSize: '2rem' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                    Categorías
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Configuración de premios
                  </Typography>
                </CardContent>
              </StatsCard>
            </Box>
            <Box sx={{ flex: '1 1 300px', minWidth: '280px' }}>
              <StatsCard>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar sx={{ width: 60, height: 60, mx: 'auto', mb: 2, bgcolor: 'rgba(212, 175, 55, 0.1)' }}>
                    <PeopleIcon sx={{ color: '#D4AF37', fontSize: '2rem' }} />
                  </Avatar>
                  <Typography variant="h4" sx={{ color: '#D4AF37', fontWeight: 700 }}>
                    Nominados
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8 }}>
                    Gestión de participantes
                  </Typography>
                </CardContent>
              </StatsCard>
            </Box>
          </Box>
        </Slide>

        <Fade in timeout={1500}>
          <TabContainer>
            <Box sx={{ borderBottom: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <StyledTabs value={tabValue} onChange={handleTabChange} centered>
                <Tab label="Revisar Archivos" icon={<PhotoLibraryIcon />} />
                <Tab label="Gestionar Categorías" icon={<CategoryIcon />} />
                <Tab label="Gestionar Nominados" icon={<PeopleIcon />} />
              </StyledTabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <MediaReview />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <CategoryManagement />
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <NomineeManagement />
            </TabPanel>
          </TabContainer>
        </Fade>
      </Container>
    </AdminContainer>
  );
};

export default Admin;