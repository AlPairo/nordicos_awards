import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Alert,
  Paper,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Tab,
  Tabs,
} from '@mui/material';
import { CloudUpload, Delete, PlayCircle, CheckCircle, Pending, Cancel, Image, VideoFile } from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { media } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MediaUpload } from '../types';
import LogoNA from '../components/LogoNA';

const Upload: React.FC = () => {
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [myUploads, setMyUploads] = useState<MediaUpload[]>([]);
  const [loadingUploads, setLoadingUploads] = useState(false);
  const [tabValue, setTabValue] = useState(0);

  const handleDeleteUpload = async (upload: MediaUpload) => {
    const confirmDelete = window.confirm(`¿Eliminar "${upload.original_filename}"? Esta acción no se puede deshacer.`);
    if (!confirmDelete) return;
    try {
      await media.delete(upload.id);
      setMyUploads(prev => prev.filter(item => item.id !== upload.id));
    } catch (err: any) {
      console.error('Error deleting upload:', err);
      setError(err.response?.data?.detail || 'Error al eliminar el archivo');
    }
  };

  useEffect(() => {
    const loadMyUploads = async () => {
      if (!user) return;
      
      setLoadingUploads(true);
      try {
        const uploads = await media.getMyUploads();
        setMyUploads(uploads);
      } catch (err) {
        console.error('Error loading uploads:', err);
      } finally {
        setLoadingUploads(false);
      }
    };

    loadMyUploads();
  }, [user]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle sx={{ color: 'success.main' }} />;
      case 'rejected':
        return <Cancel sx={{ color: 'error.main' }} />;
      default:
        return <Pending sx={{ color: 'warning.main' }} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'warning';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      default:
        return 'Pendiente';
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'video/*': ['.mp4', '.mov', '.avi', '.wmv'],
    },
    maxSize: 10 * 1024 * 1024,
    onDrop: (acceptedFiles) => {
      setSelectedFiles(prev => [...prev, ...acceptedFiles]);
      setError('');
    },
    onDropRejected: (rejectedFiles) => {
      const errors = rejectedFiles.map(file => 
        file.errors.map(error => error.message).join(', ')
      ).join('; ');
      setError(`Archivos rechazados: ${errors}`);
    },
  });

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setError('Selecciona al menos un archivo');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');
    setUploadProgress(0);

    try {
      const uploadPromises = selectedFiles.map(async (file, index) => {
        await media.upload(file, description);
        setUploadProgress((index + 1) / selectedFiles.length * 100);
      });

      await Promise.all(uploadPromises);
      
      setSuccess(`${selectedFiles.length} archivo(s) subido(s) exitosamente. Esperando revisión del administrador.`);
      setSelectedFiles([]);
      setDescription('');
      
      const uploads = await media.getMyUploads();
      setMyUploads(uploads);
    } catch (err: any) {
      console.error('Error uploading:', err);
      setError(err.response?.data?.detail || 'Error al subir archivos');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Debes iniciar sesión para subir archivos
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <LogoNA height="60px" />
        Gestión de Contenido
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Paper elevation={3} sx={{ p: 0 }}>
        <Tabs 
          value={tabValue} 
          onChange={(e, newValue) => setTabValue(newValue)}
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Subir Archivos" />
          <Tab label="Mis Archivos" />
        </Tabs>

        {tabValue === 0 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="body1" color="text.secondary" paragraph align="center">
              Comparte fotos y videos que puedan servir para las nominaciones.
              Los archivos serán revisados por un administrador antes de ser aprobados.
            </Typography>
            
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed #ccc',
                borderRadius: 2,
                p: 4,
                textAlign: 'center',
                cursor: 'pointer',
                backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
              }}
            >
              <input {...getInputProps()} />
              <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
              {isDragActive ? (
                <Typography variant="h6">Suelta los archivos aquí...</Typography>
              ) : (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Arrastra archivos aquí o haz clic para seleccionar
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Formatos soportados: JPG, PNG, GIF, MP4, MOV, AVI, WMV
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Tamaño máximo: 10MB por archivo
                  </Typography>
                </Box>
              )}
            </Box>
            
            {selectedFiles.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Archivos seleccionados:
                </Typography>
                <List>
                  {selectedFiles.map((file, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton
                          edge="end"
                          onClick={() => removeFile(index)}
                          disabled={uploading}
                        >
                          <Delete />
                        </IconButton>
                      }
                    >
                      <ListItemText
                        primary={file.name}
                        secondary={`${(file.size / 1024 / 1024).toFixed(2)} MB`}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ mt: 3 }}
              placeholder="Describe el contenido, cuándo fue tomado, contexto, etc."
            />
            
            {uploading && (
              <Box sx={{ mt: 3 }}>
                <LinearProgress variant="determinate" value={uploadProgress} />
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                  Subiendo archivos... {Math.round(uploadProgress)}%
                </Typography>
              </Box>
            )}
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploading}
                startIcon={<CloudUpload />}
              >
                {uploading ? 'Subiendo...' : `Subir ${selectedFiles.length} archivo(s)`}
              </Button>
            </Box>
          </Box>
        )}

        {tabValue === 1 && (
          <Box sx={{ p: 4 }}>
            <Typography variant="h6" gutterBottom>
              Mis Archivos Subidos
            </Typography>
            
            {loadingUploads ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <LinearProgress sx={{ width: '50%' }} />
              </Box>
            ) : myUploads.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <Image sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" color="text.secondary">
                  No has subido archivos aún
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Cambia a la pestaña "Subir Archivos" para empezar
                </Typography>
              </Box>
            ) : (
              <Box 
                sx={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
                  gap: 3 
                }}
              >
                {myUploads.map((upload) => (
                  <Card key={upload.id} sx={{ position: 'relative' }}>
                    {upload.media_type === 'photo' ? (
                      <CardMedia
                        component="img"
                        height="200"
                        image={upload.file_url}
                        alt={upload.original_filename}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 200,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: 'grey.100',
                          position: 'relative'
                        }}
                      >
                        <VideoFile sx={{ fontSize: 64, color: 'text.secondary' }} />
                        <PlayCircle 
                          sx={{ 
                            position: 'absolute', 
                            fontSize: 48, 
                            color: 'primary.main', 
                            opacity: 0.8 
                          }} 
                        />
                      </Box>
                    )}
                    
                    <CardContent>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteUpload(upload)}
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                      >
                        <Delete />
                      </IconButton>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        {getStatusIcon(upload.status)}
                        <Chip 
                          label={getStatusText(upload.status)} 
                          color={getStatusColor(upload.status) as any}
                          size="small"
                        />
                      </Box>
                      
                      <Typography variant="subtitle2" gutterBottom>
                        {upload.original_filename}
                      </Typography>
                      
                      {upload.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {upload.description}
                        </Typography>
                      )}
                      
                      <Typography variant="caption" color="text.secondary">
                        {(upload.file_size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(upload.created_at).toLocaleDateString('es-ES')}
                      </Typography>
                      
                      {upload.admin_notes && (
                        <Alert severity="info" sx={{ mt: 1 }}>
                          <Typography variant="caption">
                            Nota del admin: {upload.admin_notes}
                          </Typography>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default Upload;
