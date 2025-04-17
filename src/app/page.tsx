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
  useMediaQuery,
  useTheme
} from '@mui/material';
import { PlayArrow as PlayArrowIcon, VolumeUp as VolumeUpIcon } from '@mui/icons-material';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Styled components for custom styling
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.9)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const LogoTypography = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: theme.palette.primary.main,
  fontSize: '1.8rem',
  background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginRight: theme.spacing(4),
}));

const PageBackground = styled(Box)({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: -1,
  overflow: 'hidden',
});

const BackgroundPattern = styled(Box)({
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: `
    radial-gradient(circle at 80% 10%, rgba(33, 150, 243, 0.15), transparent 30%),
    radial-gradient(circle at 20% 30%, rgba(156, 39, 176, 0.15), transparent 40%),
    radial-gradient(circle at 70% 60%, rgba(103, 58, 183, 0.15), transparent 35%),
    radial-gradient(circle at 30% 80%, rgba(33, 150, 243, 0.15), transparent 40%)
  `,
});

const BackgroundSvg = styled(Box)({
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  height: '40vh',
  opacity: 0.8,
});

const HeroSection = styled(Container)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  paddingTop: theme.spacing(12),
  paddingBottom: theme.spacing(12),
  position: 'relative',
  zIndex: 1,
}));

const HeroTitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  fontWeight: 'bold',
  color: theme.palette.text.primary,
}));

const HeroSubtitle = styled(Typography)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  color: theme.palette.text.secondary,
  maxWidth: '700px', // Giá trị cố định thay vì phần trăm
  margin: '0 auto', // Căn giữa
  lineHeight: '1.6',
  [theme.breakpoints.down('sm')]: {
    maxWidth: '90%', // Thu nhỏ lại trên màn hình điện thoại
    fontSize: '1rem',
  },
}));

const SignUpButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 6),
  fontSize: '1.1rem',
  borderRadius: theme.shape.borderRadius * 2,
  textTransform: 'none',
  fontWeight: 'bold',
  marginBottom: theme.spacing(2),
  backgroundImage: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
  boxShadow: '0 4px 20px rgba(156, 39, 176, 0.4)',
  '&:hover': {
    boxShadow: '0 6px 30px rgba(156, 39, 176, 0.6)',
  },
}));

const PronunciationBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  color: theme.palette.text.secondary,
}));

const FloatingCard = styled(motion.div)(({ theme }) => ({
  background: 'white',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(3),
  boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
  marginTop: theme.spacing(6),
  width: '100%',
  maxWidth: 700,
}));

const FeatureBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  textAlign: 'center',
}));

