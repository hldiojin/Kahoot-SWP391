'use client';

import React from 'react';
import {
  Card,
  CardMedia,
  CardContent,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  CardActions,
  Avatar,
  Divider
} from '@mui/material';
import {
  PlayArrow as PlayIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Edit as EditIcon,
  QuestionAnswer as QuestionIcon,
  BarChart as StatsIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { styled } from '@mui/material/styles';
import { useRouter } from 'next/navigation';

// Styled components
const StyledCard = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s, box-shadow 0.3s',
  borderRadius: theme.shape.borderRadius * 3,
  overflow: 'hidden',
  position: 'relative',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: '0 16px 30px rgba(0,0,0,0.1), 0 8px 12px rgba(0,0,0,0.05)',
  },
}));

const CardOverlay = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8) 100%)',
  zIndex: 1,
}));

const QuestionChip = styled(Chip)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 2,
  fontSize: '0.75rem',
  backgroundColor: 'rgba(0,0,0,0.75)',
  color: '#fff',
  backdropFilter: 'blur(4px)',
  fontWeight: 'bold',
}));

const PlayButton = styled(Box)(({ theme }) => ({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  zIndex: 3,
  backgroundColor: theme.palette.primary.main,
  borderRadius: '50%',
  width: 56,
  height: 56,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
  cursor: 'pointer',
  '& svg': {
    fontSize: 32,
    color: 'white',
  },
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

const CreatorBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  marginTop: 'auto',
}));

interface GameCardProps {
  title: string;
  description: string;
  imageUrl: string;
  questionsCount: number;
  playsCount: number;
  creator: string;
  gameCode?: string;
}

const GameCard: React.FC<GameCardProps> = ({
  title,
  description,
  imageUrl,
  questionsCount,
  playsCount,
  creator,
  gameCode,
}) => {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);

  const toggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsFavorite(!isFavorite);
  };

  const handlePlayClick = () => {
    console.log(`Playing game: ${title}`);
    if (gameCode) {
      // Store the current code being used
      sessionStorage.setItem('currentGameCode', gameCode);
      // Navigate to play-game page with the code
      router.push(`/play-game?code=${gameCode}`);
    } else {
      console.log('No game code available for this game');
    }
  };

  // Generate a gradient background based on the title (for consistency)
  const generateGradient = (title: string | number | null | undefined) => {
    // Convert title to string and provide a fallback if it's not a valid string
    const titleStr = typeof title === 'string' ? title : String(title || 'Default Title');
    const hash = titleStr.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hue1 + 60) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 80%, 55%) 0%, hsl(${hue2}, 80%, 50%) 100%)`;
  };

  // Format play count for display
  const formatPlayCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <StyledCard 
      elevation={3}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image section with overlay */}
      <Box 
        sx={{ 
          position: 'relative', 
          pt: '56.25%', /* 16:9 aspect ratio */
          cursor: 'pointer' 
        }}
        onClick={handlePlayClick}
      >
        <CardMedia
          component="img"
          image={imageUrl}
          alt={title}
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
        <CardOverlay />
        <QuestionChip 
          icon={<QuestionIcon fontSize="small" />}
          label={`${questionsCount} questions`}
          size="small"
        />
        
        {/* Play button that appears on hover */}
        <PlayButton sx={{ opacity: isHovered ? 1 : 0, transition: 'opacity 0.2s' }}>
          <motion.div
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <PlayIcon />
          </motion.div>
        </PlayButton>
      </Box>
      
      {/* Content section */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h2" sx={{ 
            fontWeight: 'bold',
            fontSize: '1.1rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {title}
          </Typography>
          <Chip
            size="small"
            label={`${formatPlayCount(playsCount)} plays`}
            sx={{
              ml: 1,
              flexShrink: 0,
              background: generateGradient(title),
              color: 'white',
              fontWeight: 'bold',
            }}
          />
        </Box>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            height: '2.5em',
            mb: 1.5,
          }}
        >
          {description}
        </Typography>
      </CardContent>
      
      <Divider sx={{ mx: 2 }} />
      
      {/* Actions section */}
      <CardActions sx={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        px: 2, 
        py: 1,
      }}>
        <CreatorBox>
          <Avatar 
            sx={{ 
              width: 24, 
              height: 24, 
              mr: 1,
              fontSize: '0.75rem',
              background: generateGradient(creator)
            }}
          >
            {creator.charAt(0)}
          </Avatar>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'medium' }}>
            {creator}
          </Typography>
        </CreatorBox>
        
        <Box sx={{ display: 'flex', gap: '4px' }}>
          <Tooltip title="Edit">
            <IconButton 
              size="small" 
              sx={{ color: 'text.secondary' }} 
              onClick={(e) => e.stopPropagation()}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Stats">
            <IconButton 
              size="small" 
              sx={{ color: 'text.secondary' }} 
              onClick={(e) => e.stopPropagation()}
            >
              <StatsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}>
            <IconButton 
              size="small"
              onClick={toggleFavorite}
              color={isFavorite ? "error" : "default"}
            >
              {isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        </Box>
      </CardActions>
    </StyledCard>
  );
};

export default GameCard;