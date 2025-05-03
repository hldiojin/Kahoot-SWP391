'use client';

import React, { useState, useEffect } from 'react';
import { Box, Container, CssBaseline, AppBar, Toolbar, Typography, Button } from '@mui/material';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PublicLayoutProps {
  children: React.ReactNode;
}

interface GameCardProps {
  title: string;           // The title of the game
  description: string;     // A text description of the game
  imageUrl: string;        // URL to the game's cover image
  questionsCount: number;  // Number of questions in the game
  playsCount: number;      // Number of times the game has been played
  creator: string;         // Username of the game creator
  gameCode?: string;       // Optional code used to join/play the game
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null; // Prevent hydration issues
  }
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Simple header for non-logged-in users */}
      <AppBar 
        position="static"
        sx={{ 
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          borderBottom: '1px solid rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              flexGrow: 1,
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.8rem'
            }}
          >
            <Link href="/" style={{ textDecoration: 'none' }}>
              Kahoot_Clone
            </Link>
          </Typography>
          <Button 
            color="primary" 
            variant="outlined"
            onClick={() => router.push('/')}
            sx={{ 
              textTransform: 'none',
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              }
            }}
          >
            Back to Home
          </Button>
        </Toolbar>
      </AppBar>
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'background.default',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Container maxWidth="xl">
          <Box
            sx={{
              bgcolor: 'background.paper',
              borderRadius: 2,
              p: 3,
              boxShadow: 3,
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.7)',
            }}
          >
            {children}
          </Box>
        </Container>
      </Box>
      
      {/* Simple footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          textAlign: 'center'
        }}
      >
        <Typography variant="body2" color="text.secondary">
          {'Copyright © '} Kahoot_Clone {new Date().getFullYear()}.
        </Typography>
      </Box>
    </Box>
  );
};

export default PublicLayout; 