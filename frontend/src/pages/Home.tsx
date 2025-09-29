import React from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Paper,
} from '@mui/material';
import { EmojiEvents, HowToVote, PhotoCamera, BarChart } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box textAlign="center" mb={6}>
        <Typography variant="h2" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
          <EmojiEvents sx={{ fontSize: 'inherit', color: 'primary.main' }} />
          Nordicos Awards 2025
        </Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          La premiación anual más esperada entre amigos
        </Typography>
      </Box>

      {user ? (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>
          <Box sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <HowToVote color="primary" />
                Votar
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Participa en las votaciones de las diferentes categorías
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/voting')}
              >
                Ir a Votar
              </Button>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <PhotoCamera color="primary" />
                Subir Contenido
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Comparte fotos y videos para las nominaciones
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/upload')}
              >
                Subir Archivo
              </Button>
            </Paper>
          </Box>

          <Box sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                <BarChart color="primary" />
                Resultados
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Ve los resultados de las votaciones
              </Typography>
              <Button
                variant="contained"
                fullWidth
                onClick={() => navigate('/results')}
              >
                Ver Resultados
              </Button>
            </Paper>
          </Box>
        </Box>
      ) : (
        <Box textAlign="center">
          <Typography variant="h6" gutterBottom>
            ¡Únete a los Nordicos Awards!
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Regístrate para participar en las votaciones y subir tu contenido
          </Typography>
          <Box sx={{ mt: 3 }}>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/register')}
              sx={{ mr: 2 }}
            >
              Registrarse
            </Button>
            <Button
              variant="outlined"
              size="large"
              onClick={() => navigate('/login')}
            >
              Iniciar Sesión
            </Button>
          </Box>
        </Box>
      )}
    </Container>
  );
};

export default Home;