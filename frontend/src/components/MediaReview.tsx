import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import { media } from '../services/api';
import { MediaUpload } from '../types';

const MediaReview: React.FC = () => {
  const [uploads, setUploads] = useState<MediaUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedMedia, setSelectedMedia] = useState<MediaUpload | null>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [reviewing, setReviewing] = useState(false);

  useEffect(() => {
    loadUploads();
  }, []);

  const loadUploads = async () => {
    try {
      setLoading(true);
      const data = await media.getPendingUploads();
      setUploads(data);
    } catch (err: any) {
      console.error('Error loading uploads:', err);
      setError('Error al cargar los archivos');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'approved' | 'rejected') => {
    if (!selectedMedia) return;

    try {
      setReviewing(true);
      await media.review(selectedMedia.id, status, adminNotes);
      
      setUploads(prev => prev.map(upload => 
        upload.id === selectedMedia.id 
          ? { ...upload, status, admin_notes: adminNotes }
          : upload
      ));
      
      setReviewDialog(false);
      setSelectedMedia(null);
      setAdminNotes('');
    } catch (err: any) {
      console.error('Error reviewing media:', err);
      setError(err.response?.data?.detail || 'Error al revisar el archivo');
    } finally {
      setReviewing(false);
    }
  };

  const openReviewDialog = (upload: MediaUpload) => {
    setSelectedMedia(upload);
    setAdminNotes(upload.admin_notes || '');
    setReviewDialog(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      default: return 'warning';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      default: return 'Pendiente';
    }
  };

  if (loading) {
    return (
      <Box textAlign="center" sx={{ mt: 4 }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando archivos...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Revisar Archivos Subidos
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
        {uploads.map((upload) => (
          <Box key={upload.id} sx={{ flex: '1 1 300px', maxWidth: '400px' }}>
            <Card>
              {upload.media_type === 'photo' && (
                <CardMedia
                  component="img"
                  height="200"
                  image={`http://localhost:8000${upload.file_url || upload.file_path}`}
                  alt={upload.original_filename}
                  sx={{ objectFit: 'cover' }}
                />
              )}
              {upload.media_type === 'video' && (
                <CardMedia
                  component="video"
                  height="200"
                  controls
                  src={`http://localhost:8000${upload.file_url || upload.file_path}`}
                />
              )}
              
              <CardContent>
                <Typography 
                  variant="h6" 
                  gutterBottom
                  sx={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    maxWidth: '100%'
                  }}
                  title={upload.original_filename}
                >
                  {upload.original_filename}
                </Typography>
                
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Subido por: {typeof upload.user_id === 'object' ? upload.user_id.username : `Usuario #${upload.user_id}`}
                </Typography>
                
                {upload.description && (
                  <Typography 
                    variant="body2" 
                    paragraph
                    sx={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    title={upload.description}
                  >
                    {upload.description}
                  </Typography>
                )}
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Chip 
                    label={getStatusText(upload.status)} 
                    color={getStatusColor(upload.status) as any}
                    size="small"
                  />
                  <Typography variant="caption" color="text.secondary">
                    {new Date(upload.created_at).toLocaleDateString()}
                  </Typography>
                </Box>
                
                {upload.admin_notes && (
                  <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                    Notas: {upload.admin_notes}
                  </Typography>
                )}
                
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => openReviewDialog(upload)}
                >
                  Revisar
                </Button>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Box>
      
      {uploads.length === 0 && (
        <Alert severity="info">
          No hay archivos para revisar
        </Alert>
      )}
      
      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle 
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            pr: 6
          }}
          title={`Revisar Archivo: ${selectedMedia?.original_filename}`}
        >
          Revisar Archivo: {selectedMedia?.original_filename}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notas del administrador"
            value={adminNotes}
            onChange={(e) => setAdminNotes(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Agrega notas sobre la revisión..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)} disabled={reviewing}>
            Cancelar
          </Button>
          <Button 
            onClick={() => handleReview('rejected')} 
            color="error"
            disabled={reviewing}
          >
            Rechazar
          </Button>
          <Button 
            onClick={() => handleReview('approved')} 
            color="success"
            disabled={reviewing}
          >
            Aprobar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MediaReview;