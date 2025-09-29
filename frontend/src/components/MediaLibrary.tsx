import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Card,
  CardMedia,
  CardContent,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Search,
  Close,
  PlayArrow,
  Image as ImageIcon,
  VideoLibrary,
  Check,
} from '@mui/icons-material';
import { MediaUpload } from '../types';

interface MediaLibraryProps {
  open: boolean;
  onClose: () => void;
  onSelect: (media: MediaUpload) => void;
  selectedMediaId?: string;
  mediaItems: MediaUpload[];
  loading?: boolean;
}

const MediaLibrary: React.FC<MediaLibraryProps> = ({
  open,
  onClose,
  onSelect,
  selectedMediaId,
  mediaItems,
  loading = false,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'photo' | 'video'>('all');
  const [filteredMedia, setFilteredMedia] = useState<MediaUpload[]>([]);

  useEffect(() => {
    let filtered = mediaItems;

    if (mediaTypeFilter !== 'all') {
      filtered = filtered.filter(item => item.media_type === mediaTypeFilter);
    }

    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.original_filename.toLowerCase().includes(searchLower) ||
        (item.description && item.description.toLowerCase().includes(searchLower))
      );
    }

    setFilteredMedia(filtered);
  }, [mediaItems, searchTerm, mediaTypeFilter]);

  const handleMediaSelect = (media: MediaUpload) => {
    onSelect(media);
    onClose();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getMediaTypeIcon = (mediaType: string) => {
    return mediaType === 'photo' ? <ImageIcon /> : <VideoLibrary />;
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Biblioteca de Media Aprobada</Typography>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
            placeholder="Buscar por nombre de archivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 300, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
              endAdornment: searchTerm && (
                <InputAdornment position="end">
                  <IconButton onClick={() => setSearchTerm('')} size="small">
                    <Close />
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          
          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel>Tipo de Media</InputLabel>
            <Select
              value={mediaTypeFilter}
              onChange={(e) => setMediaTypeFilter(e.target.value as 'all' | 'photo' | 'video')}
              label="Tipo de Media"
            >
              <MenuItem value="all">Todos</MenuItem>
              <MenuItem value="photo">Fotos</MenuItem>
              <MenuItem value="video">Videos</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            icon={<ImageIcon />} 
            label={`${mediaItems.filter(m => m.media_type === 'photo').length} Fotos`} 
            variant="outlined" 
          />
          <Chip 
            icon={<VideoLibrary />} 
            label={`${mediaItems.filter(m => m.media_type === 'video').length} Videos`} 
            variant="outlined" 
          />
          <Chip 
            label={`${filteredMedia.length} Resultados`} 
            color="primary" 
            variant="outlined" 
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
            <CircularProgress />
          </Box>
        ) : filteredMedia.length === 0 ? (
          <Alert severity="info">
            {mediaItems.length === 0 
              ? 'No hay media aprobada disponible' 
              : 'No se encontraron resultados con los filtros aplicados'}
          </Alert>
        ) : (
          <Box sx={{ 
            maxHeight: 500, 
            overflow: 'auto',
            display: 'grid',
            gap: 2,
            gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))'
          }}>
            {filteredMedia.map((media) => (
              <Box key={media.id}>
                <Card 
                  sx={{ 
                    cursor: 'pointer',
                    border: selectedMediaId === media.id ? 2 : 1,
                    borderColor: selectedMediaId === media.id ? 'primary.main' : 'divider',
                    transition: 'all 0.2s ease-in-out',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: 3,
                    }
                  }}
                  onClick={() => handleMediaSelect(media)}
                >
                  <Box sx={{ position: 'relative', height: 160 }}>
                    {media.media_type === 'photo' ? (
                      <CardMedia
                        component="img"
                        height="160"
                        image={`http://localhost:8000${media.file_url || media.file_path}`}
                        alt={media.original_filename}
                        sx={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <Box sx={{ 
                        position: 'relative', 
                        height: '100%', 
                        backgroundColor: '#f5f5f5',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <video
                          width="100%"
                          height="160"
                          style={{ objectFit: 'cover' }}
                          muted
                        >
                          <source src={`http://localhost:8000${media.file_url || media.file_path}`} />
                        </video>
                        <Box sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          backgroundColor: 'rgba(0,0,0,0.6)',
                          borderRadius: '50%',
                          p: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <PlayArrow sx={{ color: 'white', fontSize: 32 }} />
                        </Box>
                      </Box>
                    )}
                    
                    <Chip
                      icon={getMediaTypeIcon(media.media_type)}
                      label={media.media_type === 'photo' ? 'Foto' : 'Video'}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255,255,255,0.9)',
                      }}
                    />
                    
                    {selectedMediaId === media.id && (
                      <Box sx={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        backgroundColor: 'primary.main',
                        color: 'white',
                        borderRadius: '50%',
                        width: 24,
                        height: 24,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 14,
                        fontWeight: 'bold'
                      }}>
                        <Check fontSize="small" />
                      </Box>
                    )}
                  </Box>
                  
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography 
                      variant="body2" 
                      fontWeight="medium"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.5
                      }}
                      title={media.original_filename}
                    >
                      {media.original_filename}
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" display="block">
                      {formatFileSize(media.file_size)}
                    </Typography>
                    
                    {media.description && (
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          mt: 0.5
                        }}
                        title={media.description}
                      >
                        {media.description}
                      </Typography>
                    )}
                    
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      Subido: {new Date(media.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            ))}
          </Box>
        )}
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          variant="contained" 
          disabled={!selectedMediaId}
          onClick={() => {
            const selectedMedia = mediaItems.find(m => m.id === selectedMediaId);
            if (selectedMedia) {
              handleMediaSelect(selectedMedia);
            }
          }}
        >
          Seleccionar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MediaLibrary;