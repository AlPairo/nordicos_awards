import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
} from '@mui/material';
import { Edit, Delete, Add, VideoLibrary, Image as ImageIcon } from '@mui/icons-material';
import { nominees, categories, media } from '../services/api';
import { Nominee, Category, CreateNominee, MediaUpload } from '../types';
import MediaLibrary from './MediaLibrary';

const NomineeManagement: React.FC = () => {
  const [nomineesData, setNomineesData] = useState<Nominee[]>([]);
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingNominee, setEditingNominee] = useState<Nominee | null>(null);
  const [formData, setFormData] = useState<Omit<CreateNominee, 'approved_media_id'> & { is_active: boolean }>({
    name: '',
    description: '',
    category: '',
    is_active: true,
  });
  const [approvedMedia, setApprovedMedia] = useState<MediaUpload[]>([]);
  const [mediaLibraryOpen, setMediaLibraryOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaUpload | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [nomineesRes, categoriesRes, approvedMediaRes] = await Promise.all([
        nominees.getAll(undefined, false),
        categories.getAll(undefined, false),
        media.getAllUploads('approved'),
      ]);
      
      setNomineesData(nomineesRes);
      setCategoriesData(categoriesRes);
      setApprovedMedia(approvedMediaRes);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (editingNominee) {
        const updateData = {
          name: formData.name,
          description: formData.description,
          category_id: formData.category,
          is_active: formData.is_active,
          approved_media_id: selectedMedia?.id || null,
        };
        await nominees.update(editingNominee.id, updateData);
      } else {
        const createData: CreateNominee = {
          name: formData.name,
          description: formData.description,
          category: formData.category,
          approved_media_id: selectedMedia?.id || undefined,
        };
        await nominees.create(createData);
      }
      
      setDialogOpen(false);
      setEditingNominee(null);
      resetForm();
      loadData();
    } catch (err: any) {
      console.error('Error saving nominee:', err);
      setError(err.response?.data?.detail || 'Error al guardar el nominado');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este nominado?')) {
      try {
        await nominees.delete(id);
        loadData();
      } catch (err: any) {
        console.error('Error deleting nominee:', err);
        setError(err.response?.data?.detail || 'Error al eliminar el nominado');
      }
    }
  };

  const openDialog = (nominee?: Nominee) => {
    if (nominee) {
      setEditingNominee(nominee);
      setFormData({
        name: nominee.name,
        description: nominee.description || '',
        category: nominee.category_id,
        is_active: nominee.is_active,
      });
      if (nominee.linked_media && typeof nominee.linked_media === 'object') {
        setSelectedMedia(nominee.linked_media);
      } else {
        setSelectedMedia(null);
      }
    } else {
      setEditingNominee(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      is_active: true,
    });
    setSelectedMedia(null);
  };

  const handleMediaSelect = (media: MediaUpload) => {
    setSelectedMedia(media);
    setMediaLibraryOpen(false);
  };

  const handleRemoveMedia = () => {
    setSelectedMedia(null);
  };

  const handleAdminDeleteMedia = async (mediaItem: MediaUpload) => {
    const confirmDelete = window.confirm(`¿Eliminar definitivamente "${mediaItem.original_filename}"?`);
    if (!confirmDelete) return;
    try {
      await media.adminDelete(mediaItem.id);
      setApprovedMedia(prev => prev.filter(item => item.id !== mediaItem.id));
      setNomineesData(prev => prev.map(nominee => {
        if (nominee.linked_media && typeof nominee.linked_media === 'object' && nominee.linked_media.id === mediaItem.id) {
          return {
            ...nominee,
            linked_media: undefined,
            imageUrl: undefined,
            image_url: undefined
          };
        }
        return nominee;
      }));
      if (selectedMedia?.id === mediaItem.id) {
        setSelectedMedia(null);
      }
    } catch (err: any) {
      console.error('Error deleting media:', err);
      setError(err.response?.data?.detail || 'Error al eliminar el archivo aprobado');
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categoriesData.find(cat => cat.id === categoryId);
    return category ? category.name : 'Categoría no encontrada';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Gestión de Nominados
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openDialog()}
        >
          Nuevo Nominado
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Imagen</TableCell>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Categoría</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Votos</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {nomineesData.map((nominee) => (
              <TableRow key={nominee.id}>
                <TableCell>
                  <Avatar
                    src={
                      nominee.imageUrl
                        ? `http://localhost:8000${nominee.imageUrl}`
                        : nominee.image_url
                    }
                    alt={nominee.name}
                    sx={{ width: 40, height: 40 }}
                  >
                    {!nominee.imageUrl && !nominee.image_url && nominee.name.charAt(0)}
                  </Avatar>
                </TableCell>
                <TableCell>{nominee.name}</TableCell>
                <TableCell>{nominee.description || '-'}</TableCell>
                <TableCell>{getCategoryName(nominee.category_id)}</TableCell>
                <TableCell>{nominee.is_active ? 'Activo' : 'Inactivo'}</TableCell>
                <TableCell>{nominee.vote_count || 0}</TableCell>
                <TableCell>
                  <IconButton onClick={() => openDialog(nominee)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(nominee.id)} color="error">
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingNominee ? 'Editar Nominado' : 'Nuevo Nominado'}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Nombre"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mt: 2, mb: 2 }}
            required
          />
          <TextField
            fullWidth
            label="Descripción"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            multiline
            rows={3}
            sx={{ mb: 2 }}
          />
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Categoría</InputLabel>
            <Select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              {categoriesData.map((category) => (
                <MenuItem key={category.id} value={category.id}>
                  {category.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              {editingNominee ? 'Imagen vinculada (opcional)' : 'Media Aprobada (opcional)'}
            </Typography>
            
            {selectedMedia ? (
              <Box sx={{ 
                border: 1, 
                borderColor: 'divider', 
                borderRadius: 1, 
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 2 
              }}>
                <Box sx={{ 
                  width: 80, 
                  height: 60, 
                  borderRadius: 1, 
                  overflow: 'hidden',
                  backgroundColor: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {selectedMedia.media_type === 'photo' ? (
                    <img
                      src={`http://localhost:8000${selectedMedia.file_url || selectedMedia.file_path}`}
                      alt={selectedMedia.original_filename}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <VideoLibrary sx={{ color: 'text.secondary' }} />
                  )}
                </Box>
                
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body2" fontWeight="medium">
                    {selectedMedia.original_filename}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {selectedMedia.media_type === 'photo' ? 'Foto' : 'Video'} • {(selectedMedia.file_size / 1024 / 1024).toFixed(2)} MB
                  </Typography>
                </Box>
                
                <Box>
                  <Button
                    size="small"
                    onClick={() => setMediaLibraryOpen(true)}
                    sx={{ mr: 1 }}
                  >
                    Cambiar
                  </Button>
                  <Button
                    size="small"
                    color="error"
                    onClick={handleRemoveMedia}
                  >
                    Quitar
                  </Button>
                </Box>
              </Box>
            ) : (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setMediaLibraryOpen(true)}
                sx={{ 
                  py: 2,
                  borderStyle: 'dashed',
                  color: 'text.secondary',
                  borderColor: 'divider'
                }}
              >
                <Box sx={{ textAlign: 'center' }}>
                  <ImageIcon sx={{ fontSize: 32, mb: 1, opacity: 0.5 }} />
                  <Typography variant="body2">
                    Seleccionar Media de la Biblioteca
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Elige una foto o video aprobado
                  </Typography>
                </Box>
              </Button>
            )}
          </Box>
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            }
            label="Nominado activo"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} variant="contained">
            Guardar
          </Button>
        </DialogActions>
      </Dialog>

      <MediaLibrary
        open={mediaLibraryOpen}
        onClose={() => setMediaLibraryOpen(false)}
        onSelect={handleMediaSelect}
        selectedMediaId={selectedMedia?.id}
        mediaItems={approvedMedia}
        loading={loading}
        allowDelete
        onDelete={handleAdminDeleteMedia}
      />
    </Box>
  );
};

export default NomineeManagement;
