'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  IconButton,
  Paper,
  styled,
} from '@mui/material';
import { PlayArrow as PlayArrowIcon, VolumeUp as VolumeUpIcon } from '@mui/icons-material';
import Link from 'next/link';

// Styled components for custom styling
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'white',
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const LogoTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.primary.main, // Or a specific brand color
  fontSize: '1.8rem',
  background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginRight: theme.spacing(4),
}));

const HeroSection = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(12),
}));

const HeroTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 'bold',
  color: theme.palette.text.primary,
}));

const HeroSubtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  color: theme.palette.text.secondary,
}));

const SignUpButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 6),
  fontSize: '1.1rem',
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 'bold',
  marginBottom: theme.spacing(2),
}));

const PronunciationBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
}));

export default function LandingPage() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <StyledAppBar position="static">
        <Toolbar>
          <LogoTypography variant="h6">
            Blooket Clone
          </LogoTypography>
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            sx={{ mr: 2, textTransform: 'none' }}
            // Add Link component or onClick handler for navigation
            // href="/join" // Example using Link
          >
            Join a game
          </Button>
          <Button
            variant="outlined"
            sx={{ textTransform: 'none' }}
            href="/login" // Link to login page
            LinkComponent={Link}
          >
            Log in
          </Button>
        </Toolbar>
      </StyledAppBar>

      {/* Hero Section */}
      <HeroSection maxWidth="md">
        {/* Optional: Add images similar to Blooket here */}
        {/* Example: <img src="/path/to/image.svg" alt="Educational illustration" /> */}

        <HeroTitle variant="h3">
          Fun, free, educational games for everyone!
        </HeroTitle>

        <SignUpButton
          variant="contained"
          color="primary"
          href="/signup" // Link to sign up page
          LinkComponent={Link}
        >
          Sign up
        </SignUpButton>

        <PronunciationBox>
          <IconButton size="small" sx={{ mr: 0.5 }}>
            <VolumeUpIcon fontSize="inherit" />
          </IconButton>
          <Typography variant="caption">Pronounced ("Blue-kit")</Typography>
        </PronunciationBox>

        {/* Optional: Add more images/illustrations here */}
      </HeroSection>

      {/* Optional: Footer Section */}
      {/* <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[200] }}>
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            {'Copyright © '} Blooket Clone {new Date().getFullYear()}.
          </Typography>
        </Container>
      </Box> */}
    </Box>
  );
}
