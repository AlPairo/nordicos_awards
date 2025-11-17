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
} from '@mui/material';
import { Edit, Delete, Add } from '@mui/icons-material';
import { categories } from '../services/api';
import { Category } from '../types';

const CategoryManagement: React.FC = () => {
  const [categoriesData, setCategoriesData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    year: 2025,
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadCategories = async () => {
    try {
      if (!loading) {
        setLoading(true);
      }
      const data = await categories.getAll(undefined, false);
      setCategoriesData(data);
    } catch (err: any) {
      console.error('Error loading categories:', err);
      setError('Error al cargar las categorías');
    } finally {
      if (loading) {
        setLoading(false);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (editingCategory) {
        await categories.update(editingCategory.id, formData);
      } else {
        await categories.create(formData);
      }
      
      setDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      loadCategories();
    } catch (err: any) {
      console.error('Error saving category:', err);
      setError(err.response?.data?.detail || 'Error al guardar la categoría');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta categoría?')) {
      try {
        await categories.delete(id);
        loadCategories();
      } catch (err: any) {
        console.error('Error deleting category:', err);
        setError(err.response?.data?.detail || 'Error al eliminar la categoría');
      }
    }
  };

  const openDialog = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        year: category.year,
        is_active: category.is_active,
      });
    } else {
      setEditingCategory(null);
      resetForm();
    }
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      year: 2025,
      is_active: true,
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          Gestión de Categorías
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => openDialog()}
        >
          Nueva Categoría
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nombre</TableCell>
              <TableCell>Descripción</TableCell>
              <TableCell>Año</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categoriesData.map((category) => (
              <TableRow key={category.id}>
                <TableCell>{category.name}</TableCell>
                <TableCell>{category.description || '-'}</TableCell>
                <TableCell>{category.year}</TableCell>
                <TableCell>{category.is_active ? 'Activa' : 'Inactiva'}</TableCell>
                <TableCell>
                  <IconButton onClick={() => openDialog(category)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(category.id)} color="error">
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
          {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
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
          <TextField
            fullWidth
            label="Año"
            type="number"
            value={formData.year}
            onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
            sx={{ mb: 2 }}
            required
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
            }
            label="Categoría activa"
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
    </Box>
  );
};

export default CategoryManagement;
