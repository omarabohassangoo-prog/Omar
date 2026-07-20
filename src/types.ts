// ============================================================
// types.ts - تعريفات الأنواع المشتركة للتطبيق
// ============================================================

// ===== أنواع القواعد النحوية =====
export interface GrammarExample {
  sentence: string;
  translation: string;
  explanation?: string;
}

export interface GrammarRule {
  id: number;
  rule: string;
  structure: string;
  usage?: string[];
  keywords?: string[];
  examples: GrammarExample[];
  negative_form?: string;
  question_form?: string;
  common_mistakes?: string[];
  description?: string;
}

export interface GrammarData {
  grammar_rules: GrammarRule[];
}

// ===== أنواع القصة =====
export interface StoryContentItem {
  sentence: string;
  translation: string;
  grammar_rules?: number[];
}

export interface StoryChapter {
  number: number;
  title: string;
  title_ar: string;
  content: StoryContentItem[];
}

export interface StoryData {
  title: string;
  title_ar: string;
  total_chapters: number;
  grammar_rules?: GrammarRule[];
  chapters: StoryChapter[];
}

// ===== أنواع المفردات =====
export interface VocabularyWord {
  en: string;
  ar: string;
  ipa?: string;
  type?: string;
  example?: string;
  example_ar?: string;
  source?: string[];
}

export interface VocabularyItem {
  type?: string;
  name?: string;
  words: VocabularyWord[];
}

export interface VocabularySection {
  name: string;
  name_en?: string;
  items: VocabularyItem[];
}

export interface VocabularyData {
  title: string;
  title_en?: string;
  total_items?: number;
  sections: Record<string, VocabularySection>;
}

// ===== أنواع الصوتيات =====
export interface PhoneticSymbol {
  symbol: string;
  example: string;
  description: string;
  audio_example?: string;
}

export interface PhoneticCategory {
  name: string;
  name_en: string;
  symbols: PhoneticSymbol[];
}

export interface PhoneticData {
  phonetic_symbols: Record<string, PhoneticCategory>;
  words?: VocabularyWord[];
}

// ===== أنواع المستخدم =====
export type UserRole = 'visitor' | 'admin';
export interface UserProgress {
  user_id: string;
  role?: UserRole;
  joined_date: string;
  completed_chapters: number[];
  current_chapter: number;
  completed_rules: number[];
  learned_words: string[];
  quiz_scores: Record<string, number>;
  streak_days: number;
  last_active: string;
  total_hours: number;
  achievements: string[];
  level: number;
  xp: number;
  next_level_xp: number;
  badges_earned?: number;
  total_xp?: number;
  daily_streak?: number;
  last_lesson_date?: string;
}

export interface UserPreferences {
  user_id: string;
  theme: 'dark' | 'light' | 'sepia' | 'high_contrast';
  audio_speed: number;
  daily_goal: number;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  notifications: {
    daily_reminder: boolean;
    streak_alert: boolean;
    achievement_unlock: boolean;
    new_content: boolean;
  };
  preferred_categories: string[];
  font_size: 'small' | 'medium' | 'large';
  auto_play_audio: boolean;
  show_translation: boolean;
  privacy: {
    share_progress: boolean;
    analytics: boolean;
  };
}

// ===== أنواع الاختبارات =====
export interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'matching' | 'true_false';
  question: string;
  question_ar?: string;
  options?: string[];
  correct_answer: string | number;
  explanation?: string;
  explanation_ar?: string;
}

export interface Quiz {
  id: string;
  type: 'vocabulary' | 'grammar' | 'comprehension';
  chapter_reference?: number;
  title: string;
  title_en?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  time_limit: number;
  passing_score: number;
  questions: QuizQuestion[];
}

export interface QuizData {
  quizzes: Quiz[];
}

// ===== أنواع الإنجازات =====
export interface AchievementRequirement {
  type: 'lessons_completed' | 'streak_days' | 'words_learned' | 'rules_completed' | 'chapters_completed';
  count: number;
}

