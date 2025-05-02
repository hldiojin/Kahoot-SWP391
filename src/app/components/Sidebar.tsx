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
  Divider,
  Tooltip,
  Avatar,
  useTheme,
  useMediaQuery,
  CircularProgress,
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
  Person as ProfileIcon,
  Logout as LogoutIcon,
} from '@mui/icons-material';
import authService from '@/services/authService';

const drawerWidth = 280;
const collapsedWidth = 80;

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  const pathname = usePathname();
  const theme = useTheme();
  const router = useRouter();
  const { user, logout } = useAuth();

  // First useEffect - set mounted state
  useEffect(() => {
    setMounted(true);
  }, []);

  // Second useEffect - fetch user profile
  useEffect(() => {
    if (mounted && user?.id) {
      const fetchUserProfile = async () => {
        try {
          const profile = await authService.getCurrentUserProfile();
          setUserProfile(profile);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
        }
      };

      fetchUserProfile();
    }
  }, [mounted, user?.id]);

  const menuItems = [
    { name: 'Home', path: '/dashboard', icon: HomeIcon },
    { name: 'Discover', path: '/discover', icon: SearchIcon },
    { name: 'My Sets', path: '/my-sets', icon: BookIcon },
    { name: 'Favorites', path: '/favorites', icon: StarIcon },
    { name: 'History', path: '/history', icon: HistoryIcon },
    { name: 'My Profile', path: '/profile', icon: ProfileIcon },
  ];

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);

      // Chỉ sử dụng hàm logout từ context
      if (logout) {
        await logout();
      }

      router.push('/login');
    } catch (error) {
      console.error('Error during logout:', error);
      // Nếu lỗi, vẫn chuyển đến trang login vì token đã bị xóa
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  // If not mounted yet, return null or a minimal placeholder
  if (!mounted) {
    return null;
  }

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
      {/* Rest of the drawer content remains the same */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
        }}
      >
        {isOpen && (
          <Typography
            variant="h6"
            sx={{
              color: 'white',
              fontWeight: 'bold',
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '25px',
              marginRight: 'auto'
            }}
          >
            Kahoot_Clone
          </Typography>
        )}
        <IconButton
          onClick={() => setIsOpen(!isOpen)}
          sx={{ color: 'white' }}
        >
          {isOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
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
              component={Link}
              href="/create-game"
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

      {/* User profile section with logout button */}
      <Box 
        sx={{ 
          mt: 'auto',
          borderTop: '1px solid rgba(255, 255, 255, 0.12)',
          py: 2,
          px: isOpen ? 2 : 1
        }}
      >
        {isOpen ? (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar 
              sx={{ 
                width: 40, 
                height: 40, 
                mr: 2,
                bgcolor: 'primary.main',
                background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              }}
            >
              {(userProfile?.username?.charAt(0) || 
                user?.name?.charAt(0) || 
                user?.id?.toString().charAt(0) || 
                'U').toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 'medium',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {userProfile?.username || user?.name || 'User'}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  textOverflow: 'ellipsis',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap'
                }}
              >
                {(user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'User')}
              </Typography>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
            <Tooltip title={userProfile?.username || user?.name || 'User'} placement="right">
              <Avatar 
                sx={{ 
                  width: 40, 
                  height: 40,
                  bgcolor: 'primary.main',
                  background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
                }}
              >
                {(userProfile?.username?.charAt(0) || 
                  user?.name?.charAt(0) || 
                  user?.id?.toString().charAt(0) || 
                  'U').toUpperCase()}
              </Avatar>
            </Tooltip>
          </Box>
        )}

        {/* Logout button with loading state */}
        <Button
          variant="contained"
          fullWidth
          startIcon={isLoggingOut ? null : <LogoutIcon />}
          onClick={handleLogout}
          disabled={isLoggingOut}
          sx={{
            borderRadius: 2,
            bgcolor: 'rgba(255, 255, 255, 0.12)',
            color: 'white',
            justifyContent: isOpen ? 'flex-start' : 'center',
            py: 1,
            '&:hover': {
              bgcolor: 'rgba(255, 255, 255, 0.2)',
            },
            transition: 'all 0.3s ease',
          }}
        >
          {isLoggingOut ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            isOpen && 'Logout'
          )}
        </Button>
      </Box>
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