import React from 'react';
import { Box } from '@mui/material';
import PetsIcon from '@mui/icons-material/Pets';
import CatIcon from '@mui/icons-material/Pets';
import BugReportIcon from '@mui/icons-material/BugReport';
import WavesIcon from '@mui/icons-material/Waves';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';

// Define colorful background colors for each animal
const ANIMAL_COLORS: Record<string, string> = {
  cat: '#FF3355',
  dog: '#44BBFF',
  fox: '#FF9500',
  dinosaur: '#8855FF',
  unicorn: '#FF44AA',
  penguin: '#00CCAA',
  lion: '#FFCC00',
  monkey: '#AA5500',
  bird: '#00AAFF',
  fish: '#55DDFF',
  frog: '#77DD00',
  turtle: '#00AA55',
  owl: '#BB6600',
  butterfly: '#FF88DD',
  bee: '#FFDD00',
  default: '#9933FF'
};

// Define emoji representations for each animal
const ANIMAL_EMOJIS: Record<string, string> = {
  cat: '🐱',
  dog: '🐶',
  fox: '🦊',
  dinosaur: '🦖',
  unicorn: '🦄',
  penguin: '🐧',
  lion: '🦁',
  monkey: '🐵',
  bird: '🐦',
  fish: '🐠',
  frog: '🐸',
  turtle: '🐢',
  owl: '🦉',
  butterfly: '🦋',
  bee: '🐝',
  default: '🦊'
};

// Animal icon mapping for fallback
const getAnimalIcon = (animal: string) => {
  switch (animal) {
    case 'cat':
    case 'dog':
    case 'fox':
    case 'lion':
    case 'monkey':
      return <PetsIcon />;
    case 'butterfly':
    case 'bee':
      return <BugReportIcon />;
    case 'fish':
    case 'frog':
    case 'turtle':
      return <WavesIcon />;
    default:
      return <LocalFloristIcon />;
  }
};

interface CustomAnimalProps {
  animal: string;
  size?: string;
  color?: string;
  withBorder?: boolean;
}

const CustomAnimal: React.FC<CustomAnimalProps> = ({ 
  animal, 
  size = '40px',
  color,
  withBorder = false
}) => {
  const animalLower = animal.toLowerCase();
  const backgroundColor = color || ANIMAL_COLORS[animalLower] || ANIMAL_COLORS.default;
  const emoji = ANIMAL_EMOJIS[animalLower] || ANIMAL_EMOJIS.default;
  
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: `calc(${size} * 0.65)`,
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
        border: withBorder ? '2px solid white' : 'none',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '50%',
          background: 'rgba(255, 255, 255, 0.2)',
          borderTopLeftRadius: '50%',
          borderTopRightRadius: '50%'
        },
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.1)',
        }
      }}
    >
      {emoji}
    </Box>
  );
};

export default CustomAnimal; 