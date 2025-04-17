'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
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
  Logout as LogoutIcon,
} from '@mui/icons-material';

const drawerWidth = 280;
const collapsedWidth = 80;

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user, logout } = useAuth();

  // Only set mounted state after component mounts to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const menuItems = [
    { name: 'Home', path: '/dashboard', icon: HomeIcon },
    { name: 'Discover', path: '/discover', icon: SearchIcon },
    { name: 'My Sets', path: '/my-sets', icon: BookIcon },
    { name: 'Favorites', path: '/favorites', icon: StarIcon },
    { name: 'History', path: '/history', icon: HistoryIcon },
  ];

  // Don't render content until component has mounted on the client
  if (!mounted) {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

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
            Kahoot Clone
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

      {isOpen && (user?.role === 'teacher' || user?.role === 'admin') && (
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

      <Box sx={{ mt: 'auto', p: 2 }}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LogoutIcon />}
          onClick={() => setLogoutDialogOpen(true)}
          sx={{
            color: 'white',
            borderColor: 'white',
            '&:hover': {
              borderColor: 'white',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          {isOpen && 'Logout'}
        </Button>
      </Box>
    </Box>
  );

  return (
    <>
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

      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>Logout Confirmation</DialogTitle>
        <DialogContent>
          <Typography>Do you want to log out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setLogoutDialogOpen(false)}
            sx={{
              color: 'text.secondary',
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            No
          </Button>
          <Button 
            onClick={handleLogout}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1976D2 30%, #7B1FA2 90%)',
              },
            }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar; 