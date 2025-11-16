import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Link,
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../types';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterData & { confirmPassword: string }>();

  const onSubmit = async (data: RegisterData & { confirmPassword: string }) => {
    if (data.password !== data.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Registrarse
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 1 }}>
          <TextField
            margin="normal"
            required
            fullWidth
            label="Nombre completo"
            autoFocus
            {...register('full_name', { required: 'El nombre completo es requerido' })}
            error={!!errors.full_name}
            helperText={errors.full_name?.message}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Nombre de usuario"
            {...register('username', { 
              required: 'El nombre de usuario es requerido',
              minLength: { value: 3, message: 'Mínimo 3 caracteres' }
            })}
            error={!!errors.username}
            helperText={errors.username?.message}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Correo electrónico"
            type="email"
            {...register('email', { 
              required: 'El correo electrónico es requerido',
              pattern: { 
                value: /^\S+@\S+$/i, 
                message: 'Formato de correo inválido' 
              }
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Contraseña"
            type="password"
            {...register('password', { 
              required: 'La contraseña es requerida',
              minLength: { value: 6, message: 'Mínimo 6 caracteres' }
            })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          
          <TextField
            margin="normal"
            required
            fullWidth
            label="Confirmar contraseña"
            type="password"
            {...register('confirmPassword', { required: 'Confirma tu contraseña' })}
            error={!!errors.confirmPassword}
            helperText={errors.confirmPassword?.message}
          />
          
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
            disabled={loading}
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </Button>
          
          <Box textAlign="center">
            <Link
              component="button"
              variant="body2"
              onClick={() => navigate('/login')}
              type="button"
            >
              ¿Ya tienes cuenta? Inicia sesión aquí
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default Register;