import { GameData } from '@/types/game';

export const formatPlayerForQuiz = (playerName: string, avatar: string, team?: string) => {
  return {
    name: playerName,
    avatar: avatar,
    group: team
  };
};

export const getTeamNames = (gameData: GameData) => {
  if (gameData.gameMode === 'team') {
    return ['Team A', 'Team B', 'Team C', 'Team D'];
  }
  return [];
};

export const getGameModeSetting = (gameData: GameData) => {
  return gameData.gameMode || 'solo';
}; 