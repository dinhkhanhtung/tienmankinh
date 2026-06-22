export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  birthYear?: number;
  height?: number; // cm
  weight?: number; // kg
  periodAge?: number; // tuổi có kinh lần đầu
  childrenCount?: number; // số con
  bmi?: number;
  isOnboarded: boolean;
  theme?: 'light' | 'dark';
  todayChatCount?: number;
  lastChatDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PeriodCycle {
  id: string; // id ngẫu nhiên hoặc của document
  userId: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null; // YYYY-MM-DD (null nếu đang hành kinh)
  duration: number | null; // Số ngày hành kinh
  cycleLength: number | null; // Độ dài chu kỳ (số ngày từ startDate chu kỳ trước đến startDate chu kỳ này)
  isAbnormal?: boolean;
  notes?: string;
}

export interface SymptomCategory {
  // Vận mạch
  hotFlashes: number; // 0-3
  nightSweats: number; // 0-3
  palpitations: number; // 0-3
  // Thần kinh
  insomnia: number; // 0-3
  anxiety: number; // 0-3
  irritability: number; // 0-3
  depression: number; // 0-3
  // Cơ thể
  jointPain: number; // 0-3
  fatigue: number; // 0-3
  weightGain: number; // 0-3
  drySkin: number; // 0-3
  // Sinh dục
  vaginalDryness: number; // 0-3
  lowLibido: number; // 0-3
}

export type MoodLevel = 'very-good' | 'good' | 'neutral' | 'bad' | 'very-bad';

export interface SleepData {
  bedTime: string; // HH:MM
  wakeTime: string; // HH:MM
  awakenings: number; // số lần thức giấc
  quality: number; // 1-10
  totalDuration: number; // phút (tự động tính từ bedTime & wakeTime)
}

export interface MoodData {
  level: MoodLevel;
  note: string; // hỗ trợ Web Speech API nhập giọng nói
}

export interface DailyLog {
  id: string; // định dạng YYYY-MM-DD
  userId: string;
  date: string; // YYYY-MM-DD
  symptoms: SymptomCategory;
  sleep: SleepData;
  mood: MoodData;
  periScore: number; // 0-100
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}