export interface AchievementReward {
  xp: number;
  badge: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface Achievement {
  id: string;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  icon: string;
  requirement: AchievementRequirement;
  reward: AchievementReward;
  unlocked: boolean;
}

export interface AchievementsData {
  achievements: Achievement[];
}

// ===== أنواع الإعلانات =====
export interface AdSlot {
  id: string;
  type: 'banner' | 'interstitial' | 'native' | 'video';
  size: string;
  position: 'header' | 'sidebar' | 'between_content' | 'after_quiz' | 'footer';
  responsive: boolean;
  frequency: number;
  priority: 'high' | 'medium' | 'low';
}

export interface AdsConfig {
  google_site_verification?: string;
  gemini_api_key?: string;
  gemini_model?: string;
  site_url?: string;
  site_icon_url?: string;
  google_analytics_id?: string;
  ad_slots: Record<string, AdSlot>;
  display_settings: {
    delay_between_ads: number;
    max_ads_per_session: number;
    auto_refresh: boolean;
    lazy_load: boolean;
    responsive: boolean;
    load_on_scroll: boolean;
    placeholder_color: string;
  };
  blocked_categories: string[];
  ad_units: {
    enabled: boolean;
    test_mode: boolean;
    publisher_id: string;
  };
}

// ===== أنواع الإحصائيات =====
export interface Statistics {
  total_users: number;
  total_lessons_completed: number;
  average_score: number;
  popular_chapters: { chapter: number; views: number }[];
  daily_active_users: number;
  weekly_active_users: number;
  monthly_active_users: number;
  total_minutes_learned: number;
  average_learning_time: number;
  most_learned_words: string[];
  most_visited_section: 'story' | 'grammar' | 'vocabulary' | 'phonetics';
  device_stats: { mobile: number; desktop: number; tablet: number };
  language_stats: { ar: number; en: number; other: number };
}

// ===== أنواع الإشعارات =====
export interface Notification {
  id: string;
  type: 'daily_reminder' | 'achievement' | 'streak_alert' | 'new_content' | 'quiz_result';
  title: string;
  message: string;
  icon: string;
  date: string;
  read: boolean;
  action_url: string;
  priority: 'high' | 'medium' | 'low';
}

export interface NotificationsData {
  notifications: Notification[];
}

// ===== أنواع القاموس =====
export interface DictionaryEntry {
  word: string;
  ipa: string;
  ar: string;
  type: string;
  synonyms: string[];
  antonyms: string[];
  sentences: { en: string; ar: string }[];
  level: 'a1' | 'a2' | 'b1' | 'b2' | 'c1' | 'c2';
}

export interface DictionaryData {
  dictionary: DictionaryEntry[];
}

// ===== أنواع محملات البيانات =====
export interface DataLoader<T> {
  data: T | null;
  _loaded: boolean;
  currentView: 'main' | 'detail';
  load(): Promise<boolean>;
  render(container: HTMLElement): void;
}

// ===== أنواع تطبيقية عامة =====
export interface AppState {
  currentTab: 'story' | 'grammar' | 'vocabulary' | 'phonetics';
  currentView: 'main' | 'detail';
  initialized: boolean;
  user?: UserProgress;
  preferences?: UserPreferences;
}

// ===== أنواع الإشعارات =====
export interface ToastOptions {
  message: string;
  duration?: number;
  type?: 'info' | 'success' | 'error' | 'warning';
}

// ===== الإعلانات العامة للنافذة =====
declare global {
  interface Window {
    showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
    updateBreadcrumb: (detailName: string | null) => void;
    scrollToTop: () => void;
    renderCurrentTab: () => void;
    goToHome: () => void;
    goBackToMain: () => void;
    loadAllData: () => void;
    updateBadges: () => void;
    fixIPADisplay: () => void;
    StoryLoader: any;
    GrammarLoader: any;
    VocabularyLoader: any;
    PhoneticsLoader: any;
    AudioEngine: any;
    speakText: (text: string) => boolean;
    speakSlow: (text: string) => boolean;
    speakFast: (text: string) => boolean;
    stopSpeaking: () => boolean;
    speakRepeat: (text: string, times?: number) => boolean;
    speakList: (words: string[]) => boolean;
    grantAudioPermission: () => boolean;
    bindAudioButtons: (container?: HTMLElement) => void;
    currentTab: string;
    currentView: string;
  }
}
export {};

