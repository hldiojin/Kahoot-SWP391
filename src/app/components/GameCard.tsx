'use client';

import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Chip,
  IconButton,
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Bookmark as BookmarkIcon,
  QuestionAnswer as QuestionIcon,
  People as PeopleIcon,
} from '@mui/icons-material';

interface GameCardProps {
  title: string;
  description: string;
  imageUrl: string;
  questionsCount: number;
  playsCount: number;
  creator: string;
}

const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  imageUrl,
  questionsCount,
  playsCount,
  creator,
}) => {
  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      <Box sx={{ position: 'relative' }}>
        <CardMedia
          component="img"
          height="200"
          image={imageUrl}
          alt={title}
          sx={{
            transition: 'transform 0.3s',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 100%)',
            p: 2,
          }}
        >
          <Typography variant="h5" component="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {description}
        </Typography>

        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip
            icon={<QuestionIcon />}
            label={`${questionsCount} questions`}
            size="small"
            sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}
          />
          <Chip
            icon={<PeopleIcon />}
            label={`${playsCount} plays`}
            size="small"
            sx={{ bgcolor: 'secondary.light', color: 'secondary.dark' }}
          />
        </Stack>

        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
          By {creator}
        </Typography>

        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            startIcon={<PlayIcon />}
            fullWidth
            sx={{
              bgcolor: 'primary.main',
              '&:hover': {
                bgcolor: 'primary.dark',
              },
            }}
          >
            Play
          </Button>
          <IconButton
            color="primary"
            sx={{
              bgcolor: 'action.hover',
              '&:hover': {
                bgcolor: 'action.selected',
              },
            }}
          >
            <BookmarkIcon />
          </IconButton>
        </Stack>
      </CardContent>
    </Card>
  );
};

export default GameCard; 