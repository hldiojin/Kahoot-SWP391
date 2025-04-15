'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Typography,
  Button,
  Paper,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Home as HomeIcon,
  Search as SearchIcon,
  Book as BookIcon,
  Star as StarIcon,
  History as HistoryIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const drawerWidth = 280;
const collapsedWidth = 80;

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const menuItems = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Discover', path: '/discover', icon: SearchIcon },
    { name: 'My Sets', path: '/my-sets', icon: BookIcon },
    { name: 'Favorites', path: '/favorites', icon: StarIcon },
    { name: 'History', path: '/history', icon: HistoryIcon },
  ];

  const drawer = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        background: 'linear-gradient(to bottom, #1a1a1a, #2d2d2d)',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          sx={{ color: 'white' }}
        >
          {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
        {isOpen && (
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Blooket
          </Typography>
        )}
      </Box>

      <List sx={{ px: 2, mt: 2 }}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                component={Link}
                href={item.path}
                sx={{
                  borderRadius: 2,
                  bgcolor: isActive ? 'primary.main' : 'transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'primary.dark' : 'rgba(255, 255, 255, 0.08)',
                  },
                  color: 'white',
                }}
              >
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  <Icon />
                </ListItemIcon>
                {isOpen && (
                  <ListItemText
                    primary={item.name}
                    sx={{ '& .MuiTypography-root': { fontWeight: 'medium' } }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {isOpen && (
        <Box sx={{ mt: 'auto', p: 2 }}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              color: 'white',
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              Create your own game
            </Typography>
            <Button
              variant="contained"
              fullWidth
              startIcon={<AddIcon />}
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.9)',
                },
              }}
            >
              Create
            </Button>
          </Paper>
        </Box>
      )}
    </Box>
  );

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: isOpen ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: isOpen ? drawerWidth : collapsedWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
        },
      }}
    >
      {drawer}
    </Drawer>
  );
};

export default Sidebar; 