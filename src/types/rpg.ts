export type StatType = "STR" | "INT" | "DEX" | "WIL" | "CHA";
export type QuestRank = "E" | "D" | "C" | "B" | "A" | "S";

export interface SubquestItem {
  id: string;
  title: string;
  done: boolean;
}

export interface HunterProfile {
  id: string;
  onboarded: boolean;
  name: string;
  title: string;
  hunterClass: string;
  mainGoal: string;
  bio: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  gold: number;
  streakDays: number;
  freezeShields: number;
  statPoints: number;
  str: number;
  intel: number;
  dex: number;
  wil: number;
  cha: number;
  focusMinutesTotal: number;
  bountiesSlain: number;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  rank: QuestRank;
  stat: StatType;
  xpReward: number;
  goldReward: number;
  isFrog: boolean;
  completed: boolean;
  subquests: SubquestItem[];
  estimatedMinutes: number;
  createdAt: string;
  completedAt?: string | null;
}

export interface DailyRitual {
  id: string;
  title: string;
  stat: StatType;
  streak: number;
  completedToday: boolean;
  xpReward: number;
  goldReward: number;
  hpPenalty: number;
}

export interface HabitDemon {
  id: string;
  title: string;
  type: "POSITIVE" | "DEMON";
  stat: StatType;
  cleanDays: number;
  urgesResisted: number;
  relapses: number;
  xpValue: number;
  goldValue: number;
  hpPenalty: number;
  lastActionAt: string;
}

export interface FocusSession {
  id: string;
  questTitle: string;
  monsterName: string;
  minutes: number;
  overdriveMinutes: number;
  xpEarned: number;
  goldEarned: number;
  status: "VICTORY" | "DESERTED";
  createdAt: string;
}

export interface TavernItem {
  id: string;
  title: string;
  description: string;
  category: "REAL_REWARD" | "ARTIFACT" | "CONSUMABLE";
  cost: number;
  icon: string;
  effectType: "HEAL_HP" | "SHIELD" | "BUFF_XP" | "CUSTOM";
  ownedCount: number;
}

export interface ReflectionLog {
  id: string;
  dateLabel: string;
  moodScore: number;
  energyScore: number;
  wins: string;
  blockers: string;
  tomorrowFrog: string;
  xpEarned: number;
  createdAt: string;
}

export interface RpgStatePayload {
  profile: HunterProfile;
  quests: Quest[];
  dailies: DailyRitual[];
  habits: HabitDemon[];
  focusSessions: FocusSession[];
  tavernItems: TavernItem[];
  reflections: ReflectionLog[];
}