export default function LandingPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const floatingCardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut"
      }
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
      {/* Background Elements */}
      <PageBackground>
        <BackgroundPattern />
        <BackgroundSvg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style={{ position: 'absolute', bottom: 0 }}>
            <path 
              fill="#e3f2fd" 
              fillOpacity="1" 
              d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,234.7C960,235,1056,213,1152,202.7C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
            </path>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" style={{ position: 'absolute', bottom: 0 }}>
            <path 
              fill="#bbdefb" 
              fillOpacity="0.7" 
              d="M0,128L48,144C96,160,192,192,288,213.3C384,235,480,245,576,234.7C672,224,768,192,864,176C960,160,1056,160,1152,170.7C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z">
            </path>
          </svg>
        </BackgroundSvg>
      </PageBackground>

      {/* Header */}
      <StyledAppBar position="static">
        <Toolbar>
          <LogoTypography variant="h6">
            Blooket
          </LogoTypography>
          <Box sx={{ flexGrow: 1 }} /> {/* Spacer */}
          <Button
            variant="outlined"
            startIcon={<PlayArrowIcon />}
            sx={{ 
              mr: 2, 
              textTransform: 'none',
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              }
            }}
          >
            Join a game
          </Button>
          <Button
            variant="outlined"
            sx={{ 
              textTransform: 'none',
              borderRadius: 2,
              borderWidth: 2,
              '&:hover': {
                borderWidth: 2,
              }
            }}
            href="/login"
            LinkComponent={Link}
          >
            Log in
          </Button>
        </Toolbar>
      </StyledAppBar>

      {/* Hero Section */}
      <HeroSection maxWidth="lg">
        <Box sx={{ 
          position: 'relative', 
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Decorative elements */}
          <motion.div
            style={{
              position: 'absolute',
              top: isMobile ? -60 : -100,
              right: isMobile ? 20 : 100,
              width: isMobile ? 60 : 100,
              height: isMobile ? 60 : 100,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #2196F3 30%, #1565c0 90%)',
              opacity: 0.6,
              zIndex: -1,
            }}
            animate={{
              y: [0, 15, 0],
              rotate: [0, 5, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
          
          <Box
            component={motion.div}
            sx={{
              position: 'absolute',
              top: isMobile ? 40 : 50,
              left: isMobile ? 30 : 150,
              width: isMobile ? 40 : 70,
              height: isMobile ? 40 : 70,
              borderRadius: '50%',
              background: 'linear-gradient(45deg, #9c27b0 30%, #7b1fa2 90%)',
              opacity: 0.6,
              zIndex: -1,
            }}
            animate={{
              y: [0, -20, 0],
              rotate: [0, -8, 0],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5
            }}
          />

          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <HeroTitle variant="h2">
              Fun, free, educational games for everyone!
            </HeroTitle>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <HeroSubtitle variant="h6" sx={{
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
            }}>
              Engage your students with our interactive learning platform. Create quizzes, games, and more!
            </HeroSubtitle>
          </motion.div>

          <Box component={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <SignUpButton
                variant="contained"
                color="primary"
                href="/signup"
                LinkComponent={motion.a}
              >
                Sign up for free
              </SignUpButton>
            </motion.div>
          </Box>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.5, delay: 0.8 }}
          >
            <PronunciationBox>
              <IconButton size="small" sx={{ mr: 0.5 }}>
                <VolumeUpIcon fontSize="inherit" />
              </IconButton>
              <Typography variant="caption">Pronounced ("Blue-kit")</Typography>
            </PronunciationBox>
          </motion.div>
        </Box>

        {/* Features section */}
        <FloatingCard
          variants={floatingCardVariants}
          initial="hidden"
          animate="visible"
        >
          <Typography variant="h5" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
            Why Choose Our Platform?
          </Typography>
          
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2 }}>
            <FeatureBox>
              <Box
                component="img"
                src="https://cdn-icons-png.flaticon.com/512/10292/10292284.png"
                alt="Quiz icon"
                sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>Interactive Learning</Typography>
              <Typography variant="body2" color="text.secondary">
                Engage students with fun quizzes, flashcards, and interactive games
              </Typography>
            </FeatureBox>
            
            <FeatureBox>
              <Box
                component="img"
                src="https://th.bing.com/th/id/OIP.6USzh4TybbYQwx5UjJFYmAHaHa?rs=1&pid=ImgDetMain"
                alt="Reports icon"
                sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>Insightful Reports</Typography>
              <Typography variant="body2" color="text.secondary">
                Track progress with detailed analytics and student performance data
              </Typography>
            </FeatureBox>
            
            <FeatureBox>
              <Box
                component="img"
                src="https://www.hardiagedcare.com.au/wp-content/uploads/2021/06/Collaboration_Icon-768x769.png"
                alt="Collaboration icon"
                sx={{ 
                  width: 80, 
                  height: 80, 
                  borderRadius: '50%', 
                  objectFit: 'cover',
                  mb: 2,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}
              />
              <Typography variant="h6" sx={{ mb: 1, fontWeight: 'medium' }}>Easy Sharing</Typography>
              <Typography variant="body2" color="text.secondary">
                Share resources with students and collaborate with other educators
              </Typography>
            </FeatureBox>
          </Box>
        </FloatingCard>
      </HeroSection>

      {/* Footer */}
      <Box 
        component="footer" 
        sx={{ 
          py: 3, 
          px: 2, 
          mt: 'auto', 
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderTop: '1px solid rgba(0, 0, 0, 0.05)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            {'Copyright © '} Blooket {new Date().getFullYear()}.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
