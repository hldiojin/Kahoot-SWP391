'use client';

import React from 'react';
import { Box, Container, CssBaseline } from '@mui/material';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <CssBaseline />
      <Sidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: 'background.default',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
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
    </Box>
  );
};

export default MainLayout; 