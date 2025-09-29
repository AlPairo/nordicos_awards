import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Chip,
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, HowToVote, CheckCircle } from '@mui/icons-material';
import { categories, votes } from '../services/api';
import { CategoryWithNominees, Vote } from '../types';
import { useAuth } from '../contexts/AuthContext';

const Voting: React.FC = () => {
  const { user } = useAuth();
  const [categoriesData, setCategoriesData] = useState<CategoryWithNominees[]>([]);
  const [myVotes, setMyVotes] = useState<Vote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedNominees, setSelectedNominees] = useState<{ [categoryId: string]: string }>({});
  const [voting, setVoting] = useState<{ [categoryId: string]: boolean }>({});

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [categoriesRes, votesRes] = await Promise.all([
        categories.getAll(2025),
        votes.getMyVotes(),
      ]);
      
      setCategoriesData(categoriesRes);
      setMyVotes(votesRes);
      
      const votedNominees: { [categoryId: string]: string } = {};
      votesRes.forEach(vote => {
        const nominee = categoriesRes
          .flatMap(cat => cat.nominees)
          .find(nom => nom.id === vote.nominee_id);
        if (nominee) {
          votedNominees[nominee.category_id] = vote.nominee_id;
        }
      });
      setSelectedNominees(votedNominees);
      
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Error al cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (categoryId: string, nomineeId: string) => {
    try {
      setVoting(prev => ({ ...prev, [categoryId]: true }));
      
      const existingVote = myVotes.find(vote => {
        const nominee = categoriesData
          .flatMap(cat => cat.nominees)
          .find(nom => nom.id === vote.nominee_id);
        return nominee?.category_id === categoryId;
      });

      if (existingVote) {
        await votes.delete(existingVote.id);
      }

      await votes.create(nomineeId, categoryId);
      
      setSelectedNominees(prev => ({ ...prev, [categoryId]: nomineeId }));
      
      const updatedVotes = await votes.getMyVotes();
      setMyVotes(updatedVotes);
      
    } catch (err: any) {
      console.error('Error voting:', err);
      setError(err.response?.data?.detail || 'Error al votar');
    } finally {
      setVoting(prev => ({ ...prev, [categoryId]: false }));
    }
  };

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Debes iniciar sesión para votar
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress />
        <Typography variant="h6" sx={{ mt: 2 }}>
          Cargando categorías...
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <HowToVote sx={{ fontSize: 'inherit', color: 'primary.main' }} />
        Votación Nordicos Awards 2025
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {categoriesData.map((category) => {
        const hasVoted = selectedNominees[category.id];
        return (
          <Accordion 
            key={category.id} 
            sx={{ 
              mb: 2,
              backgroundColor: hasVoted ? 'success.light' : 'background.paper',
              border: hasVoted ? '2px solid' : '1px solid',
              borderColor: hasVoted ? 'success.main' : 'divider',
            }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {category.name}
                </Typography>
                {hasVoted && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip 
                      label="VOTADO" 
                      color="success" 
                      size="small"
                      icon={<CheckCircle />}
                    />
                  </Box>
                )}
              </Box>
            </AccordionSummary>
          <AccordionDetails>
            {category.description && (
              <Typography variant="body2" color="text.secondary" paragraph>
                {category.description}
              </Typography>
            )}
            
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={selectedNominees[category.id] || ''}
                onChange={(e) => {
                  const nomineeId = e.target.value;
                  handleVote(category.id, nomineeId);
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {category.nominees.map((nominee) => {
                    const isSelected = selectedNominees[category.id] === nominee.id;
                    return (
                      <Card 
                        key={nominee.id} 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          backgroundColor: isSelected ? 'success.light' : 'background.paper',
                          border: isSelected ? '2px solid' : '1px solid',
                          borderColor: isSelected ? 'success.main' : 'divider',
                          boxShadow: isSelected ? 3 : 1,
                        }}
                      >
                      {(nominee.imageUrl || nominee.image_url) && (
                        <CardMedia
                          component="img"
                          sx={{ width: 100, height: 100, objectFit: 'cover' }}
                          image={
                            nominee.imageUrl 
                              ? `http://localhost:8000${nominee.imageUrl}` 
                              : nominee.image_url
                          }
                          alt={nominee.name}
                        />
                      )}
                      <CardContent sx={{ flex: 1 }}>
                        <FormControlLabel
                          value={nominee.id}
                          control={<Radio />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                              <Box>
                                <Typography variant="h6">
                                  {nominee.name}
                                </Typography>
                                {nominee.description && (
                                  <Typography variant="body2" color="text.secondary">
                                    {nominee.description}
                                  </Typography>
                                )}
                                <Typography variant="caption" color="text.secondary">
                                  Votos actuales: {nominee.vote_count || 0}
                                </Typography>
                              </Box>
                              {isSelected && (
                                <Chip 
                                  label="TU VOTO" 
                                  color="success" 
                                  size="small"
                                  variant="filled"
                                />
                              )}
                            </Box>
                          }
                          disabled={voting[category.id]}
                        />
                      </CardContent>
                    </Card>
                    );
                  })}
                </Box>
              </RadioGroup>
            </FormControl>
            
            {voting[category.id] && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
        );
      })}
      
      {categoriesData.length === 0 && (
        <Alert severity="info">
          No hay categorías disponibles para votar en este momento.
        </Alert>
      )}
    </Container>
  );
};

export default Voting;