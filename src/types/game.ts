export interface GameData {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  questions: any[];
  creator: string;
  category?: number;
  gameMode?: 'solo' | 'team';
}

export interface Answer {
  text: string;
  isCorrect: boolean;
}

export interface GameResult {
  name: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  timeBonus: number;
  averageAnswerTime: number;
  avatar: string;
  avatarColor: string;
  group?: string;
} 