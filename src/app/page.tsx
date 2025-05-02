'use client';

import React, { useState, useEffect } from 'react';
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
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  alpha,
  CircularProgress,
  InputAdornment,
  Fade,
  Chip
} from '@mui/material';
import { PlayArrow as PlayArrowIcon, VolumeUp as VolumeUpIcon, LockOutlined as LockIcon, Games as GamesIcon } from '@mui/icons-material';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Dynamically import motion components with no SSR
const MotionBox = dynamic(() => import('framer-motion').then((mod) => {
  const { motion } = mod;
  return motion.div;
}), { ssr: false });

const MotionButton = dynamic(() => import('framer-motion').then((mod) => {
  const { motion } = mod;
  return motion.button;
}), { ssr: false });

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
  maxWidth: '700px',
  margin: '0 auto',
  lineHeight: '1.6',
  [theme.breakpoints.down('sm')]: {
    maxWidth: '90%',
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

const FeatureBox = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(2),
  textAlign: 'center',
}));

export default function LandingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [currentYear, setCurrentYear] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const router = useRouter();
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [gameCode, setGameCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [recentGames, setRecentGames] = useState<string[]>([]);
  const [animationStyles, setAnimationStyles] = useState({});

  useEffect(() => {
    setIsMounted(true);
    setCurrentYear(new Date().getFullYear().toString());
    
    // Set animation styles only on client side
    setAnimationStyles({
      fadeInUp: {
        opacity: 1,
        transform: 'translateY(0)'
      },
      scaleIn: {
        transform: 'scale(1)'
      }
    });
  }, []);

  useEffect(() => {
    if (isMounted && joinDialogOpen) {
      try {
        const recentGamesList = JSON.parse(localStorage.getItem('recentGameCodes') || '[]');
        setRecentGames(recentGamesList.slice(0, 3));
      } catch (e) {
        console.error("Error loading recent games:", e);
      }
    }
  }, [isMounted, joinDialogOpen]);

  const handleJoinGame = () => {
    setJoinDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setJoinDialogOpen(false);
    setGameCode('');
    setErrorMessage('');
  };

  const handleSubmitCode = async () => {
    if (!gameCode.trim()) {
      setErrorMessage('Vui lòng nhập mã trò chơi');
      return;
    }
    
    if (!/^\d{6}$/.test(gameCode)) {
      setErrorMessage('Mã trò chơi phải gồm 6 chữ số');
      return;
    }
    
    setIsJoining(true);
    setErrorMessage('');
    
    try {
      // Mã thử nghiệm
      if (['123456', '234567', '345678', '857527', '925101'].includes(gameCode)) {
        saveRecentGameCode(gameCode);
        sessionStorage.setItem('currentGameCode', gameCode);
        sessionStorage.setItem('isTestGame', 'true');
        router.push(`/play-game?code=${gameCode}&test=true`);
        return;
      }
      
      // Kiểm tra quiz code bằng API với đúng endpoint và URL đầy đủ
      try {
        const quizResponse = await axios.get(
          `https://kahootclone-f7hkd0hwafgbfrfa.southeastasia-01.azurewebsites.net/api/Quiz/check-quiz-code/${gameCode}`
        );
        
        console.log("API Response:", quizResponse.data);
        
        // Kiểm tra response và xử lý trường hợp chỉ có "message": "Quiz code is valid."
        if (quizResponse.data) {
          if (quizResponse.data.data) {
            // Nếu có data, sử dụng như bình thường
            console.log("Tìm thấy quiz:", quizResponse.data);
            
            // Lưu thông tin và chuyển hướng
            saveRecentGameCode(gameCode);
            sessionStorage.setItem('currentGameCode', gameCode);
            sessionStorage.setItem('currentQuiz', JSON.stringify(quizResponse.data.data));
            
            // Lưu game vào sessionStorage với key specifcGameKey
            const specificGameKey = `game_${gameCode}`;
            const gameData = {
              id: quizResponse.data.data.id,
              title: quizResponse.data.data.title,
              description: quizResponse.data.data.description,
              coverImage: quizResponse.data.data.thumbnailUrl,
              createdBy: quizResponse.data.data.createdBy,
              gameMode: quizResponse.data.data.gameMode || 'solo',
              category: quizResponse.data.data.categoryId
            };
            
            // Lưu vào sessionStorage
            sessionStorage.setItem(specificGameKey, JSON.stringify(gameData));
            console.log(`Game saved to sessionStorage with key: ${specificGameKey}`);
            
            router.push(`/play-game?code=${gameCode}`);
          } 
          // Kiểm tra trường hợp message: "Quiz code is valid."
          else if (quizResponse.data.message === "Quiz code is valid.") {
            console.log("Found valid quiz code without details:", gameCode);
            
            // Lưu thông tin cơ bản
            saveRecentGameCode(gameCode);
            sessionStorage.setItem('currentGameCode', gameCode);
            
            // Tạo dữ liệu cơ bản cho quiz
            const specificGameKey = `game_${gameCode}`;
            const gameData = {
              id: parseInt(gameCode),
              title: `Quiz ${gameCode}`,
              description: "Quiz đã được xác nhận",
              coverImage: 'https://source.unsplash.com/random/300x200?quiz',
              createdBy: "Teacher",
              gameMode: 'solo',
              category: 1
            };
            
            // Lưu vào sessionStorage
            sessionStorage.setItem(specificGameKey, JSON.stringify(gameData));
            console.log(`Basic game info saved to sessionStorage with key: ${specificGameKey}`);
            
            router.push(`/play-game?code=${gameCode}`);
          } else {
            throw new Error("Không tìm thấy quiz với mã này");
          }
        } else {
          throw new Error("Không tìm thấy quiz với mã này");
        }
      } catch (error) {
        console.error("Không thể tìm quiz:", error);
        setErrorMessage(`Không tìm thấy quiz với mã ${gameCode}. Vui lòng kiểm tra lại mã và thử lại.`);
      }
    } catch (error) {
      console.error("Lỗi tham gia trò chơi:", error);
      setErrorMessage(`Không thể tìm thấy quiz với mã ${gameCode}. Vui lòng kiểm tra lại mã và thử lại.`);
    } finally {
      setIsJoining(false);
    }
  };

  const saveRecentGameCode = (code: string) => {
    try {
      const recentCodes = JSON.parse(localStorage.getItem('recentGameCodes') || '[]');
      const updatedCodes = recentCodes.filter((c: string) => c !== code);
      updatedCodes.unshift(code);
      const trimmedCodes = updatedCodes.slice(0, 5);
      localStorage.setItem('recentGameCodes', JSON.stringify(trimmedCodes));
    } catch (e) {
      console.error("Error saving recent game code:", e);
    }
  };

  const joinRecentGame = (code: string) => {
    setGameCode(code);
    handleSubmitCode();
  };

  if (!isMounted) {
    // Return a simple loading state to avoid hydration mismatch
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative' }}>
        <StyledAppBar position="static">
          <Toolbar>
            <LogoTypography variant="h6">
              Kahoot_Clone
            </LogoTypography>
            <Box sx={{ flexGrow: 1 }} />
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              sx={{
                mr: 2,
                borderRadius: 2,
                background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              }}
            >
              Join a game
            </Button>
            <Button
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Log in
            </Button>
          </Toolbar>
        </StyledAppBar>
        
        <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Container>
      </Box>
    );
  }

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
            Kahoot_Clone
          </LogoTypography>
          <Box sx={{ flexGrow: 1 }} />
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            sx={{ 
              mr: 2, 
              textTransform: 'none',
              borderRadius: 2,
              fontWeight: 'medium',
              px: 2,
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              boxShadow: '0 2px 10px rgba(33, 150, 243, 0.3)',
              '&:hover': {
                boxShadow: '0 4px 15px rgba(33, 150, 243, 0.5)',
              }
            }}
            onClick={handleJoinGame}
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
          <MotionBox
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
          
          <MotionBox
            style={{
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

          <MotionBox
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <HeroTitle variant="h2">
              Fun, free, educational games for everyone!
            </HeroTitle>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
          >
            <HeroSubtitle variant="h6" sx={{
              fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' }
            }}>
              Engage your students with our interactive learning platform. Create quizzes, games, and more!
            </HeroSubtitle>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Box
              sx={{
                '&:hover': {
                  transform: 'scale(1.05)',
                  transition: 'transform 0.2s'
                },
                '&:active': {
                  transform: 'scale(0.95)',
                },
              }}
            >
              <SignUpButton
                variant="contained"
                color="primary"
                href="/signup"
                LinkComponent={Link}
              >
                Sign up for free
              </SignUpButton>
            </Box>
          </MotionBox>

          <MotionBox
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
          </MotionBox>
        </Box>

        {/* Features section */}
        <Paper
          elevation={1}
          sx={{
            background: 'white',
            borderRadius: theme.shape.borderRadius * 2,
            padding: theme.spacing(3),
            boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
            marginTop: theme.spacing(6),
            width: '100%',
            maxWidth: 700,
            opacity: isMounted ? 1 : 0,
            transform: isMounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
          }}
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
        </Paper>
      </HeroSection>

      {/* Join Game Dialog */}
      <Dialog 
        open={joinDialogOpen} 
        onClose={handleCloseDialog}
        PaperProps={{
          sx: {
            borderRadius: 3,
            maxWidth: 450,
            width: '90%'
          }
        }}
        TransitionComponent={Fade}
        transitionDuration={300}
      >
        <DialogTitle 
          component="div"
          sx={{ 
            textAlign: 'center', 
            fontWeight: 'bold',
            pt: 3,
            pb: 1,
            fontSize: '1.5rem',
            background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <GamesIcon sx={{ mr: 1, fontSize: '1.8rem', opacity: 0.8 }} />
          Tham gia trò chơi
        </DialogTitle>

        <DialogContent>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="subtitle1" sx={{ mb: 1 }}>
              Không cần tài khoản để chơi!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Nhập mã trò chơi 6 chữ số do giáo viên cung cấp
            </Typography>
            
            {errorMessage && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errorMessage}
              </Alert>
            )}
            
            <Box 
              sx={{ 
                mb: 3,
                transform: isMounted ? 'scale(1)' : 'scale(0.95)',
                transition: 'transform 0.3s ease',
              }}
            >
              <TextField
                autoFocus
                fullWidth
                value={gameCode}
                onChange={(e) => {
                  setGameCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                  if (errorMessage) setErrorMessage('');
                }}
                placeholder="Nhập mã"
                variant="outlined"
                disabled={isJoining}
                inputProps={{ 
                  style: { 
                    textAlign: 'center', 
                    fontSize: '2rem', 
                    fontWeight: 'bold',
                    letterSpacing: 8,
                    padding: '16px'
                  },
                  maxLength: 6
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: 'primary.main', opacity: 0.7 }} />
                    </InputAdornment>
                  ),
                  sx: { 
                    borderRadius: 3,
                    backgroundColor: alpha('#f5f7fa', 0.7)
                  }
                }}
              />
            </Box>

            {/* Hiển thị các game gần đây */}
            {recentGames.length > 0 && (
              <Box sx={{ mt: 3, mb: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  Trò chơi gần đây:
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  {recentGames.map((code) => (
                    <Chip
                      key={code}
                      label={code}
                      variant="outlined"
                      color="primary"
                      onClick={() => joinRecentGame(code)}
                      sx={{ 
                        fontWeight: 'medium',
                        px: 0.5,
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, display: 'block', textAlign: 'center' }}>
              Để thử nghiệm, hãy dùng mã: 123456, 234567, 345678, 857527, hoặc 925101
            </Typography>
          </Box>
        </DialogContent>

        <DialogActions sx={{ 
          justifyContent: 'center',
          flexDirection: 'column', 
          pb: 3, 
          px: 3,
          gap: 1
        }}>
          <Button 
            onClick={handleSubmitCode} 
            variant="contained" 
            fullWidth
            size="large"
            disabled={isJoining}
            sx={{ 
              borderRadius: 2,
              py: 1.5,
              background: 'linear-gradient(45deg, #2196F3 30%, #9C27B0 90%)',
              boxShadow: '0 4px 20px rgba(33, 150, 243, 0.4)',
              fontWeight: 'bold',
              fontSize: '1.1rem'
            }}
          >
            {isJoining ? <CircularProgress size={24} color="inherit" /> : 'Tham gia'}
          </Button>
          <Button 
            onClick={handleCloseDialog} 
            variant="text"
            size="small"
            sx={{ color: 'text.secondary' }}
            disabled={isJoining}
          >
            Huỷ
          </Button>
        </DialogActions>
      </Dialog>

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
            {'Copyright © Blooket '}{currentYear || '2024'}.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
